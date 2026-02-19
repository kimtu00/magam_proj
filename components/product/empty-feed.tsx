/**
 * 피드 빈 상태 컴포넌트
 *
 * 등록된 상품이 없을 때 표시되는 컴포넌트입니다.
 */
export function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-muted-foreground">
          지금 등록된 상품이 없습니다
        </p>
        <p className="text-sm text-muted-foreground">
          곧 새로운 마감 할인 상품이 등록될 예정입니다
        </p>
      </div>
    </div>
  );
}
