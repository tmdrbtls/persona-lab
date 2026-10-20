import { ArrowLeft, ArrowRight, CirclePlay } from 'lucide-react';

export default function SampleRunPage({ study, onBack, onCreate }) {
  return <main className="cosmos-sample-run"><button className="back" onClick={onBack}><ArrowLeft size={16} /> 테스트 목록</button><span className="cosmos-section-label">EXAMPLE / IN PROGRESS</span><h1>{study.name}</h1><p>{study.desc}</p><div className="cosmos-sample-run-card"><CirclePlay size={42} strokeWidth={1.2} /><div><small>진행 중인 테스트 · 화면 예시</small><h2>실험 진행 화면</h2><p>이 항목은 기존 서비스 구성을 설명하는 샘플입니다. 연결된 AI 실행 로그나 실제 참가자 기록은 없으므로 진행률을 만들어 표시하지 않습니다.</p></div></div><button className="primary" onClick={onCreate}>작동하는 데모 테스트 만들기 <ArrowRight size={16} /></button></main>;
}
