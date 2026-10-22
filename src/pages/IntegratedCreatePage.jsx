import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Plus, Trash2, Upload, WandSparkles, Users, Sparkles, Info, RotateCcw } from "lucide-react";
import Header from "../components/layout/Header";
import { createDraft, extractPlanDemo, generatePersonas, OCCUPATIONS, optionKey, PANEL_LABELS, PANEL_OPTIONS, SAMPLE_SCREENS, TOOLS, TRAITS } from "../data/studyEngine";
import { clearSetupDraft, loadSetupDraft, saveSetupDraft } from "../data/setupDraft";
import "../persona-setup.css";
import "../product-setup.css";

const labels = ["제품 기획", "프로토타입", "AI 패널", "Persona 확인"];
const panelLabel = (key, value) => PANEL_OPTIONS[key].find(([option]) => optionKey(option) === optionKey(value))?.[1] || String(value);
const sampleScreens = () => SAMPLE_SCREENS.map(s => ({ ...s, elements: s.elements.map(e => ({ ...e })) }));
const readImage = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
const parseLinks = value => value.split(",").map(part => { const i = part.lastIndexOf(">"); return i < 0 ? null : { text: part.slice(0, i).trim(), to: part.slice(i + 1).trim().toUpperCase() }; }).filter(e => e?.text && /^S\d+$/.test(e.to));
function canReachGoal(screens, goal) {
  const map = new Map(screens.map(s => [s.id, s]));
  const queue = [screens[0]?.id], visited = new Set();
  while (queue.length) {
    const id = queue.shift();
    if (id === goal) return true;
    if (visited.has(id) || !map.has(id)) continue;
    visited.add(id); queue.push(...map.get(id).elements.map(e => e.to));
  }
  return false;
}

