# Clerk + Supabase 통합 가이드

이 문서는 Clerk와 Supabase를 네이티브 통합하는 방법을 설명합니다. 2025년 4월부터 권장되는 방식으로, JWT 템플릿 없이 Clerk 세션 토큰을 직접 사용합니다.

## 목차

1. [개요](#개요)
2. [설정 단계](#설정-단계)
3. [코드 사용법](#코드-사용법)
4. [RLS 정책 설정](#rls-정책-설정)
5. [예제](#예제)

## 개요

### 네이티브 통합의 장점

- ✅ **JWT 템플릿 불필요**: Supabase JWT 템플릿이 deprecated되었습니다
- ✅ **자동 토큰 검증**: Supabase가 Clerk 세션 토큰을 직접 검증
- ✅ **간단한 설정**: Clerk Dashboard에서 몇 번의 클릭으로 설정 완료
- ✅ **보안 강화**: JWT secret key를 Clerk와 공유할 필요 없음

### 통합 아키텍처

```
┌─────────────┐
│   Client    │
│  Component  │
└──────┬──────┘
       │ useSession().getToken()
       ▼
┌─────────────┐
│   Clerk     │
│   Session   │
└──────┬──────┘
       │ Session Token
       ▼
┌─────────────┐      ┌──────────────┐
│  Supabase   │◄─────│   Clerk      │
│   Client    │      │  Integration │
└──────┬──────┘      └──────────────┘
       │
       ▼
┌─────────────┐
│  Supabase   │
│  Database   │
│  (with RLS) │
└─────────────┘
```

## 설정 단계

### 1. Clerk Dashboard에서 Supabase 통합 활성화

1. [Clerk Dashboard](https://dashboard.clerk.com/)에 로그인
2. **Setup** → **Integrations** → **Supabase** 이동
3. **"Activate Supabase integration"** 클릭
4. 표시된 **Clerk domain** 복사 (예: `your-app-12.clerk.accounts.dev`)

### 2. Supabase Dashboard에서 Clerk 인증 제공자 추가

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택 → **Authentication** → **Providers** 이동
3. **"Third-Party Auth"** 섹션에서 **"Add provider"** 클릭
4. **"Clerk"** 선택
5. 1단계에서 복사한 **Clerk domain** 입력
6. **"Save"** 클릭

### 3. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # 서버 전용
```

## 코드 사용법

### Client Component에서 사용

```tsx
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function TasksPage() {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    async function loadTasks() {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tasks:', error);
      } else {
        setTasks(data || []);
      }
      setLoading(false);
    }

    loadTasks();
  }, [isLoaded, user, supabase]);

  async function createTask(name: string) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ name });

    if (error) {
      console.error('Error creating task:', error);
      return;
    }

    // 데이터 새로고침
    window.location.reload();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Tasks</h1>
      {tasks.map((task) => (
        <div key={task.id}>{task.name}</div>
      ))}
    </div>
  );
}
```

### Server Component에서 사용

```tsx
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export default async function TasksPage() {
  const supabase = createClerkSupabaseClient();

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (
    <div>
      <h1>My Tasks</h1>
      {tasks?.map((task) => (
        <div key={task.id}>{task.name}</div>
      ))}
    </div>
  );
}
```

### Server Action에서 사용

```ts
'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function addTask(name: string) {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('tasks')
    .insert({ name });

  if (error) {
    console.error('Error adding task:', error);
    throw new Error('Failed to add task');
  }

  return data;
}
```

### Service Role 클라이언트 (관리자 권한)

RLS를 우회해야 하는 경우에만 사용하세요 (예: 사용자 동기화):

```ts
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export async function syncUser(clerkId: string, name: string) {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('users')
    .upsert(
      { clerk_id: clerkId, name },
      { onConflict: 'clerk_id' }
    );

  if (error) {
    throw error;
  }

  return data;
}
```

## RLS 정책 설정

Row Level Security (RLS)를 사용하여 사용자가 자신의 데이터만 접근할 수 있도록 제한합니다.

### 기본 패턴

```sql
-- 테이블 생성
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT (SELECT auth.jwt()->>'sub'),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 자신의 데이터만 조회
CREATE POLICY "User can view their own tasks"
ON tasks FOR SELECT
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);

-- INSERT 정책: 자신의 데이터만 생성
CREATE POLICY "Users must insert their own tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

-- UPDATE 정책: 자신의 데이터만 수정
CREATE POLICY "Users can update their own tasks"
ON tasks FOR UPDATE
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id)
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);

-- DELETE 정책: 자신의 데이터만 삭제
CREATE POLICY "Users can delete their own tasks"
ON tasks FOR DELETE
TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);
```

### 주요 포인트

1. **`auth.jwt()->>'sub'`**: Clerk User ID를 가져옵니다
2. **`user_id` 컬럼**: Clerk User ID를 저장하는 TEXT 컬럼
3. **`DEFAULT` 값**: INSERT 시 자동으로 현재 사용자 ID 설정
4. **`TO authenticated`**: 인증된 사용자만 접근 가능

### 예제 마이그레이션

프로젝트의 `supabase/migrations/20250101000000_example_rls_policies.sql` 파일을 참고하세요.

## 예제

### 완전한 예제: Tasks 앱

#### 1. 마이그레이션 생성

```sql
-- supabase/migrations/20250101000000_create_tasks.sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT (SELECT auth.jwt()->>'sub'),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view their own tasks"
ON tasks FOR SELECT TO authenticated
USING ((SELECT auth.jwt()->>'sub') = user_id);

CREATE POLICY "Users must insert their own tasks"
ON tasks FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.jwt()->>'sub') = user_id);
```

#### 2. Server Action 생성

```ts
// app/actions/tasks.ts
'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function getTasks() {
  const supabase = createClerkSupabaseClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTask(name: string) {
  const supabase = createClerkSupabaseClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert({ name });

  if (error) throw error;
  return data;
}
```

#### 3. 페이지 컴포넌트

```tsx
// app/tasks/page.tsx
import { getTasks } from '@/app/actions/tasks';
import { CreateTaskForm } from '@/components/create-task-form';

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <div>
      <h1>My Tasks</h1>
      <CreateTaskForm />
      <ul>
        {tasks?.map((task) => (
          <li key={task.id}>{task.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 참고 자료

- [Clerk Supabase 통합 공식 문서](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase Third-Party Auth 가이드](https://supabase.com/docs/guides/auth/third-party/clerk)
- [Clerk Supabase 통합 발표 (2025년 3월)](https://clerk.com/changelog/2025-03-31-supabase-integration)

## 문제 해결

### "Unauthorized" 오류

- Clerk 통합이 올바르게 설정되었는지 확인
- Supabase에서 Clerk provider가 활성화되었는지 확인
- 환경 변수가 올바르게 설정되었는지 확인

### RLS 정책 오류

- RLS가 활성화되었는지 확인: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- 정책이 올바르게 생성되었는지 확인
- `auth.jwt()->>'sub'`가 올바르게 사용되고 있는지 확인

### 토큰 관련 오류

- Clerk 세션이 유효한지 확인
- `useSession()` 또는 `auth()`가 올바르게 사용되고 있는지 확인

