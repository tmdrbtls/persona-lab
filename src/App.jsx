import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { studies } from './data/demoData';
import { getSetupDraftMeta } from './data/setupDraft';
import CosmosHome from './pages/CosmosHome';
import IntegratedCreatePage from './pages/IntegratedCreatePage';
import ReportPage from './pages/ReportPage';
import RunPage from './pages/RunPage';
import SampleRunPage from './pages/SampleRunPage';
import StudiesPage from './pages/StudiesPage';

function initialStudies() {
  try {
    const saved = JSON.parse(localStorage.getItem('personalab-integrated-studies') || '[]');
    return [...saved.filter(s => s?.integrated), ...studies];
  } catch { return [...studies]; }
}

function readRoute() {
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'create') return { page: 'create' };
  if (parts[0] === 'tests' && parts[1]) return { page: parts[2] === 'run' ? 'run' : 'report', id: parts[1], tab: parts[2] === 'report' ? 'report' : 'overview' };
  if (parts[0] === 'tests') return { page: 'studies' };
  return { page: 'home' };
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [studyList, setStudyList] = useState(initialStudies);
  const [focusPersonaId, setFocusPersonaId] = useState(null);
  const [draftMeta, setDraftMeta] = useState(getSetupDraftMeta);
  const study = studyList.find(s => String(s.id) === String(route.id)) || studyList[0];

  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    try { localStorage.setItem('personalab-integrated-studies', JSON.stringify(studyList.filter(s => s.integrated))); }
    catch { /* Images may exceed browser storage; the in-memory study remains available. */ }
  }, [studyList]);

  const navigate = useCallback((next, id, tab) => {
    const path = next === 'home' ? '/' : next === 'create' ? '/create' : next === 'studies' ? '/tests' : next === 'run' ? `/tests/${id}/run` : tab === 'report' ? `/tests/${id}/report` : `/tests/${id}`;
    history.pushState({}, '', path);
    setRoute({ page: next, id, tab });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  const setPage = next => navigate(next, study?.id);
  const updateStudy = useCallback((id, changes) => setStudyList(list => list.map(s => s.id === id ? { ...s, ...changes } : s)), []);
  const goReport = (selected, tab = 'overview') => navigate('report', selected.id, tab);
  const goRun = (selected = study, personaId = null) => { setFocusPersonaId(personaId); navigate('run', selected.id); };
  const openStudy = selected => {
    if (!selected.integrated && selected.tone === 'draft') return navigate('create');
    if (selected.status === '실행 중' || selected.tone === 'running') return goRun(selected);
    return goReport(selected, selected.run || selected.tone === 'complete' ? 'report' : 'overview');
  };
  const finishCreate = newStudy => { setStudyList(list => [newStudy, ...list]); goRun(newStudy); };

  return <div className="cosmos-shell">
    <header className="cosmos-nav">
      <button className="cosmos-wordmark" onClick={() => navigate('home')} aria-label="PersonaLab 홈">persona<span>lab</span><i aria-hidden="true">✳</i></button>
      <nav aria-label="주요 메뉴"><button className={route.page === 'home' ? 'active' : ''} onClick={() => navigate('home')}>홈</button><button className={route.page === 'studies' || route.page === 'report' || route.page === 'run' ? 'active' : ''} onClick={() => navigate('studies')}>모든 테스트</button></nav>
      <button className="cosmos-nav-cta" onClick={() => navigate('create')}><Plus size={16} /> 새 테스트 시작하기 <ArrowUpRight size={15} /></button>
    </header>
    <div className="cosmos-main">
      {route.page === 'home' && <CosmosHome studyList={studyList} draftMeta={draftMeta} onOpen={openStudy} onCreate={() => navigate('create')} onAll={() => navigate('studies')} />}
      {route.page === 'studies' && <StudiesPage studyList={studyList} draftMeta={draftMeta} goReport={openStudy} setPage={setPage} />}
      {route.page === 'create' && <IntegratedCreatePage finish={finishCreate} setPage={setPage} onDraftMetaChange={setDraftMeta} />}
      {route.page === 'run' && (study.integrated ? <RunPage key={study.id} study={study} onUpdate={updateStudy} setPage={setPage} openReport={() => goReport(study, 'report')} focusPersonaId={focusPersonaId} /> : <SampleRunPage study={study} onBack={() => navigate('studies')} onCreate={() => navigate('create')} />)}
      {route.page === 'report' && <ReportPage key={`${study.id}-${route.tab}`} study={study} setPage={setPage} goRun={goRun} initialTab={route.tab || 'overview'} />}
    </div>
    <footer className="cosmos-footer"><span>PERSONALAB © 2026</span><span>AI 페르소나의 말과 행동을 함께 봅니다.</span><span>현재 화면의 예시는 데모 데이터입니다.</span></footer>
  </div>;
}
