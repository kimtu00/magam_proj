/**
 * Product ?�비?? * 
 * ?�품 관??비즈?�스 로직??처리?�니??
 */

import { createClient } from "@/lib/supabase/server";
import type {
  ProductData,
  ProductDetailData,
  FilterOptions,
  CreateProductInput,
  UpdateProductInput,
} from "./product.types";
import type { ServiceResult, ServiceResultVoid } from "../common.types";

export class ProductService {
  /**
   * ?�매 가?�한 ?�품 리스?��? 조회?�니??
   * 
   * 비즈?�스 규칙:
   * - status가 'AVAILABLE'???�품�?조회
   * - ?�업 마감 ?�간???�재보다 미래???�품�?조회
   * - (?�비??주소 ?�을 ?? 반경 N km ?�내 가게의 ?�품�?   * 
   * @param filter - ?�터 ?�션 (?�택)
   * @param buyerAddress - ?�비??주소 (거리 ?�터링용)
   * @param radiusKm - 검??반경 (km, 기본�? 3km)
   * @returns ?�매 가?�한 ?�품 리스??(거리???�렬)
   */
  static async findAvailable(
    filter?: FilterOptions,
    buyerAddress?: { latitude: number; longitude: number } | null,
    radiusKm: number = 3,
    favoriteStoreIds?: string[],
    buyerGradeLevel?: number
  ): Promise<ProductData[]> {
    try {
      const supabase = await createClient();
      const now = new Date().toISOString();

      // ?�비??주소가 ?�으�?거리 기반 ?�터�?(JOIN + calculate_distance)
      if (buyerAddress && buyerAddress.latitude && buyerAddress.longitude) {
        // stores?� JOIN?�여 거리 계산
        let query = supabase
          .from("products")
          .select(`
            *,
            stores!inner (
              id,
              name,
              address,
              latitude,
              longitude,
              image_url
            )
          `)
          .eq("status", "AVAILABLE")
          .gt("pickup_deadline", now)
          .gt("quantity", 0)
          .not("stores.latitude", "is", null)
          .not("stores.longitude", "is", null);

        // ?�공�??�터�? ?�네 ?�어�??�상(grade_level >= 2)?�면 early_access_from 기�?
        if (buyerGradeLevel !== undefined && buyerGradeLevel >= 2) {
          // ?�네 ?�어�??�상: early_access_from ?�후 ?�품 ?�시
          query = query.or(`early_access_from.is.null,early_access_from.lte.${now}`);
        } else {
          // ?�반 ?�용?? visible_from ?�후 ?�품�??�시
          query = query.or(`visible_from.is.null,visible_from.lte.${now}`);
        }

        // ?�터 ?�용
        if (filter?.is_instant !== undefined) {
          query = query.eq("is_instant", filter.is_instant);
        }

        if (filter?.max_price !== undefined) {
          query = query.lte("discount_price", filter.max_price);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching products with stores:", error);
          // fallback: ?�체 ?�품 조회
          return await this.findAvailableWithoutDistance(filter, buyerGradeLevel);
        }

        if (!data || data.length === 0) {
          return [];
        }

        // 거리 계산 �??�터�?(?�라?�언??�?
        const productsWithDistance = data
          .map((product: any) => {
            const store = Array.isArray(product.stores) ? product.stores[0] : product.stores;
            if (!store || store.latitude == null || store.longitude == null) {
              return null;
            }

            // Haversine 공식?�로 거리 계산
            const distance = this.calculateDistance(
              buyerAddress.latitude,
              buyerAddress.longitude,
              store.latitude,
              store.longitude
            );

            // is_early_access 계산: visible_from???�고 ?�직 미래?�면 ?�공�?기간
            const isEarlyAccess = product.visible_from && new Date(product.visible_from) > new Date(now);

            return {
              ...product,
              distance,
              store: store, // store ?�보 ?�함
              is_early_access: isEarlyAccess,
            };
          })
          .filter((p) => p !== null && p.distance <= radiusKm) // 반경 ???�품�?          .sort((a: any, b: any) => a.distance - b.distance); // 거리???�렬

        // stores ?�드 ?�거?�고 store�?변�?(ProductData ?�?�에 맞게)
        let finalProducts = productsWithDistance.map(({ stores, distance, ...product }: any) => product as ProductData);

        // 즐겨찾기 가�??�품 ?�선 ?�렬
        if (favoriteStoreIds && favoriteStoreIds.length > 0) {
          finalProducts = finalProducts.sort((a, b) => {
            const aIsFavorite = favoriteStoreIds.includes(a.store_id);
            const bIsFavorite = favoriteStoreIds.includes(b.store_id);
            
            // 즐겨찾기 가게�? 먼�?
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            
            // ????즐겨찾기거나 ?????�니�?기존 ?�서 ?��? (거리??
            return 0;
          });
        }

        return finalProducts;
      } else {
        // 주소가 ?�으�??�체 ?�품 조회
        return await this.findAvailableWithoutDistance(filter, buyerGradeLevel);
      }
    } catch (error) {
      console.error("Error in findAvailable:", error);
      return [];
    }
  }

