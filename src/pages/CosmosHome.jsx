import { useEffect, useRef } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, MousePointer2 } from 'lucide-react';

const art = [
  { tone: 'calendar', mark: '日', title: '일정메이트', lines: ['10월 20일 · 화요일', '오늘 할 일 03', '수업  과제  동아리'] },
  { tone: 'planner', mark: 'P', title: 'STUDY PLAN', lines: ['이번 주의 목표', '집중 시간 12h', 'MON  TUE  WED'] },
  { tone: 'market', mark: '↗', title: '캠퍼스 마켓', lines: ['우리 학교의 물건', '새로운 거래  24', '탐색  등록  채팅'] },
];
const positions = ['pos-one', 'pos-two', 'pos-three', 'pos-four', 'pos-five', 'pos-six'];
const stateLabel = study => study.integrated ? (study.run ? '분석 완료' : study.status === '실행 중' ? '진행 중' : '설정 완료') : study.tone === 'draft' ? '준비 중' : study.tone === 'running' ? '진행 중 · 예시' : '완료 · 예시';
const actionLabel = study => study.tone === 'draft' ? '설정 이어가기' : study.tone === 'running' && !study.run ? '진행 화면 보기' : '결과 보기';

function CardArt({ study, index }) {
  const preset = art[index % art.length];
  const image = study.integrated && study.screens?.find(s => s.image)?.image;
  return <div className={`cosmos-card-art ${preset.tone}`}>
    {image ? <img src={image} alt={`${study.name} 프로토타입 화면`} /> : <div className="cosmos-art-screen" aria-hidden="true"><div className="cosmos-art-top"><b>{study.integrated ? study.name?.slice(0, 1) : preset.mark}</b><span>{study.integrated ? study.product?.name || study.name : preset.title}</span><i>•••</i></div><div className="cosmos-art-copy"><small>{study.integrated ? 'PERSONALAB / DEMO' : preset.lines[0]}</small><strong>{study.integrated ? study.task || study.name : preset.lines[1]}</strong><em>{study.integrated ? 'AI 페르소나 테스트' : preset.lines[2]}</em></div><div className="cosmos-art-bottom"><span/><span/><span/></div></div>}
  </div>;
}

export default function CosmosHome({ studyList, draftMeta, onOpen, onCreate, onAll }) {
  const hero = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onScroll = () => {
      if (!hero.current || matchMedia('(max-width: 700px), (prefers-reduced-motion: reduce)').matches) return;
      hero.current.querySelectorAll('.cosmos-float-wrap').forEach((card, i) => {
        const depth = [-25, 16, 25, -15, 21, -23][i] || 12;
        const tilt = [-13, 11, 12, -10, 11, -12][i] || 0;
        const travel = [-.05, .08, -.045, .09, .04, .035][i] || 0;
        card.style.transform = `translate3d(${pointer.current.x * depth}px, ${pointer.current.y * depth + Math.min(window.scrollY, 720) * travel}px, 0) rotate(${tilt}deg)`;
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  const cards = studyList.slice(0, 3).flatMap((study, index) => [{ study, index, detail: false }, { study, index, detail: true }]);
  const move = event => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = event.currentTarget.getBoundingClientRect();
    pointer.current = { x: (event.clientX - r.left) / r.width - .5, y: (event.clientY - r.top) / r.height - .5 };
    hero.current?.querySelectorAll('.cosmos-float-wrap').forEach((card, i) => {
      const depth = [-25, 16, 25, -15, 21, -23][i] || 12;
      const tilt = [-13, 11, 12, -10, 11, -12][i] || 0;
      card.style.transform = `translate3d(${pointer.current.x * depth}px, ${pointer.current.y * depth}px, 0) rotate(${tilt}deg)`;
    });
  };
  return <main className="cosmos-home">
    <section ref={hero} className="cosmos-hero" onPointerMove={move} onPointerLeave={e => { pointer.current = { x: 0, y: 0 }; e.currentTarget.querySelectorAll('.cosmos-float-wrap').forEach(card => { card.style.transform = ''; }); }}>
      <div className="cosmos-hero-center"><span className="cosmos-kicker">PERSONALAB · AI PRODUCT TESTING</span><h1>말보다,<br />써본 결과를.</h1><p>AI 페르소나가 제품을 평가하고 프로토타입을 직접 따라갑니다.<br />멈춘 화면과 그 이유를 한 사람씩 확인하세요.</p><button className="cosmos-main-cta" onClick={onCreate}>새 테스트 시작하기 <ArrowUpRight size={19} /></button><span className="cosmos-hero-caption">제품 설정 · AI 패널 · Ask / Act · 행동 근거</span></div>
      <div className="cosmos-float-layer" aria-label="등록된 테스트 미리보기">{cards.map(({ study, index, detail }, n) => <div className={`cosmos-float-wrap ${positions[n]}`} key={`${study.id}-${detail ? 'detail' : 'main'}`}><button className={`cosmos-floating-card ${detail ? 'detail-card' : ''}`} onClick={() => onOpen(study)} aria-label={`${study.name} · ${stateLabel(study)} · ${actionLabel(study)}`}><CardArt study={study} index={index} /><span className="cosmos-card-meta"><b>{study.name}</b><small>{stateLabel(study)} <ArrowUpRight size={12} /></small></span></button></div>)}</div>
      <div className="cosmos-hero-bottom"><span>SCROLL TO EXPLORE <ArrowDown size={14} /></span><span>TEST COLLECTION / 0{studyList.length}</span></div>
    </section>
    {draftMeta && <section className="cosmos-resume"><span>작성 중인 테스트</span><strong>{draftMeta.name} · {draftMeta.step + 1}/4단계</strong><button onClick={onCreate}>이어서 설정하기 <ArrowRight size={16} /></button></section>}
    <section className="cosmos-intro"><div className="cosmos-section-label">01 / PRODUCT JOURNEY</div><div><h2>좋다고 말한 사람이<br />어디서 멈추는지.</h2><p>같은 AI 페르소나의 사용 전 의견과 실제 화면 선택을 연결합니다. 전체 결과에서 문제 화면을 찾고, 개별 행동 기록에서 이유를 살펴보세요.</p></div><div className="cosmos-intro-aside"><MousePointer2 size={22} /><span>Ask → Act → Evidence</span><small>데모 시뮬레이션 · 실사용자 조사 결과 아님</small></div></section>
    <section className="cosmos-collection"><div className="cosmos-collection-head"><div><span className="cosmos-section-label">02 / TEST COLLECTION</span><h2>테스트를 열어보세요.</h2></div><button onClick={onAll}>모든 테스트 <ArrowUpRight size={17} /></button></div><div className="cosmos-collection-grid">{studyList.map((study, index) => <button className="cosmos-collection-item" key={study.id} onClick={() => onOpen(study)}><CardArt study={study} index={index} /><span className="cosmos-collection-copy"><small>0{index + 1} / {stateLabel(study)}</small><b>{study.name}</b><em>{study.desc}</em><span>{actionLabel(study)} <ArrowUpRight size={16} /></span></span></button>)}</div></section>
    <section className="cosmos-end"><span>YOUR NEXT TEST STARTS HERE</span><h2>다음 제품도<br />직접 써보게 하세요.</h2><button onClick={onCreate}>새 테스트 시작하기 <ArrowUpRight size={18} /></button></section>
  </main>;
}
