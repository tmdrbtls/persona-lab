import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, MousePointer2 } from 'lucide-react';
import { buildRun, createDraft, DROP_LABELS, generatePersonas, OCCUPATIONS } from '../data/studyEngine';
import '../cosmos-home-desktop.css';

// The desktop landing uses the same deterministic sample engine as the create/run flow.
// It never writes a study, fabricates a response, or substitutes a sample for saved results.
const landingDemo = createDraft();
landingDemo.personas = generatePersonas(landingDemo);
const landingResults = buildRun(landingDemo).results;
const firstEvidence = Math.max(0, landingResults.findIndex(result => result.act.end.result === 'drop'));
const desktopQuery = '(min-width: 1100px)';
const subscribeDesktop = callback => {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};
const isDesktop = () => window.matchMedia(desktopQuery).matches;
const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribeMotion = callback => {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};
const prefersReducedMotion = () => window.matchMedia(motionQuery).matches;

export default function CosmosHome(props) {
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, () => false);
  return desktop ? <DesktopHome {...props} /> : <LegacyHome {...props} />;
}

function DemoPath({ result }) {
  return <ol className="home-demo-path">{result.act.path.map((id, index) => {
    const screen = landingDemo.screens.find(item => item.id === id);
    return <li key={`${id}-${index}`} className={index === result.act.path.length - 1 ? 'path-end' : ''}><span>{id}</span><b>{screen?.label || id}</b>{index < result.act.path.length - 1 && <ArrowRight size={16} aria-hidden="true" />}</li>;
  })}</ol>;
}