  /**
   * Haversine 공식???�용?�여 ??지??간의 거리�?계산?�니??
   * 
   * @param lat1 - 지??1???�도
   * @param lon1 - 지??1??경도
   * @param lat2 - 지??2???�도
   * @param lon2 - 지??2??경도
   * @returns 거리 (km)
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // 지�?반�?�?(km)
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * ?��? ?�디?�으�?변?�합?�다.
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 거리 ?�터�??�이 ?�매 가?�한 ?�품??조회?�니?? (fallback)
   */
  private static async findAvailableWithoutDistance(
    filter?: FilterOptions,
    buyerGradeLevel?: number
  ): Promise<ProductData[]> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    let query = supabase
      .from("products")
      .select("*")
      .eq("status", "AVAILABLE")
      .gt("pickup_deadline", now)
      .gt("quantity", 0);

    // 선공개 필터
    if (buyerGradeLevel !== undefined && buyerGradeLevel >= 2) {
      query = query.or(`early_access_from.is.null,early_access_from.lte.${now}`);
    } else {
      query = query.or(`visible_from.is.null,visible_from.lte.${now}`);
    }

    // ?�터 ?�용
    if (filter?.is_instant !== undefined) {
      query = query.eq("is_instant", filter.is_instant);
    }

    if (filter?.max_price !== undefined) {
      query = query.lte("discount_price", filter.max_price);
    }

    // 최신???�렬
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    // is_early_access 계산
    const productsWithEarlyAccess = (data || []).map((product: any) => ({
      ...product,
      is_early_access: product.visible_from && new Date(product.visible_from) > new Date(now),
    }));

