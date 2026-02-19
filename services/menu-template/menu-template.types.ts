/**
 * MenuTemplate 도메인 타입 정의
 */

/**
 * 메뉴 템플릿 타입
 */
export interface MenuTemplateData {
  id: string;
  store_id: string;
  name: string;
  original_price: number;
  image_url: string | null;
  is_instant: boolean;
  weight_value?: number | null;
  weight_unit?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 메뉴 템플릿 생성 입력 타입
 */
export interface CreateMenuTemplateInput {
  name: string;
  original_price: number;
  image_url?: string;
  is_instant?: boolean;
  weight_value?: number;
  weight_unit?: string;
  category?: string;
}

/**
 * 메뉴 템플릿 수정 입력 타입
 */
export interface UpdateMenuTemplateInput {
  name?: string;
  original_price?: number;
  image_url?: string;
  is_instant?: boolean;
  weight_value?: number;
  weight_unit?: string;
  category?: string;
}