function DesktopHome({ studyList, draftMeta, onOpen, onCreate, onAll }) {
  const root = useRef(null);
  const [selected, setSelected] = useState(firstEvidence);
  const reduced = useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => true);
  const [reading, setReading] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  useEffect(() => {
    if (!playing || reduced) return;
    const timer = window.setTimeout(() => {
      if (reading === 2) setPlaying(false);
      else setReading(step => step + 1);
    }, 1800);
    const pause = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', pause);
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', pause); };
  }, [playing, reading, reduced]);
  useEffect(() => {
    if (reduced || !root.current) return;
    const animations = [];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        animations.push(element.animate([
          { opacity: .5, transform: `translateY(${element.dataset.homeReveal === 'row' ? 12 : 20}px)` },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 700, delay: Number(element.dataset.homeDelay || 0), easing: 'cubic-bezier(.16,1,.3,1)' }));
        observer.unobserve(element);
      });
    }, { threshold: .12 });
    root.current.querySelectorAll('[data-home-reveal]').forEach(element => observer.observe(element));
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); };
  }, [reduced]);
  const result = landingResults[selected];
  const persona = landingDemo.personas[selected];
  const endScreen = landingDemo.screens.find(screen => screen.id === result.act.end.screen);
  const lastEvent = result.act.events.at(-1);
  const evidence = result.act.end.drop_reason ? DROP_LABELS[result.act.end.drop_reason] : '목표 화면 도달';
  return <main ref={root} className="cosmos-home-desktop">
    <section className="home-editorial-hero" aria-labelledby="home-title">
      <figure className="home-demo-masthead" aria-label="동일 Persona의 Ask 응답, 화면 이동, 행동 근거 미리보기">
        <figcaption><span>{landingDemo.product.name} · {persona.persona_id}</span><div><span>규칙 기반 데모 · 실제 사용자 조사 아님</span><button className="home-demo-replay" disabled={reduced} onClick={() => { if (playing) setPlaying(false); else { setReading(0); setPlaying(true); } }}>{reduced ? '움직임 줄이기 적용' : playing ? '흐름 재생 일시정지' : '기록 흐름 다시 보기'} <ArrowRight size={15} aria-hidden="true" /></button></div></figcaption>
        <div className="home-demo-triptych" data-reading={playing && !reduced ? reading : 'all'}>
          <article className="home-demo-ask" data-ui><h2>Ask · 제품에 대한 응답</h2><div className="home-intent"><b>{result.ask.usage_intention}<small>/5</small></b><span>사용 의향</span></div><blockquote>“{result.ask.reason}”</blockquote></article>
          <article className="home-demo-act" data-ui><h2>Act · 프로토타입 행동</h2><p>{landingDemo.task}</p><DemoPath result={result} /><p className="home-choice">{lastEvent?.action === 'abandon' ? `${endScreen.id} ${endScreen.label}에서 중단` : `“${lastEvent?.target}” 선택 후 목표 도달`}</p></article>
          <article className="home-demo-evidence" data-ui><h2>{result.act.end.result === 'drop' ? '멈춘 화면과 근거' : '목표 도달과 근거'}</h2><strong>{endScreen.id} {endScreen.label}</strong><span>{evidence}</span><blockquote>“{lastEvent?.reason}”</blockquote></article>
        </div><div className="home-reading-track" aria-hidden="true"><span style={{ transform: `scaleX(${playing && !reduced ? (reading + 1) / 3 : 1})` }} /></div>
      </figure>
      <div className="home-hero-editorial-grid">
        <div className="home-hero-explanation"><p data-home-reveal>같은 AI 페르소나의 응답과<br />프로토타입 선택을 연결해,<br />먼저 확인할 화면을 찾습니다.</p><button className="home-start" onClick={onCreate} data-home-reveal data-home-delay="80">새 테스트 시작하기 <ArrowUpRight size={20} /></button><a className="home-text-link" href="#home-evidence" onClick={event => { event.preventDefault(); document.getElementById('home-evidence')?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' }); }}>데모 기록 살펴보기 <ArrowDown size={17} /></a></div>
        <div className="home-hero-title"><h1 id="home-title" data-home-reveal>말보다,<br />써본 결과를.</h1><p data-home-reveal data-home-delay="80">Ask 응답 → 프로토타입 행동 → 멈춘 화면과 근거</p></div>
      </div>
    </section>

    {draftMeta && <aside className="home-draft"><div><span>작성 중인 테스트 · {draftMeta.step + 1}/4단계</span><strong>{draftMeta.name}</strong></div><button className="home-text-link" onClick={onCreate}>이어서 설정하기 <ArrowRight size={18} /></button></aside>}

    <section className="home-evidence-story" id="home-evidence" aria-labelledby="home-evidence-title">
      <div className="home-story-copy"><h2 id="home-evidence-title" data-home-reveal>좋다고 말한 사람이<br />어디서 멈추는지.</h2><p data-home-reveal data-home-delay="80">같은 사람의 말과 행동을 나란히 읽습니다. 응답만으로 알 수 없었던 중단 지점을, 선택한 버튼과 표현한 이유에서 확인하세요.</p><p className="home-demo-disclosure" data-home-reveal data-home-delay="160">아래 기록은 앱의 기존 생성·실행 로직으로 계산한 체험용 데이터입니다. 실제 사용자 행동이나 예측 정확도를 의미하지 않습니다.</p><div className="home-sample-product" data-home-reveal><span>데모 제품 · {landingDemo.product.name}</span><p>{landingDemo.product.description}</p></div></div>
      <div className="home-evidence-sheet" data-ui>
        <header><h3>한 사람의 Ask → Act</h3><label>관찰할 Persona<select value={selected} onChange={event => { setSelected(Number(event.target.value)); setPlaying(false); }}>{landingDemo.personas.map((item, index) => <option key={item.persona_id} value={index}>{item.persona_id} · {item.age}세 · {OCCUPATIONS[item.occupation]}</option>)}</select></label></header>
        <div className="home-record-response" data-home-reveal><span>Ask · 사용 전 의견</span><strong>사용 의향 {result.ask.usage_intention}/5</strong><blockquote>“{result.ask.reason}”</blockquote></div>
        <div className="home-record-route" data-home-reveal data-home-delay="70"><span>Act · 선택한 화면 경로</span><DemoPath result={result} /><p>{result.act.events.map(event => event.action === 'abandon' ? `${event.screen}에서 이탈` : `${event.screen}에서 “${event.target}” 선택`).join(' · ')}</p></div>
        <div className="home-record-outcome" data-home-reveal data-home-delay="140"><div><span>{result.act.end.result === 'drop' ? '멈춘 화면' : '도달한 목표 화면'}</span><strong>{endScreen.id} {endScreen.label}</strong></div><p>{endScreen.description}</p><blockquote>“{lastEvent?.reason}”</blockquote><span>{evidence}</span></div>
      </div>
    </section>

    <section className="home-test-library" aria-labelledby="home-library-title"><div className="home-library-heading"><h2 id="home-library-title" data-home-reveal>테스트를 열어보세요.</h2><button className="home-text-link" onClick={onAll}>모든 테스트 <ArrowUpRight size={20} /></button></div>
      <div className="home-test-rows">{studyList.map((study, index) => <button className="home-test-row" key={study.id} onClick={() => onOpen(study)} data-home-reveal="row" data-home-delay={Math.min(index, 4) * 70}><span className="home-test-identity"><b title={study.name}>{study.name}</b><span>{study.desc}</span></span><span className="home-test-version">{study.version}</span><span className="home-test-state">{!study.integrated && study.tone === 'draft' ? '준비 중 · 예시' : stateLabel(study)}</span><span className="home-test-action">{actionLabel(study)} <ArrowUpRight size={21} /></span></button>)}</div>
      {!studyList.length && <p className="home-library-empty">아직 등록된 테스트가 없습니다. 새 테스트로 제품과 프로토타입을 준비하세요.</p>}
    </section>

    <section className="home-editorial-close" aria-labelledby="home-close-title"><h2 id="home-close-title" data-home-reveal>다음 제품의<br />멈춘 화면을 찾으세요.</h2><div><p data-home-reveal>제품 설명과 연결된 화면을 준비하고,<br />AI 페르소나의 응답과 행동을 함께 살펴보세요.</p><button className="home-start" onClick={onCreate} data-home-reveal data-home-delay="80">새 테스트 시작하기 <ArrowUpRight size={20} /></button></div></section>
  </main>;
}

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

function LegacyHome({ studyList, draftMeta, onOpen, onCreate, onAll }) {
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
