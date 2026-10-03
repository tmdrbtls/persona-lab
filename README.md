# PersonaLab

AI Persona의 사용 의향과 프로토타입 행동을 연결해 보여주는 제품 사전 검증 프런트엔드 데모입니다.

## 배포

<https://persona-lab-blue.vercel.app>

GitHub의 `main` 브랜치가 Vercel 프로젝트에 연결되어 있습니다. 이 저장소에 푸시된 React/Vite 소스 전체를 Vercel이 직접 빌드하고 같은 프로덕션 주소에 자동 배포합니다.

통합 UI 브랜치 `feat/integrated-personalab-ux`의 배포 미리보기: <https://persona-4a03ewjy0-ssg03177-6149.vercel.app>
미리보기는 2026-10-03 커밋 기준이며, 위 프로덕션 주소는 `main` 반영 후 갱신됩니다.

## 로컬 실행

```bash
npm install
npm run dev
```

프로덕션 빌드는 `npm run build`로 확인할 수 있습니다.

## 주요 기능

- 테스트 대시보드와 목록, 설정·실행·결과를 묶는 테스트 상세
- 제품 기획 → 프로토타입 → AI 패널 → Persona 확인으로 이어지는 테스트 생성
- 기획서 텍스트·Markdown·PDF 읽기, 제품 정보 편집과 Persona용 미리보기
- 화면 이미지·버튼 연결·과제·목표 화면 설정
- Persona별 Ask → Act 진행, 프로토타입 화면 이동과 행동 Timeline
- 실행 결과와 동일한 데이터를 사용하는 Persona별 Report 및 Evidence
- Report의 결과 해석·검증 정보 안내
- 의향·행동 격차 및 이탈 이유 분석
- 근거 세션 상세 보기
- 기존 예시 리포트의 샘플 자료 열람
- 데스크톱·모바일 반응형 UI

새 테스트의 Persona·Ask·Act 결과는 **일관된 체험 데이터**로 생성되며, 실행 화면과 리포트가 같은 결과를 사용합니다. 생성한 테스트는 가능한 경우 브라우저 로컬 저장소에 보관됩니다. AI 기획서 추출과 실제 Figma 파일 불러오기는 아직 연결되지 않았으며 화면에서 샘플 동작임을 안내합니다. 실제 사용자 검증 지표는 연결되어 있지 않습니다. 기존 예시 리포트의 참가자·버전 비교 수치는 샘플 UI 자료이며, 실제 측정값으로 사용하지 않습니다.
