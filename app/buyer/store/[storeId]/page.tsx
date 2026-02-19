import { notFound } from "next/navigation";
import { StoreService } from "@/services/store";
import { ProductService } from "@/services/product";
import { getFavoriteStoreIdsServer } from "@/actions/favorite";
import Link from "next/link";
import { FeedProductCard } from "@/components/product/feed-product-card";
import { MapPin } from "lucide-react";
import { StoreMapButton } from "@/components/map/store-map-button";
import { FavoriteButton } from "@/components/favorite/favorite-button";

interface StoreProductsPageProps {
  params: Promise<{ storeId: string }>;
}

export default async function StoreProductsPage(props: StoreProductsPageProps) {
  const { storeId } = await props.params;

  const [store, products, favoriteStoreIds] = await Promise.all([
    StoreService.findById(storeId),
    ProductService.findByStoreId(storeId),
    getFavoriteStoreIdsServer(),
  ]);

  if (!store) {
    notFound();
  }

  const isFavorite = favoriteStoreIds.includes(store.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-1 border-b bg-background px-4 pb-3 pt-4">
        <Link
          href="/buyer"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← 참여 가게 목록으로
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <FavoriteButton
            storeId={store.id}
            initialIsFavorite={isFavorite}
            variant="icon"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {store.address && (
            <>
              <MapPin className="h-4 w-4" />
              <span className="truncate">{store.address}</span>
            </>
          )}
          <div className="ml-2">
            <StoreMapButton
              storeName={store.name}
              address={store.address}
              phone={store.phone}
              latitude={store.latitude}
              longitude={store.longitude}
            />
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <p className="text-lg font-medium text-muted-foreground mb-2">
            아직 등록된 마감 할인 상품이 없습니다
          </p>
          <p className="text-sm text-muted-foreground">
            이 가게가 상품을 등록하면 여기에서 바로 확인하실 수 있어요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 px-4 py-4">
          {products.map((product) => (
            <FeedProductCard
              key={product.id}
              product={product}
              isFavorite={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

