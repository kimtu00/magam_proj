/**
 * 역할 변경 시 모든 캐시를 정리하는 유틸리티 함수
 * 
 * 로그인 또는 역할 변경 시 이전 역할의 데이터가 남아있는 것을 방지합니다.
 */

/**
 * 모든 앱 관련 캐시를 정리합니다 (localStorage, sessionStorage, Cache API)
 * 
 * @returns 성공 여부
 */
export function clearAllCaches(): boolean {
  console.log("🧹 캐시 정리 시작...");
  
  try {
    // 1. localStorage 정리 (주요 앱 데이터)
    const keysToRemove = [
      'pendingRole',       // 대기 중인 역할
      'viewType',          // 제품 리스트 뷰 타입 (grid/list)
      'sortOption',        // 정렬 옵션
      'radiusKm',          // 검색 반경 (1km, 3km, 5km)
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`  ✅ localStorage.${key} 제거됨`);
      }
    });
    
    // 2. sessionStorage 정리
    const sessionStorageLength = sessionStorage.length;
    if (sessionStorageLength > 0) {
      sessionStorage.clear();
      console.log(`  ✅ sessionStorage 정리됨 (${sessionStorageLength}개 항목)`);
    }
    
    // 3. 캐시 API 정리 (Service Worker가 있는 경우)
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then(names => {
        if (names.length > 0) {
          names.forEach(name => {
            caches.delete(name);
            console.log(`  ✅ Cache API "${name}" 정리됨`);
          });
        }
      }).catch(err => {
        console.warn("⚠️ Cache API 정리 중 오류:", err);
      });
    }
    
    console.log("✅ 캐시 정리 완료");
    return true;
  } catch (error) {
    console.error("❌ 캐시 정리 중 오류:", error);
    return false;
  }
}

/**
 * 특정 localStorage 키만 정리 (Clerk 인증 토큰은 유지)
 * 
 * 완전한 로그아웃 없이 앱 데이터만 정리할 때 사용
 */
export function clearAppCache(): void {
  console.log("🧹 앱 캐시 정리 시작...");
  
  // Clerk 관련 키와 중요한 임시 데이터는 유지
  const keysToKeep = [
    'clerk-db-jwt',          // Clerk JWT 토큰
    '__clerk_client_jwt',    // Clerk 클라이언트 JWT
    '__session',             // 세션 데이터
    'pendingRole',           // 대기 중인 역할 (로그인 완료 후 역할 설정에 필요)
  ];
  
  const allKeys = Object.keys(localStorage);
  let removedCount = 0;
  
  allKeys.forEach(key => {
    // Clerk 관련 키가 아니고, __clerk로 시작하지 않으면 제거
    if (!keysToKeep.includes(key) && !key.startsWith('__clerk')) {
      localStorage.removeItem(key);
      console.log(`  ✅ ${key} 제거됨`);
      removedCount++;
    }
  });
  
  // sessionStorage도 정리
  sessionStorage.clear();
  
  console.log(`✅ 앱 캐시 정리 완료 (${removedCount}개 항목 제거, pendingRole 유지)`);
}

/**
 * 로그아웃 시 모든 데이터 완전 정리
 */
export function clearAllDataOnLogout(): void {
  console.log("🗑️ 로그아웃 - 모든 데이터 정리 시작...");
  
  try {
    // localStorage 완전 정리
    localStorage.clear();
    console.log("  ✅ localStorage 완전 정리");
    
    // sessionStorage 완전 정리
    sessionStorage.clear();
    console.log("  ✅ sessionStorage 완전 정리");
    
    // 캐시 API 정리
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
        console.log("  ✅ Cache API 완전 정리");
      });
    }
    
    console.log("✅ 로그아웃 데이터 정리 완료");
  } catch (error) {
    console.error("❌ 로그아웃 데이터 정리 중 오류:", error);
  }
}

