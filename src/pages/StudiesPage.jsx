import { useEffect, useState } from "react";
import { ArrowRight, ChevronRight, ClipboardClock, FlaskConical, Plus, Search } from "lucide-react";
import Pill from "../components/ui/Pill";
import { studies } from "../data/demoData";
import { loadSetupDraft } from "../data/setupDraft";
import "../tests-list.css";

const hasReport = study => Boolean(study.integrated && Array.isArray(study.run?.results) && study.run.results.length);
const timestamp = value => {
  if (typeof value !== "number" && !(typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
function updatedLabel(study) {
  const date = timestamp(study.updatedAt) || timestamp(study.updated);
  if (date) {
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const sameDay = other => date.getFullYear() === other.getFullYear() && date.getMonth() === other.getMonth() && date.getDate() === other.getDate();
    const day = sameDay(today) ? "오늘" : sameDay(yesterday) ? "어제" : `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
    return { text: `${day} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`, title: new Intl.DateTimeFormat("ko-KR", { dateStyle: "full", timeStyle: "long" }).format(date), dateTime: date.toISOString() };
  }
  const original = String(study.updated ?? "").replace(/\s+/g, " ").trim();
  const match = original.match(/^(.*?)(오전|오후)\s*(\d{1,2}):(\d{2})(.*)$/);
  if (match && Number(match[3]) >= 1 && Number(match[3]) <= 12 && Number(match[4]) < 60) {
    const hour = Number(match[3]) % 12 + (match[2] === "오후" ? 12 : 0);
    return { text: `${match[1].replace(/,/g, " ").trim()} ${String(hour).padStart(2, "0")}:${match[4]}${match[5]}`.trim(), title: original };
  }
  return { text: original.replace(/,\s*/g, " ") || "—", title: original || "업데이트 정보 없음" };
}

export default function StudiesPage({ goReport, setPage, studyList = studies, draftMeta }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [savedDraft, setSavedDraft] = useState(null);
  useEffect(() => {
    let active = true;
    loadSetupDraft().then(record => { if (active) setSavedDraft(record?.draft ? record : null); }).catch(() => { if (active) setSavedDraft(null); });
    return () => { active = false; };
  }, [draftMeta]);
  const query = q.trim().toLowerCase();
  const visible = studyList.filter(s => [s.name, s.desc, s.version, s.id].filter(value => value != null).join(" ").toLowerCase().includes(query) && (filter === "all" || (filter === "completed" ? hasReport(s) : filter === "ready" ? Boolean(s.integrated && !hasReport(s)) : !s.integrated)));
  const nameCounts = studyList.reduce((counts, study) => { const name = String(study.name || "").trim().toLowerCase(); counts.set(name, (counts.get(name) || 0) + 1); return counts; }, new Map());

  return <main className="page tests-list-view">
    <header className="tests-page-heading"><div><div className="tests-eyebrow">PERSONALAB <span>/</span> WORKSPACE <span>/</span> <b>ALL TESTS</b></div><div className="tests-page-title"><h1>테스트</h1><p>제품 정보, AI 실행, 결과 리포트를 테스트별로 관리하세요.</p></div></div><span className="tests-platform"><i /> AI RESEARCH PLATFORM</span></header>
    {savedDraft && <section className="tests-draft-banner" aria-label="작성 중인 테스트"><ClipboardClock size={21} /><div><div className="tests-draft-title"><small>작성 중인 테스트 · {Math.max(0, Math.min(3, savedDraft.step || 0)) + 1}/4단계</small><b>{savedDraft.draft.product?.name || savedDraft.draft.name || "이름 없는 테스트"}</b></div><p>아직 실행 전입니다. 저장된 설정부터 이어서 작성하세요.</p></div><button className="primary" onClick={() => setPage("create")}>이어서 작성 <ArrowRight size={15} /></button></section>}
    <div className="tests-controls"><label className="tests-search"><Search size={17} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="테스트 검색…" aria-label="테스트 검색" /></label><div className="tests-filter-actions"><div className="tests-filters" role="group" aria-label="상태 필터">{[["all", "전체"], ["ready", "실행 준비"], ["completed", "분석 완료"], ["sample", "예시 데이터"]].map(([key, label]) => <button key={key} className={filter === key ? "active" : ""} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div><button className="primary" onClick={() => setPage("create")}><Plus size={15} /> 새 테스트</button></div></div>
    <p className="tests-result-count" role="status">{visible.length}개 표시 · 전체 {studyList.length}개 테스트</p>
    <div className="tests-table"><div className="tests-table-head"><span>테스트</span><span>상태</span><span>AI 패널</span><span>구성</span><span>업데이트</span><span>액션</span></div>
      {visible.map(study => {
        const report = hasReport(study);
        const sample = !study.integrated;
        const updated = updatedLabel(study);
        const duplicates = nameCounts.get(String(study.name || "").trim().toLowerCase()) > 1;
        const panelCount = Array.isArray(study.personas) ? study.personas.length : Number.isFinite(study.ai) ? study.ai : "—";
        const screenCount = Array.isArray(study.screens) ? study.screens.length : null;
        const status = sample ? "예시 데이터" : report ? "분석 완료" : study.status || "실행 준비";
        return <button className={`tests-row${report ? " has-report" : ""}${sample ? " is-sample" : ""}`} key={study.id} onClick={() => goReport(study)}>
          <span className="tests-study"><i className="tests-study-icon"><FlaskConical size={19} /></i><span><b title={study.name}>{study.name}</b><small title={[study.desc, study.version].filter(Boolean).join(" · ")}>{[study.desc, study.version].filter(Boolean).join(" · ")}</small>{duplicates && study.id != null && <small className="tests-study-id" title={`테스트 ID: ${study.id}`}>ID · {study.id}</small>}</span></span>
          <span className="tests-state"><Pill tone={report ? "green" : "gray"} dot>{status}</Pill>{sample && study.status && <small>샘플 상태 · {study.status}</small>}</span>
          <span className="tests-panel"><b>{panelCount}</b><small>{sample ? "예시 AI Persona" : "AI Persona"}</small></span>
          <span className="tests-composition"><b>{screenCount == null ? "—" : `${screenCount}개 화면`}</b><small>{screenCount == null ? "화면 정보 없음" : "프로토타입"}</small></span>
          <span className="tests-updated"><time dateTime={updated.dateTime} title={updated.title}>{updated.text}</time></span>
          <span className="tests-row-action">{report && <b>리포트</b>}<ChevronRight size={16} /></span>
        </button>;
      })}
      {!visible.length && <div className="tests-empty"><Search size={27} /><b>조건에 맞는 테스트가 없습니다.</b><p>검색어 또는 상태 필터를 바꿔 보세요.</p></div>}
    </div>
  </main>;
}
