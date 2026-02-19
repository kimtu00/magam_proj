"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FeedProductCard } from "@/components/product/feed-product-card";
import { FeedProductListItem } from "@/components/product/feed-product-list-item";
import { ViewToggle } from "@/components/product/view-toggle";
import { FeedFilterTabs } from "@/components/product/feed-filter-tabs";
import { SortSelect, type SortOption } from "@/components/product/sort-select";
import { EmptyFeed } from "@/components/product/empty-feed";
import { ProductListSkeleton } from "@/components/product/product-list-skeleton";
import { StoreMapView } from "@/components/map/store-map-view";
import { getAvailableProducts } from "@/app/buyer/actions";
import { getFavoriteStoreIds } from "@/actions/favorite";
import type { FilterOptions, ProductData } from "@/app/buyer/actions";
import type { BuyerAddress } from "@/actions/address";

type ViewType = "grid" | "list" | "map";

/**
 * 상품 리스트 뷰 컴포넌트 (Client Component)
 *
 * 그리드/리스트 뷰 전환 기능을 포함한 상품 리스트입니다.
 */
export function ProductListView({ 
  filter,
  buyerAddress,
  initialProducts = [],
  initialFavoriteStoreIds = [],
}: { 
  filter?: FilterOptions;
  buyerAddress: BuyerAddress | null;
  initialProducts?: ProductData[];
  initialFavoriteStoreIds?: string[];
}) {
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("filter") || "all";
  
  const [view, setView] = useState<ViewType>("grid");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [products, setProducts] = useState<ProductData[]>(initialProducts); // 초기 데이터 사용
  const [isLoading, setIsLoading] = useState(false); // 초기 데이터가 있으므로 false
  const [radiusKm, setRadiusKm] = useState<number>(3); // 기본값 3km
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<string[]>(initialFavoriteStoreIds); // 초기 데이터 사용

  // localStorage에서 반경 로드
  useEffect(() => {
    const saved = localStorage.getItem("searchRadiusKm");
    if (saved) {
      const parsed = parseInt(saved);
      if ([1, 3, 5].includes(parsed)) {
        setRadiusKm(parsed);
      }
    }
  }, []);

  // storage event 리스너 (다른 컴포넌트에서 변경 시 감지)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "searchRadiusKm" && e.newValue) {
        const parsed = parseInt(e.newValue);
        if ([1, 3, 5].includes(parsed)) {
          setRadiusKm(parsed);
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 즐겨찾기 목록 로드 (초기 데이터가 없을 경우에만)
  useEffect(() => {
    // 초기 데이터가 있으면 스킵
    if (initialFavoriteStoreIds.length > 0) return;
    
    async function loadFavorites() {
      const ids = await getFavoriteStoreIds();
      setFavoriteStoreIds(ids);
    }
    loadFavorites();
  }, [initialFavoriteStoreIds]);

  // 즐겨찾기 변경 이벤트 리스너 (필터링을 위해 필요)
  useEffect(() => {
    const handleFavoriteChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ storeId: string; isFavorite: boolean }>;
      const { storeId, isFavorite } = customEvent.detail;
      
      setFavoriteStoreIds((prev) => {
        if (isFavorite) {
          // 추가 (중복 방지)
          return prev.includes(storeId) ? prev : [...prev, storeId];
        } else {
          // 제거
          return prev.filter((id) => id !== storeId);
        }
      });
    };

    window.addEventListener('favoriteChanged', handleFavoriteChange);
    
    return () => {
      window.removeEventListener('favoriteChanged', handleFavoriteChange);
    };
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      const data = await getAvailableProducts(
        filter, 
        buyerAddress, 
        buyerAddress ? radiusKm : undefined // 주소 있을 때만 반경 적용
      );
      setProducts(data);
      setIsLoading(false);
    }
    loadProducts();
  }, [filter, buyerAddress, radiusKm]);

  // localStorage에서 뷰 타입 및 정렬 옵션 불러오기
  useEffect(() => {
    const savedView = localStorage.getItem("productViewType") as ViewType | null;
    if (savedView === "grid" || savedView === "list") {
      setView(savedView);
    }
    
    const savedSort = localStorage.getItem("productSortOption") as SortOption | null;
    if (savedSort && ["newest", "discount_desc", "discount_asc", "price_desc", "price_asc"].includes(savedSort)) {
      setSortOption(savedSort);
    }
  }, []);

  // 뷰 타입 변경 시 localStorage에 저장
  const handleViewChange = (newView: ViewType) => {
    setView(newView);
    localStorage.setItem("productViewType", newView);
  };

  // 정렬 옵션 변경 시 localStorage에 저장
  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
    localStorage.setItem("productSortOption", newSort);
  };

  // 정렬 및 필터링된 상품 리스트
  const sortedAndFilteredProducts = useMemo(() => {
    let filtered = [...products];
    
    // 즐겨찾기 필터 적용
    if (currentFilter === "favorite") {
      filtered = filtered.filter(p => favoriteStoreIds.includes(p.store_id));
    }
    
    // 정렬 적용
    switch (sortOption) {
      case "newest":
        // 최신순 (created_at 기준, 이미 서버에서 정렬됨)
        return filtered;
        
      case "discount_desc": {
        // 할인율 높은순
        return filtered.sort((a, b) => {
          const discountRateA = a.original_price > 0 && a.discount_price > 0
            ? ((a.original_price - a.discount_price) / a.original_price) * 100
            : 0;
          const discountRateB = b.original_price > 0 && b.discount_price > 0
            ? ((b.original_price - b.discount_price) / b.original_price) * 100
            : 0;
          return discountRateB - discountRateA;
        });
      }
      
      case "discount_asc": {
        // 할인율 낮은순
        return filtered.sort((a, b) => {
          const discountRateA = a.original_price > 0 && a.discount_price > 0
            ? ((a.original_price - a.discount_price) / a.original_price) * 100
            : 0;
          const discountRateB = b.original_price > 0 && b.discount_price > 0
            ? ((b.original_price - b.discount_price) / b.original_price) * 100
            : 0;
          return discountRateA - discountRateB;
        });
      }
      
      case "price_desc":
        // 가격 높은순 (할인가 기준)
        return filtered.sort((a, b) => b.discount_price - a.discount_price);
        
      case "price_asc":
        // 가격 낮은순 (할인가 기준)
        return filtered.sort((a, b) => a.discount_price - b.discount_price);
        
      default:
        return filtered;
    }
  }, [products, sortOption, currentFilter, favoriteStoreIds]);

  if (isLoading) {
    return (
      <ProductListSkeleton
        view={view}
        count={view === "grid" || view === "map" ? 6 : 4}
      />
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-2">
        <SortSelect value={sortOption} onValueChange={handleSortChange} />
        <ViewToggle view={view} onViewChange={handleViewChange} />
      </div>
      
      <FeedFilterTabs />
      
      {sortedAndFilteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          {currentFilter === "favorite" ? (
            <>
              <p className="text-lg font-medium text-muted-foreground mb-2">
                즐겨찾기한 가게가 없습니다
              </p>
              <p className="text-sm text-muted-foreground">
                마음에 드는 가게의 ❤️를 클릭해보세요!
              </p>
            </>
          ) : (
            <EmptyFeed />
          )}
        </div>
      ) : view === "map" ? (
        <div className="px-4 py-4">
          <StoreMapView
            stores={Array.from(
              sortedAndFilteredProducts.reduce(
                (
                  map,
                  product
                ) => {
                  const store = product.store;
                  if (
                    !store ||
                    store.latitude == null ||
                    store.longitude == null
                  ) {
                    return map;
                  }
                  if (!map.has(store.id)) {
                    map.set(store.id, {
                      id: store.id,
                      name: store.name,
                      address: store.address,
                      latitude: store.latitude,
                      longitude: store.longitude,
                    });
                  }
                  return map;
                },
                new Map<
                  string,
                  {
                    id: string;
                    name: string;
                    address: string | null;
                    latitude: number;
                    longitude: number;
                  }
                >()
              ).values()
            )}
          />
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 px-4 py-4">
          {sortedAndFilteredProducts.map((product) => (
            <FeedProductCard
              key={product.id}
              product={product}
              isFavorite={favoriteStoreIds.includes(product.store_id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4">
          {sortedAndFilteredProducts.map((product) => (
            <FeedProductListItem
              key={product.id}
              product={product}
              isFavorite={favoriteStoreIds.includes(product.store_id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

