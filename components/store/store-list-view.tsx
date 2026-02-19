"use client";

import { useState, useMemo, useEffect } from "react";
import type { ProductData } from "@/app/buyer/actions";
import { StoreMapView } from "@/components/map/store-map-view";
import { MapPin, Store, List, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/favorite/favorite-button";

type StoreListViewProps = {
  products: ProductData[];
  favoriteStoreIds?: string[];
};

type ViewType = "list" | "map";

type StoreSummary = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  productCount: number;
  minPrice: number | null;
};

/**
 * 소비자 홈에서 사용하는 가게 리스트 / 지도 뷰
 *
 * - 현재 판매 중인 상품 목록을 기반으로 참여 가게를 도출
 * - 리스트 형식과 지도 형식으로 전환 가능
 * - 가게를 선택하면 해당 가게의 상품 목록 화면으로 이동
 */
export function StoreListView({ products, favoriteStoreIds = [] }: StoreListViewProps) {
  const [view, setView] = useState<ViewType>("list");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [localFavoriteIds, setLocalFavoriteIds] = useState<string[]>(favoriteStoreIds);

  // 서버에서 받은 초기값과 동기화 (페이지 재진입 시)
  useEffect(() => {
    setLocalFavoriteIds(favoriteStoreIds);
  }, [favoriteStoreIds]);

  // 하트 클릭 시 FavoriteButton이 발생시키는 이벤트 수신 → 목록/필터 즉시 반영
  useEffect(() => {
    const handleFavoriteChange = (event: Event) => {
      const e = event as CustomEvent<{ storeId: string; isFavorite: boolean }>;
      const { storeId, isFavorite } = e.detail ?? {};
      if (!storeId) return;
      setLocalFavoriteIds((prev) => {
        if (isFavorite) return prev.includes(storeId) ? prev : [...prev, storeId];
        return prev.filter((id) => id !== storeId);
      });
    };
    window.addEventListener("favoriteChanged", handleFavoriteChange);
    return () => window.removeEventListener("favoriteChanged", handleFavoriteChange);
  }, []);

  const stores = useMemo<StoreSummary[]>(() => {
    const map = new Map<string, StoreSummary>();

    products.forEach((product) => {
      const store = product.store;
      if (!store) return;

      const existing = map.get(store.id);
      const price = product.discount_price;

      if (existing) {
        existing.productCount += 1;
        if (existing.minPrice === null || price < existing.minPrice) {
          existing.minPrice = price;
        }
      } else {
        map.set(store.id, {
          id: store.id,
          name: store.name,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          imageUrl: store.image_url,
          productCount: 1,
          minPrice: price,
        });
      }
    });

    return Array.from(map.values());
  }, [products]);

  const filteredStores = useMemo<StoreSummary[]>(() => {
    if (!showOnlyFavorites) return stores;
    if (!localFavoriteIds.length) return [];
    return stores.filter((store) => localFavoriteIds.includes(store.id));
  }, [stores, showOnlyFavorites, localFavoriteIds]);

  const mapStores = filteredStores
    .filter(
      (s): s is Required<Pick<StoreSummary, "id" | "name" | "address">> &
        StoreSummary => s.latitude !== null && s.longitude !== null
    )
    .map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      latitude: s.latitude as number,
      longitude: s.longitude as number,
    }));

  const handleViewChange = (newView: "grid" | "list" | "map") => {
    // grid는 사용하지 않고 list/map만 사용
    if (newView === "grid") {
      setView("list");
    } else if (newView === "map") {
      setView("map");
    } else {
      setView("list");
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            주변 가게 {filteredStores.length}곳을 찾았어요
          </p>
          <div className="flex items-center gap-1 rounded-full border bg-background px-1 py-0.5">
            <Button
              type="button"
              variant={showOnlyFavorites ? "ghost" : "default"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowOnlyFavorites(false)}
            >
              전체
            </Button>
            <Button
              type="button"
              variant={showOnlyFavorites ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowOnlyFavorites(true)}
            >
              ❤️ 즐겨찾기
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-md border bg-background p-1">
          <Button
            type="button"
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              view === "list" && "bg-primary text-primary-foreground"
            )}
            onClick={() => handleViewChange("list")}
            title="리스트 뷰"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={view === "map" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              view === "map" && "bg-primary text-primary-foreground"
            )}
            onClick={() => handleViewChange("map")}
            title="지도 뷰"
          >
            <MapIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredStores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <p className="text-lg font-medium text-muted-foreground mb-2">
            아직 판매 중인 가게가 없습니다
          </p>
          <p className="text-sm text-muted-foreground">
            조금만 기다리면 주변 가게들의 마감 할인 상품이 올라올 거예요.
          </p>
        </div>
      ) : view === "map" ? (
        <div className="px-4 py-4">
          <StoreMapView stores={mapStores} />
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4">
          {filteredStores.map((store) => (
            <Link key={store.id} href={`/buyer/store/${store.id}`}>
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 min-w-0">
                  {store.imageUrl ? (
                    <img
                      src={store.imageUrl}
                      alt={store.name}
                      className="w-24 h-24 rounded-md object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <Store className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <p className="text-base font-semibold truncate">
                      {store.name}
                    </p>
                    {store.address && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{store.address}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      판매 중인 상품 {store.productCount}개
                      {store.minPrice !== null && (
                        <span className="ml-1">
                          (최저 {store.minPrice.toLocaleString("ko-KR")}원)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <FavoriteButton
                    storeId={store.id}
                    initialIsFavorite={localFavoriteIds.includes(store.id)}
                    variant="icon"
                  />
                  <span className="text-xs font-medium text-primary">
                    가게 보기 &gt;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

