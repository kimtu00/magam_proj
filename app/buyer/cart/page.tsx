import { getCartItems } from "@/actions/cart";
import { EmptyCart } from "@/components/cart/empty-cart";
import { CartPageClient } from "@/components/cart/cart-page-client";

/**
 * 장바구니 페이지
 * 
 * 장바구니에 담긴 상품들을 조회하고 선택하여 예약할 수 있습니다.
 */
export default async function CartPage() {
  const cartItems = await getCartItems();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <EmptyCart />
      </div>
    );
  }

  return <CartPageClient cartItems={cartItems} />;
}