    return productsWithEarlyAccess;
  }

  /**
   * ?�품 ID�??�품 ?�세 ?�보�?조회?�니??
   * 
   * @param productId - ?�품 ID
   * @returns ?�품 ?�세 ?�보 (가�??�보 ?�함) ?�는 null
   */
  static async findById(productId: string): Promise<ProductDetailData | null> {
    try {
      const supabase = await createClient();

      // products ?�이블과 stores ?�이�?조인?�여 조회
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          stores (
            id,
            name,
            address,
            phone,
            latitude,
            longitude,
            image_url
          )
        `
        )
        .eq("id", productId)
        .single();

      if (error) {
        // ?�품???�는 경우 (PGRST116: no rows returned)
        if (error.code === "PGRST116") {
          return null;
        }
        console.error("Error fetching product:", error);
        return null;
      }

      if (!data) {
        return null;
      }

      // ?�??변??(stores가 배열�?반환?��?�?�?번째 ?�소 ?�용)
      const product = data as any;
      const store = Array.isArray(product.stores)
        ? product.stores[0]
        : product.stores;

      if (!store) {
        console.error("Store not found for product:", productId);
        return null;
      }

      return {
        id: product.id,
        store_id: product.store_id,
        name: product.name,
        original_price: product.original_price,
        discount_price: product.discount_price,
        image_url: product.image_url,
        is_instant: product.is_instant,
        pickup_deadline: product.pickup_deadline,
        status: product.status,
        quantity: product.quantity,
        weight_value: product.weight_value,
        weight_unit: product.weight_unit,
        created_at: product.created_at,
        store: {
          id: store.id,
          name: store.name,
          address: store.address,
          phone: store.phone,
          latitude: store.latitude,
          longitude: store.longitude,
        },
      } as ProductDetailData;
    } catch (error) {
      console.error("Error in findById:", error);
      return null;
    }
  }

  /**
   * 가�?ID�??�품 리스?��? 조회?�니??
   * 
   * ?�약 ?�량???�께 집계?�여 반환?�니??
   * 
   * @param storeId - 가�?ID
   * @param buyerGradeLevel - 구매???�급 (?�공�??�터링용)
   * @returns ?�당 가게의 ?�품 리스??(?�약 ?�량 ?�함)
   */
  /**
   * ?�매?�용 - 가게의 모든 ?�품 조회 (?�터�??�음)
   * 
   * @param storeId - 가�?ID
   * @returns 모든 ?�품 목록
   */
  static async findAllByStoreId(storeId: string): Promise<ProductData[]> {
    try {
      const supabase = await createClient();
      
      // 1. 모든 ?�품 조회 (?�터�??�음)
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (productsError) {
        console.error("Error fetching all products:", productsError);
        return [];
      }

      if (!products || products.length === 0) {
        return [];
      }

      // 2. ?�약 ?�량 조회
      try {
        const productIds = products.map((p) => p.id);
        
        if (productIds.length === 0) {
          return products as ProductData[];
        }

        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("product_id, quantity")
          .in("product_id", productIds)
          .eq("status", "RESERVED");

        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
          return products as ProductData[];
        }

        // 3. ?�품�??�약 ?�량 집계
        const reservedQuantityMap = new Map<string, number>();
        (orders || []).forEach((order: any) => {
          const current = reservedQuantityMap.get(order.product_id) || 0;
          reservedQuantityMap.set(order.product_id, current + (order.quantity || 0));
        });

        // 4. ?�품???�약 ?�량 추�?
        const productsWithReserved = products.map((product) => ({
          ...product,
          reserved_quantity: reservedQuantityMap.get(product.id) || 0,
        })) as ProductData[];

        return productsWithReserved;
        
      } catch (ordersException) {
        console.error("Exception while fetching orders:", ordersException);
        return products as ProductData[];
      }
      
    } catch (error) {
      console.error("Error in findAllByStoreId:", error);
      return [];
    }
  }

  /**
   * 구매?�용 - 가게의 ?�매 가?�한 ?�품�?조회
   * 
   * @param storeId - 가�?ID
   * @param buyerGradeLevel - 구매???�급 (?�공�??�터링용)
   * @returns ?�매 가?�한 ?�품 목록
   */
  static async findByStoreId(storeId: string, buyerGradeLevel?: number): Promise<ProductData[]> {
    try {
      const supabase = await createClient();
      const now = new Date().toISOString();
      
      // 1. ?�품 조회 (?�매 가?�한 것만)
      let query = supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .eq("status", "AVAILABLE")
        .gt("pickup_deadline", now)
        .gt("quantity", 0);

      // 선공개 필터
      if (buyerGradeLevel !== undefined && buyerGradeLevel >= 2) {
        query = query.or(`early_access_from.is.null,early_access_from.lte.${now}`);
      } else {
        query = query.or(`visible_from.is.null,visible_from.lte.${now}`);
      }

      const { data: products, error: productsError } = await query.order("created_at", { ascending: false });

      if (productsError) {
        console.error("Error fetching products:", productsError);
        return [];
      }

      if (!products || products.length === 0) {
        return [];
      }

      // 2. ?�약 ?�량 조회 (?�러 발생 ?�에???�품 목록?� 반환)
      try {
        const productIds = products.map((p) => p.id);
        
        if (productIds.length === 0) {
          return products.map((product) => ({
            ...product,
            reserved_quantity: 0,
          })) as ProductData[];
        }

        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("product_id, quantity")
          .in("product_id", productIds)
          .eq("status", "RESERVED");

        if (ordersError) {
          // ?�세???�러 로깅 (?�체 ?�러 객체 출력)
          console.error("Error fetching orders - Full error:", ordersError);
          console.error("Error fetching orders - JSON:", JSON.stringify(ordersError, null, 2));
          
          // ?�러 발생?�도 ?�품 목록?� 반환 (?�약 ?�량 0?�로)
          return products.map((product) => ({
            ...product,
            reserved_quantity: 0,
          })) as ProductData[];
        }

        // 3. ?�품�??�약 ?�량 집계
        const reservedQuantityMap = new Map<string, number>();
        (orders || []).forEach((order: any) => {
          const current = reservedQuantityMap.get(order.product_id) || 0;
          reservedQuantityMap.set(order.product_id, current + (order.quantity || 0));
        });

        // 4. ?�품???�약 ?�량 �?is_early_access 추�?
        const productsWithReserved = products.map((product) => ({
          ...product,
          reserved_quantity: reservedQuantityMap.get(product.id) || 0,
          is_early_access: product.visible_from && new Date(product.visible_from) > new Date(now),
        })) as ProductData[];

        return productsWithReserved;
        
      } catch (ordersException) {
        // orders 조회 ?�패 ?�에???�품 목록?� 반환
        console.error("Exception while fetching orders:", ordersException);
        return products.map((product) => ({
          ...product,
          reserved_quantity: 0,
          is_early_access: product.visible_from && new Date(product.visible_from) > new Date(now),
        })) as ProductData[];
      }
      
    } catch (error) {
      console.error("Error in findByStoreId:", error);
      return [];
    }
  }

  /**
   * ?�품???�성?�니??
   * 
   * @param storeId - 가�?ID
   * @param input - ?�품 ?�성 ?�보
   * @returns ?�성???�품 ?�보 ?�는 ?�러
   */
  static async create(
    storeId: string,
    input: CreateProductInput
  ): Promise<ServiceResult<ProductData>> {
    try {
      const supabase = await createClient();
      
      // 1. ?�공�?기간 ?�정�?조회
      const { AppConfigService } = await import("@/services/config");
      const earlyAccessMinutes = await AppConfigService.getNumber("EARLY_ACCESS_MINUTES", 10);
      
      // 2. ?�재 ?�각 �?공개 ?�각 계산
      const now = new Date();
      const earlyAccessFrom = now.toISOString();
      const visibleFrom = new Date(now.getTime() + earlyAccessMinutes * 60 * 1000).toISOString();
      
      // 3. ?�품 ?�성
      const { data, error } = await supabase
        .from("products")
        .insert({
          store_id: storeId,
          name: input.name.trim(),
          original_price: input.original_price,
          discount_price: input.discount_price,
          image_url: input.image_url,
          is_instant: input.is_instant,
          pickup_deadline: input.pickup_deadline,
          status: "AVAILABLE",
          quantity: input.quantity,
          weight_value: input.weight_value ?? null,
          weight_unit: input.weight_unit || 'g',
          category: input.category || "기�?",
          template_id: input.template_id || null,
          early_access_from: earlyAccessFrom,
          visible_from: visibleFrom,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating product:", error);
        return { success: false, error: "?�품 ?�록???�패?�습?�다." };
      }

      return { success: true, data: data as ProductData };
    } catch (error) {
      console.error("Error in create:", error);
      return { success: false, error: "?�스???�류가 발생?�습?�다." };
    }
  }

  /**
   * ?�품 ?�태�??�데?�트?�니??
   * 
   * 비즈?�스 규칙:
   * - AVAILABLE ??SOLD: ?�용 (?�장?�이 직접 ?�매)
   * - RESERVED ??SOLD: 불허 (?�약 중인 ?�품?� ?�업 ?�료 ??처리)
   * - SOLD ??SOLD: 불허 (?��? ?�매 ?�료)
   * 
   * @param productId - ?�품 ID
   * @param storeId - 가�?ID (권한 ?�인??
   * @param newStatus - ?�로???�태
   * @returns ?�공 ?��?
   */
  static async updateStatus(
    productId: string,
    storeId: string,
    newStatus: "SOLD"
  ): Promise<ServiceResultVoid> {
    try {
      const supabase = await createClient();

      // 1. ?�재 ?�품 ?�태 조회
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("status")
        .eq("id", productId)
        .eq("store_id", storeId)
        .single();

      if (fetchError || !product) {
        console.error("Error fetching product:", fetchError);
        return { success: false, error: "?�품??찾을 ???�습?�다." };
      }

      // 2. RESERVED ?�태??SOLD�?변�?불�? (비즈?�스 규칙)
      if (product.status === "RESERVED") {
        return { 
          success: false, 
          error: "?�약 중인 ?�품?� ?�매 ?�료 처리?????�습?�다. ?�비?��? ?�업?�야 ?�니??" 
        };
      }

      // 3. ?��? SOLD??경우
      if (product.status === "SOLD") {
        return { 
          success: false, 
          error: "?��? ?�매 ?�료???�품?�니??" 
        };
      }

      // 4. AVAILABLE ??SOLD 변�?(?�상 케?�스)
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", productId)
        .eq("store_id", storeId);

      if (error) {
        console.error("Error updating product status:", error);
        return { success: false, error: "?�품 ?�태 변경에 ?�패?�습?�다." };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in updateStatus:", error);
      return { success: false, error: "?�스???�류가 발생?�습?�다." };
    }
  }

  /**
   * ?�품 ?�보�??�데?�트?�니??
   * 
   * @param productId - ?�품 ID
   * @param storeId - 가�?ID (권한 ?�인??
   * @param input - ?�데?�트???�품 ?�보
   * @returns ?�데?�트???�품 ?�보 ?�는 ?�러
   */
  static async update(
    productId: string,
    storeId: string,
    input: UpdateProductInput
  ): Promise<ServiceResult<ProductData>> {
    try {
      const supabase = await createClient();

      // 업데이트 데이터 준비
      const updateData: Record<string, any> = {};
      
      if (input.name !== undefined) {
        updateData.name = input.name.trim();
      }
      if (input.original_price !== undefined) {
        updateData.original_price = input.original_price;
      }
      if (input.discount_price !== undefined) {
        updateData.discount_price = input.discount_price;
      }
      if (input.image_url !== undefined) {
        updateData.image_url = input.image_url;
      }
      if (input.is_instant !== undefined) {
        updateData.is_instant = input.is_instant;
      }
      if (input.pickup_deadline !== undefined) {
        updateData.pickup_deadline = input.pickup_deadline;
      }
      if (input.quantity !== undefined) {
        updateData.quantity = input.quantity;
      }

      // ??가게의 ?�품?��? ?�인?�면???�데?�트
      const { data, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId)
        .eq("store_id", storeId)
        .select()
        .single();

      if (error) {
        console.error("Error updating product:", error);
        return { success: false, error: "?�품 ?�정???�패?�습?�다." };
      }

      return { success: true, data: data as ProductData };
    } catch (error) {
      console.error("Error in update:", error);
      return { success: false, error: "?�스???�류가 발생?�습?�다." };
    }
  }

  /**
   * 매장 ?�매 처리
   * 
   * @param productId - ?�품 ID
   * @param storeId - 가�?ID (권한 ?�인??
   * @param quantity - ?�매 ?�량
   * @returns ?��? ?�량 ?�는 ?�러
   */
  static async sellInStore(
    productId: string,
    storeId: string,
    quantity: number
  ): Promise<ServiceResult<{ remaining_quantity: number }>> {
    try {
      console.log('?�� Service - sellInStore ?�출:', { productId, storeId, quantity });
      const supabase = await createClient();

      console.log('?�� Supabase RPC ?�출: sell_in_store');
      const { data, error } = await supabase.rpc("sell_in_store", {
        p_product_id: productId,
        p_store_id: storeId,
        p_quantity: quantity,
      });

      console.log('?�� Supabase RPC ?�답:', { data, error });

      if (error) {
        console.error("??Supabase RPC ?�류:", error);
        console.error("???�류 ?�세:", JSON.stringify(error, null, 2));
        return { success: false, error: "매장 ?�매 처리 �??�류가 발생?�습?�다. (RPC ?�수가 존재?��? ?�을 ???�습?�다)" };
      }

      const result = data as {
        success: boolean;
        message?: string;
        remaining_quantity?: number;
      };

      console.log('?�� RPC 결과 ?�싱:', result);

      if (!result.success) {
        console.error('??RPC ?�수 ?��? ?�패:', result.message);
        return {
          success: false,
          error: result.message || "매장 ?�매 처리???�패?�습?�다.",
        };
      }

      console.log('??매장 ?�매 ?�공! ?��? ?�량:', result.remaining_quantity);
      return {
        success: true,
        data: { remaining_quantity: result.remaining_quantity || 0 },
      };
    } catch (error) {
      console.error("??Exception in sellInStore:", error);
      return { success: false, error: "?�스???�류가 발생?�습?�다." };
    }
  }

  /**
   * ?�량 ?�데?�트 (증�?�?가??
   * 
   * @param productId - ?�품 ID
   * @param storeId - 가�?ID (권한 ?�인??
   * @param newQuantity - ?�로???�량
   * @returns ?�공 ?��?
   */
  static async updateQuantity(
    productId: string,
    storeId: string,
    newQuantity: number
  ): Promise<ServiceResultVoid> {
    try {
      const supabase = await createClient();

      // ?�재 ?�량 조회
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("quantity")
        .eq("id", productId)
        .eq("store_id", storeId)
        .single();

      if (fetchError || !product) {
        return { success: false, error: "?�품??찾을 ???�습?�다." };
      }

      // 감소??불�? (비즈?�스 규칙)
      if (newQuantity < product.quantity) {
        return {
          success: false,
          error: "?�량 감소??'매장 ?�매' 기능???�용?�세??",
        };
      }

      // ?�량 ?�데?�트
      const { error } = await supabase
        .from("products")
        .update({ quantity: newQuantity })
        .eq("id", productId)
        .eq("store_id", storeId);

      if (error) {
        console.error("Error updating quantity:", error);
        return { success: false, error: "?�량 ?�데?�트???�패?�습?�다." };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in updateQuantity:", error);
      return { success: false, error: "?�스???�류가 발생?�습?�다." };
    }
  }
}


