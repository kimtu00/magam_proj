/**
 * Favorite Store 도메인 타입 정의
 */

/**
 * 즐겨찾기 가게 데이터 타입
 */
export interface FavoriteStoreData {
  id: string;
  user_id: string;
  store_id: string;
  created_at: string;
}

/**
 * 즐겨찾기 추가 입력 타입
 */
export interface CreateFavoriteInput {
  user_id: string;
  store_id: string;
}


