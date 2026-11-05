# 도락실 · 초 맞추기 (도서부 오락실)

2026-11-11(수) 충무공초등학교 꿈마루 도서관 동아리 발표회용 앱. 연보라 테마 · PC/모바일 · 오프라인(서비스 워커) · 설치형(PWA) · 관리자(Firebase 로그인).

- 홈페이지 리포: `doraksil/` 폴더 → `https://<도메인>/doraksil/`
- 독립 리포: `ramalok3846/doraksil-second` (같은 앱, 루트에 배치)

## 게임
책 청구기호의 첫 숫자 ÷ 100 = 목표 초 (201 → 2.01초). START → 스톱워치(분:초.밀리초) → STOP. 책별 오차의 합이 작을수록 승리. 끝나면 **참여 번호(D-001…)** · 결과 · 순위가 나와요.

## 폴란드 퀴즈에서 가져온 원리
| 원리 | 도락실 적용 |
|---|---|
| 폴더 하나 + 상대경로 (`./`) | `doraksil/` 어디에 놓아도 동작 |
| 기능별 주소 ↔ `?파라미터` | `/doraksil/records/` = `?admin=rec` (서비스 워커가 오프라인에서도 변환, 폴더 shim 은 SW 설치 전 대비) |
| 로컬 우선 + 오프라인 대기열 | 기록은 먼저 기기에 저장 → 온라인이 되면 Firebase REST 로 전송(PUT 만 사용, 중복 안전) |
| 서버 최신본 우선(4초) → 저장본 | `sw.js` 의 `doc()` |
| 빌드 메타로 업데이트 감지 | `pq-build` 메타 ↔ `version.json`, 새 빌드면 시작 화면에서 자동 새로고침 |
| 앱 업데이트 / 설정 업데이트 분리 | `?update=app` (`&hard=1` 캐시 삭제) / `?update=settings` |
| 설치 실패 없는 프리캐시 + 진단 | 파일별 3회 재시도, `__report.json`, `?repair` |

## 주소 (파라미터)
`?admin` `?admin=books|rec|fields|site|set|cloud|upd|url` · `?board` · `?guide` · `?update=app|settings` · `?repair` · `?reset[=1,3|all]`
폴더형: `/admin/ /books/ /records/ /fields/ /site/ /theme/ /settings/ /cloud/ /board/ /guide/ /repair/ /reset/ /update-app/ /update-settings/`

## 처음 한 번 설정
1. **Firebase 규칙**: 콘솔 → Realtime Database → 규칙에 `database.rules.json` 의 `dr` 블록 추가 후 게시 (홈페이지 리포 `database.rules.all.json` 에는 이미 합쳐 둠). 규칙 없이도 앱은 기기 안에서 동작.
2. **관리자 계정**: Firebase Authentication 이메일 계정 + 데이터베이스 `admins/{uid} = true` (홈페이지 관리자와 같은 계정 사용 가능).
3. 모든 기기에서 **인터넷이 되는 상태로 한 번** 열기(오프라인 설치). 행사 전날 관리자 → 책 등록 → 저장 → 각 기기에서 `?update=settings`.
4. 관리자 → ☁ → 연결 테스트.

## 배포
- **Vercel**: 홈페이지 리포는 기존 `middleware.js`(화이트리스트에 `/doraksil/` 추가)·`vercel.json`(sw.js/version.json 캐시 금지) 그대로 자동 배포. 독립 리포는 루트 `vercel.json` 으로 별도 배포 가능.
- **Cloudflare 보안**: `/doraksil/*` 에서 Rocket Loader·Auto Minify(HTML/JS) 끄기, Bot Fight/챌린지 걸지 않기(학생 기기 인증창 방지), `sw.js`·`version.json` 은 캐시 우회(Cache Rule: Bypass). Firebase 는 기기가 직접 호출하므로 Cloudflare 를 거치지 않음. WAF 규칙으로 `/doraksil/` 외 불필요 경로 차단 가능.

## 앱을 고친 뒤
```bash
python3 tools/stamp.py 1.0.1   # 빌드 해시·버전·sw 캐시명·version.json 갱신 (독립 리포 기준)
```
홈페이지 리포에는 같은 파일을 `doraksil/` 에 복사.

## 알아둘 점 (초안 한계)
- 참여 번호는 클라우드 카운터(오르기만 가능 규칙)로 발급, 오프라인이면 기기 번호(`*` 표시) — 기기 간 중복 가능.
- 관리자 > 사이트·테마: 사이트 제목·짧은 이름·테마 색(프리셋/직접 선택)·파비콘·상단바 로고를 바꾸면 저장 시 모든 기기에 적용(설치용 매니페스트도 따라감). 설정 백업/복원은 ☁ 탭.
- 서명·표지는 이미지를 줄여 DB 문자열로 저장(표지 약 520px). 책은 최대 12권.
- 순위판은 공개 읽기(`board`)이며 이름 표시 방식(가림/전체/번호만)은 관리자에서 선택. 상세 기록(`records`·서명)은 관리자만 읽음.
- 클라이언트 앱이라 기기 안 데이터는 완전한 보안이 아님(관리자 권한은 Firebase 규칙이 보장).
