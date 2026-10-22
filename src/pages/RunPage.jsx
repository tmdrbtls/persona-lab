import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CirclePause, CirclePlay, MessageSquare, RotateCcw, Sparkles, Activity } from "lucide-react";
import { buildRun, DROP_LABELS, money, OCCUPATIONS, TOOLS, TRAITS, visibleRun } from "../data/studyEngine";
import "../run-refined.css";

const STATUS = { waiting: "대기", "ask-running": "Ask 진행", "ask-complete": "Ask 완료", "act-running": "Act 진행", complete: "완료", drop: "이탈", error: "오류" };
const screenLabel = (study, id) => study.screens.find(s => s.id === id)?.label || id || "제품 소개";

export default function RunPage({ study, onUpdate, setPage, openReport, focusPersonaId }) {
  const { results, frames } = useMemo(() => buildRun(study, study.run?.results), [study.id]);
  const [cursor, setCursor] = useState(study.run ? frames.length : 0);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState(focusPersonaId || study.personas[0]?.persona_id);
  useEffect(() => { if (focusPersonaId) setSelectedId(focusPersonaId); }, [focusPersonaId]);
  const saved = useRef(Boolean(study.run));
  const live = useMemo(() => visibleRun(frames, cursor, study.personas), [frames, cursor, study.personas]);
  const selected = study.personas.find(p => p.persona_id === selectedId) || study.personas[0];
  const entry = live.entries[selected?.persona_id];
  const screenId = selectedId === live.currentId ? live.currentScreen : entry?.act.path.at(-1);
  const screen = study.screens.find(s => s.id === screenId);
  const isCurrent = selectedId === live.currentId;

  useEffect(() => {
    if (!playing || cursor >= frames.length) return;
    const timer = window.setTimeout(() => setCursor(n => n + 1), 530);
    return () => window.clearTimeout(timer);
  }, [playing, cursor, frames.length]);
  useEffect(() => {
    if (cursor > 0 && cursor < frames.length) setSelectedId(live.currentId);
  }, [cursor, frames.length, live.currentId]);
  useEffect(() => {
    if (cursor !== frames.length || !frames.length || saved.current) return;
    saved.current = true; setPlaying(false);
    onUpdate(study.id, { run: { results }, status: "분석 완료", tone: "complete", updated: "방금", ai: study.personas.length });
  }, [cursor, frames.length, onUpdate, results, study.id, study.personas.length]);
  const restart = () => { saved.current = false; onUpdate(study.id, { run: null, status: "실행 중", tone: "running" }); setCursor(0); setPlaying(true); setSelectedId(study.personas[0]?.persona_id); };
  const canReport = cursor === frames.length && frames.length > 0;
  const finishedCount = Object.values(live.entries).filter(item => ["complete", "drop", "error"].includes(item.status)).length;
  const lastEvent = entry?.act.events.at(-1);
  const progress = Math.round(cursor / Math.max(1, frames.length) * 100);
  const phaseLabel = { ready: "실행 준비", ask: "Ask · 제품 판단", act: "Act · 행동 관찰", done: "분석 완료" }[live.phase];

  return <main className="studio-run">
    <div className="studio-run-toolbar">
      <button className="studio-back" onClick={() => setPage("report")}><ArrowLeft size={16} /> 테스트 상세</button>
      <div className="studio-run-name"><b>{study.name}</b><small>{study.version} · AI 패널 {study.personas.length}명</small></div>
      <div className="studio-progress"><span><i /> 전체 테스트: {phaseLabel}</span><progress max={Math.max(1, frames.length)} value={cursor} aria-label="분석 진행률" /><b>{progress}%</b></div>
      <span className="studio-selected-status">선택 페르소나 {selected?.persona_id} · {STATUS[entry?.status] || "대기"}{screen && ` · ${screen.id} ${screen.label}`}</span>
      <div className="studio-playback"><button className="studio-button solid" onClick={() => { if (canReport) restart(); else setPlaying(v => !v); }}>{canReport ? <><RotateCcw size={15} /> 다시 실행</> : playing ? <><CirclePause size={15} /> 일시정지</> : <><CirclePlay size={15} /> {cursor ? "계속 실행" : "전체 실행"}</>}</button><button className="studio-button" disabled={playing || canReport} onClick={() => setCursor(n => Math.min(frames.length, n + 1))}>한 단계 보기</button><button className="studio-button" disabled={!canReport} onClick={openReport}>결과 리포트 <ArrowRight size={15} /></button></div>
    </div>
    <div className="studio-run-context"><span>과제: {study.task}</span><span>목표: {screenLabel(study, study.goal)} · {finishedCount}/{study.personas.length}명 완료 · {cursor}/{frames.length}개 진행 상태</span></div>
    {canReport && <div className="studio-complete" role="status"><CheckCircle2 size={16} /> 모든 페르소나의 분석이 끝났습니다. 개인별 기록과 결과 리포트를 확인하세요.</div>}
    <div className="studio-run-grid">
      <aside className="studio-personas">
        <div className="studio-section-heading"><h2><em>01</em> 관찰 대상 AI 페르소나</h2><small>총 {study.personas.length}명</small></div>
        <div className="studio-persona-list">{study.personas.map(p => { const item = live.entries[p.persona_id]; const active = selectedId === p.persona_id; return <button key={p.persona_id} className={`studio-persona ${active ? "selected" : ""}`} onClick={() => setSelectedId(p.persona_id)} aria-pressed={active}>
          <span className="studio-persona-line"><span className="studio-avatar">{p.persona_id.slice(-3)}</span><span className="studio-persona-name"><b>{p.persona_id}</b><small>{p.age}세 · {OCCUPATIONS[p.occupation]}</small></span><span className={`studio-status ${item.status}`}>{STATUS[item.status]}</span></span>
          {active && <span className="studio-persona-expanded"><span className="studio-persona-tool">{TOOLS[p.existing_tool]} 사용 · {p.traits.map(t => TRAITS[t]).join(" · ") || "등록된 특성 없음"}</span><span className="studio-persona-metrics"><span><small>가격 민감도</small><b>{p.price_sensitivity.toFixed(2)}</b></span><span><small>디지털 수용도</small><b>{p.digital_adoption.toFixed(2)}</b></span></span><span className="studio-persona-phase"><Sparkles size={14} /> {STATUS[item.status]}<small>기록 {item.act.events.length}턴</small></span></span>}
        </button>; })}</div>
        <div className="studio-persona-note"><b><Activity size={16} /> {selected?.persona_id}의 기록 근거</b><small>규칙 기반 시뮬레이션</small><p>{entry?.act.end?.drop_reason ? DROP_LABELS[entry.act.end.drop_reason] : entry?.ask ? entry.ask.reason : "페르소나를 선택하면 제품에 대한 의견과 화면에서 선택한 행동을 함께 살펴볼 수 있습니다."}</p></div>
      </aside>
      <section className="studio-canvas">
        <div className="studio-section-heading"><h2><em>02</em> 현재 보는 화면 <span>(Prototype Canvas)</span></h2><small className="studio-screen-tag">{screen ? `${screen.id} · ${screen.label}` : "제품 정보"}</small></div>
        <div className="studio-phone"><div className="studio-phone-bar"><span>9:41</span><i /><span aria-hidden="true">▂▅▇ ▰</span></div><div className="studio-phone-appbar"><ArrowLeft size={17} /><b>{screen?.label || study.product.name}</b><span /></div>
          {screen?.image ? <img className="studio-phone-image" src={screen.image} alt={`${screen.label} 프로토타입`} /> : <div className="studio-phone-body"><small>{screen ? `SCREEN ${screen.id}` : "PRODUCT OVERVIEW"}</small><h3>{screen?.label || study.product.name}</h3><p>{screen?.description || study.product.description}</p>{!screen && <ul>{study.product.features.map(f => <li key={f}>{f}</li>)}</ul>}{screen && Array.from({ length: screen.fields || 0 }, (_, i) => <div className="studio-phone-field" key={i}><small>입력 항목 {i + 1}</small><span /></div>)}</div>}
          <div className="studio-phone-actions">{screen?.elements.map(e => <span key={`${e.text}-${e.to}`} className={isCurrent && lastEvent?.target === e.text ? "chosen" : ""}>{e.text}<ArrowRight size={15} /></span>)}</div>
          {isCurrent && playing && <div className="studio-phone-thinking"><Sparkles size={13} /> {live.phase === "ask" ? "제품 정보를 읽는 중" : "연결된 선택지를 확인하는 중"}</div>}
          {entry?.act.end && <div className={`studio-phone-outcome ${entry.act.end.result}`}>{entry.act.end.result === "complete" ? "목표 화면 도달" : `이탈 · ${DROP_LABELS[entry.act.end.drop_reason]}`}</div>}<div className="studio-home-indicator" />
        </div>
        <div className="studio-path" aria-label="프로토타입 화면 경로">{study.screens.map(s => <span key={s.id} className={screenId === s.id ? "current" : entry?.act.path.includes(s.id) ? "visited" : ""}>{s.id} {s.label}</span>)}<small>지난 화면: {entry?.act.path.length || 0}개</small></div>
      </section>
      <section className="studio-run-evidence">
        <div className="studio-section-heading"><h2><em>03</em> Ask·Act 실시간 로그</h2><small className="studio-live">{playing ? "시뮬레이션 중" : canReport ? "분석 완료" : cursor ? "일시정지" : "실행 대기"}</small></div>
        <div className="studio-log-card"><div className="studio-log-heading"><h3><MessageSquare size={17} /> Ask · 제품에 대한 의견</h3><span className="studio-intention">사용 의향 {entry?.ask ? `${entry.ask.usage_intention}/5` : "—"}</span></div>{entry?.ask ? <><blockquote>“{entry.ask.reason}”</blockquote><div className="studio-ask-facts"><span><small>우려 요인</small><b>{DROP_LABELS[entry.ask.concern]}</b></span><span><small>지불 의향</small><b>{money(entry.ask.willingness_to_pay)}</b></span><span><small>필요한 기능</small><b>{entry.ask.needed_features.join(", ") || "없음"}</b></span><span><small>필요하지 않은 기능</small><b>{entry.ask.unneeded_features.join(", ") || "없음"}</b></span></div></> : <p className="studio-empty">{entry?.status === "ask-running" ? "이 페르소나가 제품 정보를 읽고 있습니다…" : "Ask 실행 후 제품에 대한 의견과 이유가 표시됩니다."}</p>}</div>
        <div className="studio-log-card"><div className="studio-log-heading"><h3><Activity size={17} /> Act · 행동 관찰 타임라인</h3><small>{entry?.act.events.length || 0}턴 기록</small></div>{entry?.act.events.length ? <ol className="studio-timeline">{[...entry.act.events].reverse().map(event => <li key={event.turn}><small>TURN {event.turn} · {event.screen} {screenLabel(study, event.screen)}</small><b>{event.action === "click" ? `“${event.target}” 선택 → ${event.to} ${screenLabel(study, event.to)}` : "여기서 이탈"}</b><p>“{event.reason}”</p></li>)}</ol> : <p className="studio-empty">Act가 시작되면 선택한 버튼과 표현한 이유가 순서대로 기록됩니다.</p>}{entry?.act.end && <div className={`studio-act-outcome ${entry.act.end.result}`}><b>{entry.act.end.result === "complete" ? "목표 화면 도달" : `${screenLabel(study, entry.act.end.screen)}에서 이탈`}</b><span>{entry.act.events.length}턴 · {entry.act.end.drop_reason ? DROP_LABELS[entry.act.end.drop_reason] : screenLabel(study, study.goal)}</span></div>}</div>
      </section>
    </div>
    <div className="studio-run-footnote"><Sparkles size={15} /><span>AI 페르소나의 규칙 기반 행동 체험 시뮬레이션입니다. 실제 사용자 행동이나 예측 정확도를 의미하지 않습니다.</span><small>{study.version} · AI {study.personas.length}명 · 선택지 기반 프로토타입</small></div>
  </main>;
}
