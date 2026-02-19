# Clerk 한국어 로컬라이제이션 가이드

이 문서는 Clerk 컴포넌트를 한국어로 설정하는 방법을 설명합니다.

## 개요

Clerk는 `@clerk/localizations` 패키지를 통해 다양한 언어의 로컬라이제이션을 제공합니다. 이 프로젝트는 한국어(`koKR`) 로컬라이제이션을 사용하도록 설정되어 있습니다.

## 현재 설정

### 기본 설정

프로젝트의 `app/layout.tsx`에서 한국어 로컬라이제이션이 적용되어 있습니다:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { koreanLocalization } from "@/lib/clerk/localization";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={koreanLocalization}>
      <html lang="ko">
        {/* ... */}
      </html>
    </ClerkProvider>
  );
}
```

### 커스텀 로컬라이제이션

`lib/clerk/localization.ts` 파일에서 기본 한국어 로컬라이제이션을 확장하여 커스텀 메시지를 추가할 수 있습니다.

## 지원되는 언어

Clerk는 다음 언어를 지원합니다:

- 한국어 (`koKR`) - 현재 사용 중
- 영어 (`enUS`, `enGB`)
- 일본어 (`jaJP`)
- 중국어 (`zhCN`, `zhTW`)
- 기타 50개 이상의 언어

전체 목록은 [Clerk 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization#languages)를 참고하세요.

## 커스텀 로컬라이제이션

### 기본 사용법

기본 한국어 로컬라이제이션을 사용하려면:

```tsx
import { koKR } from "@clerk/localizations";

<ClerkProvider localization={koKR}>
  {/* ... */}
</ClerkProvider>
```

### 커스텀 메시지 추가

`lib/clerk/localization.ts` 파일을 수정하여 커스텀 메시지를 추가할 수 있습니다:

```typescript
import { koKR } from "@clerk/localizations";
import type { LocalizationResource } from "@clerk/types";

export const koreanLocalization: LocalizationResource = {
  ...koKR,
  unstable__errors: {
    ...koKR.unstable__errors,
    // 커스텀 에러 메시지
    not_allowed_access: "접근이 허용되지 않은 이메일 도메인입니다. 지원팀에 문의하세요.",
  },
};
```

### 에러 메시지 커스터마이징

Clerk의 기본 에러 메시지를 커스터마이징할 수 있습니다. 사용 가능한 에러 키는 [영어 로컬라이제이션 파일](https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts)에서 `unstable__errors` 객체를 확인하세요.

**예시: 접근 제한 에러 메시지 커스터마이징**

```typescript
export const koreanLocalization: LocalizationResource = {
  ...koKR,
  unstable__errors: {
    ...koKR.unstable__errors,
    not_allowed_access:
      "이 이메일 도메인은 접근이 허용되지 않습니다. 회사 이메일 도메인을 허용 목록에 추가하려면 지원팀에 이메일을 보내주세요.",
  },
};
```

### 특정 컴포넌트 텍스트 커스터마이징

특정 컴포넌트의 텍스트를 커스터마이징할 수 있습니다:

```typescript
export const koreanLocalization: LocalizationResource = {
  ...koKR,
  signUp: {
    ...koKR.signUp,
    start: {
      ...koKR.signUp?.start,
      subtitle: "{{applicationName}}에 접근하려면",
    },
    emailCode: {
      ...koKR.signUp?.emailCode,
      subtitle: "{{applicationName}}에 접근하려면",
    },
  },
};
```

## 주의사항

### 실험적 기능

> [!WARNING]
> 로컬라이제이션 기능은 현재 실험적(experimental) 상태입니다. 문제가 발생하면 [Clerk 지원팀](https://clerk.com/contact/support)에 문의하세요.

### 제한사항

- 로컬라이제이션은 **Clerk 컴포넌트**의 텍스트만 변경합니다
- **Clerk Account Portal** (호스팅된 계정 포털)은 여전히 영어로 표시됩니다
- 일부 텍스트는 아직 커스터마이징할 수 없을 수 있습니다

## 테스트 방법

1. 개발 서버 시작:
```bash
pnpm dev
```

2. 로그인/회원가입 페이지 확인:
   - `/sign-in` 또는 `/sign-up` 페이지 접속
   - 모든 텍스트가 한국어로 표시되는지 확인

3. 에러 메시지 확인:
   - 잘못된 이메일로 로그인 시도
   - 에러 메시지가 한국어로 표시되는지 확인

## 참고 자료

- [Clerk 로컬라이제이션 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization)
- [@clerk/localizations 패키지](https://www.npmjs.com/package/@clerk/localizations)
- [영어 로컬라이제이션 소스 코드](https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts) (커스터마이징 참고용)

## 문제 해결

### 로컬라이제이션이 적용되지 않음

1. `@clerk/localizations` 패키지가 설치되어 있는지 확인:
```bash
pnpm list @clerk/localizations
```

2. `ClerkProvider`에 `localization` prop이 올바르게 전달되었는지 확인

3. 개발 서버를 재시작

### 특정 텍스트가 여전히 영어로 표시됨

- 해당 텍스트가 아직 로컬라이제이션을 지원하지 않을 수 있습니다
- 커스텀 로컬라이제이션에서 해당 키를 추가해보세요
- [Clerk 지원팀](https://clerk.com/contact/support)에 문의

### 타입 오류

- `@clerk/types` 패키지가 설치되어 있는지 확인
- TypeScript 버전이 최신인지 확인

