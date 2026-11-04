# PersonaLab

AI 사용자 100명에게 프로토타입을 직접 써보게 하고, 어디서 왜 멈추는지와 그 예측이 실제 사용자와 얼마나 다른지를 함께 보여주는 제품 사전 검증 서비스의 프론트엔드입니다.

## 배포 주소

디자인 시안 세 개 (`flow-variants` 브랜치)

- 시안 A · 정밀: <https://personalab-variant-a.vercel.app>
- 시안 B · 스튜디오: <https://personalab-variant-b.vercel.app>
- 시안 C · 리포트: <https://personalab-variant-c.vercel.app>

기존 통합 데모 (`main` 브랜치): <https://persona-lab-blue.vercel.app>

세 시안은 랜딩, 로그인, 내 테스트, 제품 기획, 프로토타입, AI 패널, 실행, 결과, 참가자 화면까지 같은 흐름을 따르고 디자인만 다릅니다. 모든 수치와 AI 응답은 데모 데이터이며 백엔드와 연결되어 있지 않습니다.

## 브랜치

`main`은 2026-10-03에 합친 React/Vite 통합 데모입니다. 최종 시안이 정해지면 여기에 합칩니다.

`design/flow-variants`가 지금 작업하는 브랜치이고, `flow-variants`는 같은 내용을 Vercel에 배포하기 위한 사본입니다(Vercel이 브랜치 이름의 `/`를 처리하지 못해서). 작업을 푸시할 때는 두 브랜치에 함께 올려야 세 시안 주소가 갱신됩니다.

`archive/old-branches`는 예전 시안 브랜치들을 보관한 것입니다. 이 브랜치의 마지막 커밋이 아래 네 브랜치의 마지막 커밋을 부모로 가지고 있어서, 필요하면 그 커밋에서 브랜치를 다시 만들 수 있습니다.

- `concept/cosmos-d` 코스모스 D 시안 (285b890), 배포는 <https://persona-lab-cosmos-d.vercel.app>에 남아 있음
- `concept/journey-xray` A·B·C 시안 (b7ab949)
- `concept/persona-flow` 핀볼 기반 시안 B (57e89b5)
- `feat/integrated-personalab-ux` 통합 UX (d581d2b), PR #1로 `main`에 합쳐짐

## 폴더

`variants/`가 세 시안의 소스입니다. 공통 모듈(데이터 엔진, 그래프, 3D 궤도, 화면 흐름)은 `variants/shared`에서 고치고, `variants/build.sh`를 실행하면 각 시안 폴더(`a`, `b`, `c`)로 복사됩니다. 시안별 화면 배치는 `views.js`, 디자인은 `style.css`에 있습니다. 빌드 도구 없이 정적 파일로 동작하므로, `variants` 폴더를 아무 정적 서버로 열면 됩니다.

```bash
cd variants && ./build.sh && python3 -m http.server 8000
# http://localhost:8000/a/  /b/  /c/
```

`src/`는 `main`에서 이어받은 React/Vite 통합 데모이고 `npm install && npm run dev`로 실행합니다.

## 문서

- [프론트엔드 워크플로우](docs/frontend-workflow.md): 화면 흐름과 화면별 역할, API 대응
- [PRD](docs/PRD.md), [결정 사항](docs/decisions.md), [현재 상태](docs/current-status.md), [팀원 공유사항](docs/팀원_공유사항.md)