export default function IntegratedCreatePage({ setPage, finish, onDraftMetaChange }) {
  const [draft, setDraft] = useState(createDraft);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [ready, setReady] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [selectedScreenId, setSelectedScreenId] = useState(null);
  const initialSnapshot = useRef(null);
  const latest = useRef(null);
  const timer = useRef(null);
  const finishing = useRef(false);
  latest.current = { draft, step };

  useEffect(() => {
    let active = true;
    loadSetupDraft().then(saved => {
      if (!active) return;
      if (saved) {
        setDraft(saved.draft);
        setStep(Math.max(0, Math.min(3, saved.step || 0)));
        setHasSavedDraft(true);
        setMessage("저장된 초안을 불러왔습니다. 이어서 작성하세요.");
        initialSnapshot.current = JSON.stringify({ draft: saved.draft, step: saved.step || 0 });
      } else {
        initialSnapshot.current = JSON.stringify(latest.current);
        onDraftMetaChange(null);
      }
      setReady(true);
      setSaveState("saved");
    }).catch(() => {
      if (!active) return;
      initialSnapshot.current = JSON.stringify(latest.current);
      setReady(true);
      setSaveState("error");
    });
    return () => { active = false; };
  }, [onDraftMetaChange]);

  useEffect(() => {
    if (!ready || finishing.current) return;
    const snapshot = JSON.stringify({ draft, step });
    if (snapshot === initialSnapshot.current) return;
    setSaveState("saving");
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      saveSetupDraft(draft, step).then(meta => {
        initialSnapshot.current = snapshot;
        setHasSavedDraft(true);
        setSaveState("saved");
        onDraftMetaChange(meta);
      }).catch(() => setSaveState("error"));
      timer.current = null;
    }, 450);
    return () => clearTimeout(timer.current);
  }, [draft, step, ready, onDraftMetaChange]);

  useEffect(() => () => {
    if (timer.current && !finishing.current) {
      clearTimeout(timer.current);
      saveSetupDraft(latest.current.draft, latest.current.step).then(onDraftMetaChange).catch(() => {});
    }
  }, [onDraftMetaChange]);

  async function startFresh() {
    if (!window.confirm("저장된 초안을 삭제하고 새 테스트를 시작할까요?")) return;
    setBusy(true);
    clearTimeout(timer.current);
    timer.current = null;
    try {
      await clearSetupDraft();
      const fresh = createDraft();
      initialSnapshot.current = JSON.stringify({ draft: fresh, step: 0 });
      setDraft(fresh);
      setStep(0);
      setFileName("");
      setSelectedScreenId(null);
      setHasSavedDraft(false);
      setSaveState("saved");
      setMessage("새 테스트를 시작했습니다.");
      onDraftMetaChange(null);
    } catch {
      setMessage("초안을 지우지 못했습니다. 브라우저 저장소를 확인한 뒤 다시 시도하세요.");
    } finally { setBusy(false); }
  }

  async function completeSetup() {
    setBusy(true);
    clearTimeout(timer.current);
    timer.current = null;
    try {
      finishing.current = true;
      await clearSetupDraft();
      onDraftMetaChange(null);
      finish({ ...draft, status: "실행 대기", updated: "방금", ai: draft.personas.length, tone: "running" });
    } catch {
      finishing.current = false;
      setBusy(false);
      setMessage("초안을 정리하지 못했습니다. 다시 시도해 주세요.");
    }
  }
  const patch = change => setDraft(s => ({ ...s, ...change }));
  const updateProduct = change => setDraft(s => ({ ...s, ...(change.name !== undefined ? { name: change.name } : {}), product: { ...s.product, ...change } }));
  const updatePanel = change => setDraft(s => ({ ...s, panel: { ...s.panel, ...change }, personas: [] }));
  const updateScreens = next => patch({ screens: next, goal: next.some(s => s.id === draft.goal) ? draft.goal : next.at(-1)?.id || "" });
  const updateScreen = (id, change) => updateScreens(draft.screens.map(s => s.id === id ? { ...s, ...change } : s));
  const selectedScreen = draft.screens.find(s => s.id === selectedScreenId) || draft.screens[0];
  const selectedScreenIndex = draft.screens.findIndex(s => s.id === selectedScreen?.id);
  const updateElements = elements => updateScreen(selectedScreen.id, { elements, linksDraft: elements.map(e => `${e.text}>${e.to}`).join(", ") });
  const addBlankScreen = () => {
    const id = `S${String(draft.screens.length + 1).padStart(2, "0")}`;
    updateScreens([...draft.screens, { id, label: "새 화면", description: "", fields: 0, image: null, elements: [] }]);
    setSelectedScreenId(id);
  };
  const generating = step === 2 && busy;
  const displayStep = generating ? 3 : step;
  const commonTrait = Object.entries(draft.personas.flatMap(p => p.traits).reduce((counts, trait) => ({ ...counts, [trait]: (counts[trait] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0];
  const averagePriceSensitivity = draft.personas.length ? (draft.personas.reduce((sum, p) => sum + p.price_sensitivity, 0) / draft.personas.length).toFixed(2) : "—";
  const panelChoices = key => <fieldset className={`persona-panel-choice choice-${key}`} key={key}><legend>{PANEL_LABELS[key]}</legend><div className="segmented">{PANEL_OPTIONS[key].map(([value, label]) => <button type="button" key={optionKey(value)} className={optionKey(draft.panel[key]) === optionKey(value) ? "on" : ""} aria-pressed={optionKey(draft.panel[key]) === optionKey(value)} onClick={() => updatePanel({ [key]: value })}>{label}</button>)}</div></fieldset>;

  async function uploadPlan(file) {
    if (!file) return;
    setBusy(true); setFileName(file.name);
    try {
      if (/\.pdf$/i.test(file.name)) {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const pages = [];
        for (let i = 1; i <= Math.min(doc.numPages, 30); i++) {
          const content = await (await doc.getPage(i)).getTextContent();
          pages.push(content.items.map(item => item.str || "").join(" "));
        }
        if (!pages.join("").trim()) throw new Error("텍스트를 추출할 수 없는 PDF입니다. 스캔 이미지라면 내용을 직접 붙여넣으세요.");
        patch({ plan: pages.join("\n") });
        setMessage(`PDF ${doc.numPages}쪽에서 텍스트를 읽었습니다. 내용을 확인하세요.`);
      } else {
        patch({ plan: await file.text() });
        setMessage("문서를 읽었습니다. 내용을 확인하세요.");
      }
    } catch (error) { setMessage(`파일을 읽지 못했습니다: ${error.message}`); }
    finally { setBusy(false); }
  }
  function organize() {
    if (!draft.plan.trim()) return setMessage("기획서 내용을 먼저 입력하세요.");
    setBusy(true); setMessage("기획서 정리 중…");
    window.setTimeout(() => {
      updateProduct(extractPlanDemo(draft.plan));
      setBusy(false);
      setMessage("체험용 정리를 마쳤습니다. 제품 정보를 검토하고 수정하세요. 실제 AI 추출은 아직 연결되지 않았습니다.");
    }, 350);
  }
  function loadSample(fromFigma = false) {
    if (fromFigma && !/figma\.com\/(?:file|design|proto)\//i.test(draft.figmaUrl)) return setMessage("Figma URL 형식을 확인하세요.");
    if (fromFigma) { setBusy(true); setMessage("프로토타입 화면을 불러오는 중…"); }
    const apply = () => { updateScreens(sampleScreens()); setSelectedScreenId(null); setMessage(fromFigma ? "데모 모드: Figma 파일 대신 일정메이트 샘플을 불러왔습니다." : "샘플 화면 5개를 불러왔습니다."); setBusy(false); };
    if (fromFigma) window.setTimeout(apply, 450); else apply();
  }
  async function addImages(files) {
    if (!files.length) return;
    setBusy(true);
    try {
      const added = await Promise.all([...files].map(async file => ({ label: file.name.replace(/\.[^.]+$/, ""), description: "", fields: 0, image: await readImage(file), elements: [] })));
      updateScreens([...draft.screens, ...added].map((s, i) => ({ ...s, id: `S${String(i + 1).padStart(2, "0")}` })));
      setSelectedScreenId(`S${String(draft.screens.length + 1).padStart(2, "0")}`);
      setMessage(`이미지 ${added.length}장을 추가했습니다.`);
    } catch { setMessage("이미지를 읽지 못했습니다."); }
    finally { setBusy(false); }
  }
  function removeScreen(id) {
    const remaining = draft.screens.filter(s => s.id !== id);
    const mapping = Object.fromEntries(remaining.map((s, i) => [s.id, `S${String(i + 1).padStart(2, "0")}`]));
    const nextSelection = selectedScreen?.id === id ? remaining[Math.min(draft.screens.findIndex(s => s.id === id), remaining.length - 1)]?.id : selectedScreen?.id;
    setSelectedScreenId(mapping[nextSelection] || null);
    patch({ screens: remaining.map(s => { const elements = s.elements.filter(e => mapping[e.to]).map(e => ({ ...e, to: mapping[e.to] })); return { ...s, id: mapping[s.id], elements, linksDraft: elements.map(e => `${e.text}>${e.to}`).join(", ") }; }), goal: mapping[draft.goal] || mapping[remaining.at(-1)?.id] || "" });
  }
  function next() {
    if (busy) return;
    setMessage("");
    if (step === 0 && (!draft.product.name.trim() || !draft.product.description.trim())) return setMessage("제품명과 설명을 입력하세요.");
    if (step === 1 && (!draft.screens.length || !draft.task.trim() || !draft.goal)) return setMessage("화면, 과제, 목표 화면을 확인하세요.");
    if (step === 1 && draft.screens.some(s => s.elements.some(e => !e.text.trim()))) return setMessage("연결할 버튼 이름을 입력하거나 해당 연결을 삭제하세요.");
    if (step === 1 && draft.screens.some(s => s.elements.some(e => !draft.screens.some(target => target.id === e.to)))) return setMessage("버튼 연결의 도착 화면 번호를 확인하세요.");
    if (step === 1 && !canReachGoal(draft.screens, draft.goal)) return setMessage("첫 화면에서 목표 화면까지 이어지는 버튼 연결을 만들어 주세요.");
    if (step === 2) { setBusy(true); setMessage("설정한 범위에서 Persona를 생성하는 중…"); window.setTimeout(() => { patch({ personas: generatePersonas(draft) }); setBusy(false); setMessage(""); setStep(3); }, 350); return; }
    if (step === 3) return completeSetup();
    setStep(step + 1);
  }
  if (!ready) return <><Header title="새 테스트" subtitle="저장된 설정을 확인하고 있습니다." /><main className="integrated-page setup-page"><section className="flow-card" role="status">작성 중인 테스트를 불러오는 중…</section></main></>;
  return <>
    <Header title="새 테스트" subtitle="제품, 프로토타입, AI 패널을 한 흐름에서 준비하세요." />
    <main className={`integrated-page setup-page${step >= 2 ? ` persona-setup ${generating ? "persona-generating" : step === 3 ? "persona-review" : "persona-panel"}` : ` product-setup ${step === 0 ? "product-planning" : "prototype-planning"}`}`}>
      <div className="flow-top"><button className="text-button" onClick={() => setPage("studies")}><ArrowLeft size={16} /> 테스트 목록</button><div className="setup-save-actions"><span className={`setup-save-status ${saveState}`} role="status">{!ready ? "초안 확인 중…" : saveState === "saving" ? "초안 저장 중…" : saveState === "error" ? "자동 저장 실패" : hasSavedDraft ? "초안 자동 저장됨 · 이 브라우저" : "입력하면 자동 저장됩니다"}</span>{hasSavedDraft && <button className="text-button" disabled={busy} onClick={startFresh}>새로 시작</button>}<span className="demo-mark">AI 시뮬레이션 · 데모 데이터</span></div></div>
      <ol className="flow-steps" aria-label="테스트 생성 단계">{labels.map((label, i) => <li key={label} className={i === displayStep ? "active" : i < displayStep ? "done" : ""}><span>{i < displayStep ? <Check size={14} /> : i + 1}</span><b>{generating && i === 3 ? "Persona 생성 중" : label}</b></li>)}</ol>
      {!generating && <div className="flow-heading"><p>{step >= 2 ? step === 3 ? "SYNTHESIZED PERSONAS · 최종 검토" : "SYNTHETIC SAMPLE DEFINITION" : <>STEP {step + 1} / 4</>}</p><h2>{step === 2 ? "AI 패널 설정" : step === 1 ? "프로토타입 설정" : labels[step]}</h2><span>{["AI Persona가 읽을 제품 정보를 준비합니다.", "Agent가 탐색할 화면과 이동 경로를 설정합니다.", "테스트에 참여할 AI 사용자의 조건과 성향 범위를 고릅니다.", `생성된 ${draft.personas.length}명의 가상 사용자를 확인한 뒤 테스트를 시작합니다.`][step]}</span>{step === 2 && <div className="persona-count-preview"><Users size={20} /><div><small>생성할 페르소나</small><b>{draft.panel.count}명 · 선택한 패널 조건</b></div></div>}</div>}
      {message && !generating && <div className="flow-message" role="status">{message}</div>}
      {step === 0 && <div className="setup-grid">
        <section className="flow-card product-plan-card"><header><h3>제품 기획서</h3><p>내용을 직접 입력하거나 파일을 올리세요.</p></header><label htmlFor="plan-text">기획서 내용</label><textarea id="plan-text" rows={10} value={draft.plan} onChange={e => patch({ plan: e.target.value })} />
          <div className="flow-actions"><label className="secondary file-button"><Upload size={15} /> .txt · .md · .pdf<input id="plan-upload" type="file" accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf" hidden onChange={e => uploadPlan(e.target.files?.[0])} /></label><button className="primary" disabled={busy} onClick={organize}><WandSparkles size={15} /> AI로 정리</button></div>
          {fileName && <small className="subtle">선택한 파일: {fileName}</small>}<p className="demo-note">현재는 체험용 텍스트 정리입니다. 결과를 직접 수정할 수 있습니다.</p></section>
        <section className="flow-card product-info-card"><header><h3>제품 정보</h3><p>이 내용이 각 Persona의 Ask 판단에 사용됩니다.</p></header>
          <label htmlFor="product-name">제품명 *</label><input id="product-name" value={draft.product.name} onChange={e => updateProduct({ name: e.target.value })} />
          <label htmlFor="product-desc">설명 *</label><textarea id="product-desc" rows={3} value={draft.product.description} onChange={e => updateProduct({ description: e.target.value })} />
          <label htmlFor="product-features">기능 · 한 줄에 하나</label><textarea id="product-features" rows={5} value={draft.product.features.join("\n")} onChange={e => updateProduct({ features: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} />
          <label htmlFor="product-price">가격</label><input id="product-price" value={draft.product.price} onChange={e => updateProduct({ price: e.target.value })} />
          <div className="product-preview"><small>AI PERSONA가 읽는 제품 소개</small><div className="product-preview-card"><div><h4>{draft.product.name || "제품명"}</h4><b>{draft.product.price || "가격 미정"}</b></div><p>{draft.product.description || "제품 설명이 여기에 표시됩니다."}</p><div className="product-preview-features">{draft.product.features.map(f => <span key={f}>{f}</span>)}</div></div></div>
        </section>
      </div>}
      {step === 1 && <div className="prototype-workspace">
        <section className="flow-card prototype-import"><div className="figma-row"><label htmlFor="figma-url">Figma URL</label><div><input id="figma-url" value={draft.figmaUrl} placeholder="https://www.figma.com/design/…" onChange={e => patch({ figmaUrl: e.target.value })} /><button className="primary" disabled={busy} onClick={() => draft.figmaUrl.trim() ? loadSample(true) : setMessage("Figma URL을 입력하세요.")}>{busy ? "불러오는 중…" : "Figma 가져오기"}</button></div></div><div className="prototype-import-actions"><small><Info size={13} /> 실제 Figma 연결 전입니다. 체험 모드에서는 샘플 화면을 불러옵니다.</small><div className="flow-actions"><label className="secondary file-button"><Upload size={14} /> 이미지 업로드<input id="prototype-images" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={e => addImages(e.target.files || [])} /></label><button className="secondary" onClick={addBlankScreen}><Plus size={14} /> 빈 화면 추가</button><button className="secondary prototype-sample" onClick={() => loadSample()}>샘플(일정메이트) 불러오기</button></div></div></section>
        <section className="flow-card prototype-flow"><div className="prototype-section-head"><div><h3>화면 탐색 흐름 <small>(Prototype Flow)</small></h3><span>{draft.screens.length}개 화면 등록됨</span></div><p>화면을 선택해 이미지와 정보를 편집하세요.</p></div><nav className="prototype-flow-list" aria-label="프로토타입 화면 선택">{draft.screens.map((screen, i) => <button key={screen.id} className={`prototype-flow-screen${selectedScreen?.id === screen.id ? " selected" : ""}${screen.id === draft.goal ? " goal" : ""}`} aria-pressed={selectedScreen?.id === screen.id} onClick={() => setSelectedScreenId(screen.id)}><span className="prototype-flow-label"><b>{screen.id}</b><em>{selectedScreen?.id === screen.id ? "편집 중" : i === 0 ? "시작" : screen.id === draft.goal ? "목표" : "화면"}</em></span><span className="prototype-flow-content">{screen.image ? <img src={screen.image} alt="" /> : <ImagePlus size={19} />}<span><strong>{screen.label || "이름 없는 화면"}</strong><small>{screen.description || "설명 없음"}</small></span></span><span className="prototype-flow-links">{screen.elements.length ? screen.elements.map(e => e.to).join(" · ") : "연결 없음"}</span></button>)}</nav>{!draft.screens.length && <p className="prototype-empty-list">화면이 없습니다. 이미지를 업로드하거나 빈 화면을 추가하세요.</p>}</section>
        {selectedScreen && <section className="flow-card prototype-editor"><div className="prototype-editor-heading"><div><span>{selectedScreen.id}</span><div><h3>{selectedScreen.id} {selectedScreen.label || "이름 없는 화면"} 상세 편집</h3><p>이미지를 확인하고 화면 정보와 이동할 버튼을 설정합니다.</p></div></div><button className="secondary prototype-delete" aria-label={`${selectedScreen.id} 삭제`} onClick={() => removeScreen(selectedScreen.id)}><Trash2 size={14} /> 화면 삭제</button></div><div className="prototype-editor-columns"><div className="prototype-image-column"><div className="prototype-image-heading"><span>화면 이미지 미리보기</span><div><label className="prototype-image-upload"><ImagePlus size={13} /> {selectedScreen.image ? "이미지 교체" : "이미지 등록"}<input id="selected-screen-image" key={selectedScreen.id} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={async e => { if (e.target.files?.[0]) updateScreen(selectedScreen.id, { image: await readImage(e.target.files[0]) }); }} /></label>{selectedScreen.image && <button className="text-button" onClick={() => updateScreen(selectedScreen.id, { image: null })}>제거</button>}</div></div><div className={`prototype-image-preview${selectedScreen.image ? " has-image" : ""}`}>{selectedScreen.image ? <img src={selectedScreen.image} alt={`${selectedScreen.label} 화면 미리보기`} /> : <div className="prototype-image-empty"><ImagePlus size={34} /><b>등록된 이미지가 없습니다.</b><p>{selectedScreen.id} {selectedScreen.label}의 이미지를 등록하세요.</p><small>이미지 없이도 화면 정보와 연결을 편집할 수 있습니다.</small></div>}</div><p className="prototype-image-note">등록한 이미지는 미리보기로 표시됩니다. 화면 정보와 버튼 연결은 직접 편집하세요.</p></div><div className="prototype-info-column"><div className="prototype-info-top"><label htmlFor="screen-id">화면 식별자 (ID)<input id="screen-id" value={selectedScreen.id} readOnly /></label><label htmlFor="screen-label">화면 이름<input id="screen-label" value={selectedScreen.label} onChange={e => updateScreen(selectedScreen.id, { label: e.target.value })} /></label></div><label htmlFor="screen-description">화면 설명<textarea id="screen-description" rows={3} value={selectedScreen.description} onChange={e => updateScreen(selectedScreen.id, { description: e.target.value })} /></label><div className="prototype-connections-heading"><div><h4>버튼 인터랙션 및 화면 연결</h4><p>선택할 버튼의 이름과 이동할 화면을 지정하세요.</p></div><span>{selectedScreen.elements.length}개 연결</span></div><div className="prototype-connections">{selectedScreen.elements.map((element, index) => <div className="prototype-connection" key={`${selectedScreen.id}-${index}`}><label>버튼 이름<input aria-label={`버튼 ${index + 1} 이름`} value={element.text} onChange={e => updateElements(selectedScreen.elements.map((item, j) => j === index ? { ...item, text: e.target.value } : item))} /></label><ArrowRight size={16} /><label>이동 대상 화면<select aria-label={`버튼 ${index + 1} 이동 대상`} value={element.to} onChange={e => updateElements(selectedScreen.elements.map((item, j) => j === index ? { ...item, to: e.target.value } : item))}>{!draft.screens.some(s => s.id === element.to) && <option value={element.to}>{element.to} · 연결 확인 필요</option>}{draft.screens.map(s => <option key={s.id} value={s.id}>{s.id} · {s.label}</option>)}</select></label><button className="icon-btn" aria-label={`버튼 ${index + 1} 연결 삭제`} onClick={() => updateElements(selectedScreen.elements.filter((_, j) => j !== index))}><Trash2 size={14} /></button></div>)}</div><button className="prototype-add-connection" onClick={() => updateElements([...selectedScreen.elements, { text: "새 버튼", to: draft.screens[selectedScreenIndex + 1]?.id || draft.goal || selectedScreen.id }])}><Plus size={15} /> 버튼 연결 추가</button><details className="prototype-raw-links"><summary>연결 직접 입력</summary><label htmlFor="screen-links">버튼명&gt;S02 형식 · 여러 연결은 쉼표로 구분<input id="screen-links" value={selectedScreen.linksDraft ?? selectedScreen.elements.map(e => `${e.text}>${e.to}`).join(", ")} onChange={e => updateScreen(selectedScreen.id, { linksDraft: e.target.value, elements: parseLinks(e.target.value) })} placeholder="버튼명>S02" /></label></details></div></div></section>}
        <section className="flow-card prototype-task"><div className="prototype-section-head"><div><h3>AI Persona 과제와 목표 화면 선택</h3></div><p>과제와 도달 기준이 되는 화면을 정의합니다.</p></div><div className="setup-grid task-grid"><label htmlFor="prototype-task">AI Persona에게 부여할 과제<input id="prototype-task" value={draft.task} onChange={e => patch({ task: e.target.value, desc: `${e.target.value} 검증` })} /></label><label htmlFor="prototype-goal">도달 판단 목표 화면<select id="prototype-goal" value={draft.goal} onChange={e => patch({ goal: e.target.value })}>{!draft.screens.length && <option value="">화면을 먼저 추가하세요</option>}{draft.screens.map(s => <option key={s.id} value={s.id}>{s.id} · {s.label}</option>)}</select></label></div><p className={`prototype-check${canReachGoal(draft.screens, draft.goal) ? " connected" : ""}`}><Info size={14} /> {draft.screens.length ? <>{draft.screens[0]?.id} {draft.screens[0]?.label}에서 {draft.goal} {draft.screens.find(s => s.id === draft.goal)?.label}까지 · 연결 {draft.screens.reduce((n, s) => n + s.elements.length, 0)}개 · {canReachGoal(draft.screens, draft.goal) ? "목표 화면 도달 가능" : "연결 확인 필요"}</> : "시작할 화면과 목표 화면을 추가하세요."}</p></section>
      </div>}
      {step === 2 && !generating && <div className="persona-panel-groups"><section className="flow-card persona-panel-group"><div className="persona-group-heading"><span>01</span><div><h3>기본 모집 조건 <small>(Demographics)</small></h3><p>생성할 사용자 수와 소속, 연령 범위를 설정합니다.</p></div><small>기본 조건</small></div><div className="persona-demographics">{["count", "occupation", "age"].map(panelChoices)}</div></section><section className="flow-card persona-panel-group"><div className="persona-group-heading"><span>02</span><div><h3>행동 및 태도 성향 <small>(Behavior & Propensity)</small></h3><p>앱 사용 빈도, 가격 민감도, 새로운 디지털 도구의 수용 범위를 고릅니다.</p></div><small>성향 조건</small></div><div className="persona-behavior">{["app_usage", "price_sensitivity", "digital_adoption"].map(panelChoices)}</div></section><div className="persona-panel-principle"><Sparkles size={23} /><div><h3>AI 가상 사용자 시뮬레이션 안내</h3><p>{panelLabel("age", draft.panel.age)} {panelLabel("occupation", draft.panel.occupation)} {draft.panel.count}명을 선택한 성향 범위에서 생성합니다. 같은 Persona가 Ask와 Act를 수행합니다.</p><small>현재는 규칙 기반 체험용 데이터입니다. 실제 인구 분포를 대표하지 않으며, 실제 사용자 조사 결과가 아닙니다.</small></div></div><div className="persona-panel-ready"><Users size={18} /><b>{draft.panel.count}명의 Persona 생성 준비</b><span>조건을 확인한 뒤 생성·확인을 진행하세요.</span></div></div>}
      {generating && <section className="persona-generation-card" role="status" aria-live="polite"><div className="persona-generation-orbit" aria-hidden="true"><span /><i /><i /><i /></div><span className="persona-generation-kicker">PERSONA GENERATION IN PROGRESS</span><h2>AI 페르소나를 생성하는 중입니다</h2><p>선택한 패널 조건에 따라 <b>{draft.panel.count}명의 가상 사용자</b>를 생성하고 있습니다.</p><div className="persona-generation-conditions"><small>적용된 패널 조건</small><div className="persona-condition-chips">{Object.keys(PANEL_OPTIONS).map(key => <span key={key}>{PANEL_LABELS[key]} <b>{panelLabel(key, draft.panel[key])}</b></span>)}</div></div><div className="persona-generation-notice"><p>생성이 완료되면 Persona 확인 화면으로 자동 이동합니다.</p><small>규칙 기반 시뮬레이션 · 현재 선택한 조건으로 생성</small></div></section>}
      {step === 3 && <><section className="flow-card persona-review-panel"><div className="flow-card-head"><div><span className="section-kicker">AI RESEARCH PANEL <em>{draft.personas.length}명 생성됨</em></span><h3>생성된 Persona</h3><p>동일한 {draft.personas.length}명의 사용자가 Ask와 Act를 모두 수행합니다.</p></div><button className="secondary persona-regenerate" onClick={() => { const generation = (draft.generation || 0) + 1; patch({ generation, personas: generatePersonas({ ...draft, generation }) }); }}><RotateCcw size={15} /> 다시 생성</button></div><div className="persona-grid persona-review-grid">{draft.personas.map(p => <article className="persona-card" key={p.persona_id}><div className="persona-head"><span>{p.persona_id.slice(-2)}</span><div><small>AI PARTICIPANT</small><b>{p.persona_id}</b></div><em>{p.age}세 · {OCCUPATIONS[p.occupation]}</em></div><div className="trait-list">{p.traits.length ? p.traits.map(t => <span key={t}>#{TRAITS[t]}</span>) : <span>일반 사용자</span>}</div><p className="persona-context">현재 도구 <b>{TOOLS[p.existing_tool]}</b></p><div className="persona-metrics">{[["앱 사용 빈도", p.app_usage_freq], ["가격 민감도", p.price_sensitivity], ["디지털 수용도", p.digital_adoption]].map(([label, value]) => <div className="persona-meter" key={label}><span>{label}</span><b>{value.toFixed(2)}</b></div>)}</div></article>)}</div><div className="persona-panel-summary"><Sparkles size={23} /><div><h4>패널 요약</h4><p>전체 {draft.personas.length}명{commonTrait ? ` 중 ${commonTrait[1]}명이 #${TRAITS[commonTrait[0]]} 특성을 공유합니다.` : "의 등록된 공통 특성이 없습니다."} 평균 가격 민감도는 <b>{averagePriceSensitivity}</b>입니다.</p></div><span><i /> 시뮬레이션 준비 완료</span></div></section><p className="persona-review-notice"><Info size={16} /> 이 Persona의 특성과 수치는 선택한 조건으로 생성한 가상 사용자 데이터이며, 실제 사용자 조사 결과가 아닙니다.</p></>}
      <div className="flow-footer"><button className="secondary" disabled={busy || !ready} onClick={() => step ? (setMessage(""), setStep(step - 1)) : setPage("studies")}>{step ? "이전 단계" : "목록으로"}</button>{step >= 2 && <small className="persona-footer-note">{generating ? "생성이 완료되면 자동으로 전환됩니다." : step === 3 ? `${draft.personas.length}명의 Persona와 검증을 시작합니다.` : "다음: 생성된 Persona를 확인합니다."}</small>}<button className="primary" disabled={busy || !ready} onClick={next}>{busy ? "처리 중…" : step === 2 ? "Persona 생성·확인" : step === 3 ? "AI 테스트로 이동" : "다음 단계"} <ArrowRight size={16} /></button></div>
    </main>
  </>;
}
