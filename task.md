# 일지 기록 기능 기획

## 메뉴 구성

하단 탭 순서 (좌 → 우):

1. 오늘 기록
2. 일지 기록 (아이콘: 문서/메모 아이콘)
3. 캘린더
4. 설정

## 기본 진입 화면 (root `/`)

- 오늘 근무 기록(`workLogs`)이 **아직 없으면** → `/today` (오늘 기록)로 진입
- 오늘 근무 기록이 **이미 있으면** → `/journal` (일지 기록)로 진입
- (기존 `/calendar` 기본 진입 로직은 제거하고 위 두 가지로 대체)

## 일지 기록 페이지 (`/journal`)

### 날짜 이동

- 상단에 날짜 표시, 기본값은 오늘
- ‹ › 화살표로 하루씩 이동 가능
- 날짜 라벨 탭 → 날짜 선택(달력/date input)으로 임의 날짜로 바로 이동 가능
- 미래 날짜는 이동/기록 불가 (오늘까지만)
- **과거 날짜도 수정 가능** — 진입 시 해당 날짜에 저장된 일지가 있으면 불러와서 폼에 채움(수정 모드), 없으면 빈 입력 1세트로 시작

### 입력 항목

한 세트 = 시작시간 / 종료시간 / 메모

- **시작시간: 필수**
- **종료시간: 선택** (시작시간만 입력해도 저장 가능)
- 메모: 선택
- 검증: 종료시간을 입력한 경우 **종료시간이 시작시간보다 빠르면 저장 불가** (같거나 늦어야 함)

### 항목 추가/삭제

- "+ 항목 추가" 버튼 → 같은 양식(시작/종료/메모)이 리스트 맨 아래에 계속 추가
- 각 항목 옆 삭제(x) 버튼으로 개별 항목 제거 가능
- **한 날짜당 최대 20개** 항목까지 추가 가능 (20개 도달 시 "+ 항목 추가" 버튼 비활성화)

### 정렬

- 편집 중(폼 화면)에는 **입력한 순서 그대로** 유지 (타이핑 도중 항목 위치가 바뀌면 혼란스러우므로)
- 저장 시 / 캘린더 상세보기에 표시할 때는 **시작시간 기준 오름차순**으로 정렬

### 저장

- 하단 고정 "저장하기" 버튼으로 **현재 보고 있는 날짜**의 항목 전체를 한 번에 저장
- 저장 로직: 선택된 (사용자, 날짜) 기준
  - 해당 날짜에 처음 저장 → INSERT
  - 같은 날짜에 재저장(항목 추가/수정/삭제 포함) → UPDATE
  - 다른 날짜로 이동해서 저장 → 그 날짜 기준으로 다시 INSERT/UPDATE 판단
  - 기존 `workLogs` 테이블의 `unique(userId, workDate)` + `onConflictDoUpdate` 패턴 재사용

## 데이터 모델 (신규 테이블)

`daily_journals`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid, PK | |
| user_id | text | |
| work_date | date | |
| entries | jsonb | `[{ startTime, endTime?, memo? }]` 배열 |
| created_at | timestamp | |
| updated_at | timestamp | |

- `unique(user_id, work_date)` 제약 (workLogs와 동일 패턴)

## 캘린더 연동

- 캘린더에서 날짜 클릭 시 `DayDetailSheet` 하단에 "일지" 섹션 추가
- 해당 날짜의 entries를 시간순으로 리스트 표시 (예: `07:50–08:00 출근 버스 탑승`, `08:40–10:34 전산처리작업`)
- 해당 날짜에 일지가 없으면 섹션 생략

## 테이블 생성 쿼리

```sql
CREATE TABLE daily_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  work_date date NOT NULL,
  entries jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_journals_user_id_work_date_unique UNIQUE (user_id, work_date)
);
```

