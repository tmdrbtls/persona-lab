# PersonaLab UI 시안 비교

| 시안 | 브랜치 | 배포 URL | 경험 |
| --- | --- | --- | --- |
| A · Professional SaaS | `feat/integrated-personalab-ux` | https://persona-4a03ewjy0-ssg03177-6149.vercel.app | 기존 비교 기준, 변경 없음 |
| B · AI 사용자 실험 | `concept/persona-flow` | https://persona-lab-flow.vercel.app | 핀볼 기반 테스트 관찰과 결과 지도 |
| C · 사용 흐름 분석 | `concept/journey-xray` | https://persona-lab-xray.vercel.app | 흐름 분기와 100명 X-Ray 분석 |

B와 C는 같은 100명 데모 시뮬레이션 데이터를 사용합니다. 실제 AI 또는 실제 사용자 분석 결과가 아닙니다.

기존 `main` 배포 주소는 https://persona-lab-blue.vercel.app 입니다. 이번 작업에서 변경하지 않았습니다.

Vercel 프로젝트는 A/B/C 각각 독립되어 있습니다. B와 C의 배포에는 현재 Vercel 인증 보호가 적용되어 있어 일반 비로그인 접근이 제한될 수 있습니다.
