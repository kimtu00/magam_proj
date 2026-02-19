/**
 * Store 도메인 타입 정의
 */

/**
 * 가게 정보 타입
 */
export interface StoreData {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

/**
 * 가게 생성 입력 타입
 */
export interface CreateStoreInput {
  name: string;
  address?: string;
  phone?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * 가게 수정 입력 타입
 */
export interface UpdateStoreInput {
  name?: string;
  address?: string;
  phone?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
}

