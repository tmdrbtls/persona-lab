// PersonaLab 시안 공통 엔진 — 모든 수치는 데모용 예시 데이터다.
// 공개 분포에서 페르소나를 샘플링하고(학습 아님), Ask/Act 결과를 결정적으로 만든다.
(function (global) {
  const hash = s => [...String(s)].reduce((n, c) => ((n * 31 + c.charCodeAt(0)) >>> 0), 7);
  const rng = seed => { let n = seed || 1; return () => ((n = (1664525 * n + 1013904223) >>> 0) / 4294967296); };
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const round2 = v => Math.round(v * 100) / 100;
  // 대략적 정규형 표본: 균등분포 3개 평균
  const bell = (r, mean, spread) => clamp(mean + ((r() + r() + r()) / 3 - 0.5) * spread * 2, 0.02, 0.98);

  const BANDS = { low: [0, 0.4], mid: [0.4, 0.7], high: [0.7, 1] };
  const bandOf = v => (v < 0.4 ? "low" : v < 0.7 ? "mid" : "high");
  const BAND_LABEL = { low: "낮음", mid: "중간", high: "높음" };
  // 기획서 3-1의 예시 분포 (전체 선택 시 목표 분포)
  const PUBLIC_MIX = {
    price: { low: 0.2, mid: 0.5, high: 0.3 },
    privacy: { low: 0.3, mid: 0.45, high: 0.25 },
    app: { low: 0.15, mid: 0.55, high: 0.3 },
  };

  const OPTIONS = {
    count: [[20, "20명"], [50, "50명"], [100, "100명"]],
    occupation: [["student", "대학생"], ["worker", "직장인"], ["all", "전체"]],
    age: [["20-29", "20대"], ["20-39", "20~30대"], ["20-49", "20~40대"]],
    price: [["low", "낮음"], ["mid", "중간"], ["high", "높음"], ["all", "전체"]],
    privacy: [["low", "낮음"], ["mid", "중간"], ["high", "높음"], ["all", "전체"]],
  };
  OPTIONS.compare = [["none", "안 함"], ["age", "연령"], ["occupation", "소속"], ["gender", "성별"], ["price", "가격 민감도"]];
  OPTIONS.minPer = [[20, "20명"], [30, "30명"], [40, "40명"]];
  const OPTION_LABELS = { count: "인원", occupation: "소속", age: "연령", price: "가격 민감도", privacy: "개인정보 우려", compare: "비교할 기준", minPer: "그룹당 최소 인원" };

  // 그룹 비교: 기준별 그룹과 공개 분포 비중(전체 수치 보정용, 데모 예시값)
  const AGE_GROUPS = [["a20", "20대", 20, 29, 0.31], ["a30", "30대", 30, 39, 0.32], ["a40", "40대", 40, 49, 0.37]];
  const DIMS = {
    age: { label: "연령", of: p => (AGE_GROUPS.find(g => p.age >= g[2] && p.age <= g[3]) || AGE_GROUPS[0])[0], names: Object.fromEntries(AGE_GROUPS.map(g => [g[0], g[1]])) },
    occupation: { label: "소속", of: p => p.occupation, names: { student: "대학생", worker: "직장인" } },
    gender: { label: "성별", of: p => (p.gender === "여성" ? "f" : "m"), names: { f: "여성", m: "남성" } },
    price: { label: "가격 민감도", of: p => bandOf(p.price), names: { low: "가격 민감도 낮음", mid: "가격 민감도 중간", high: "가격 민감도 높음" } },
    app: { label: "앱 이용 빈도", of: p => bandOf(p.app), names: { low: "앱 이용 적음", mid: "앱 이용 중간", high: "앱 이용 많음" } },
  };
  // 지금 범위(누구를 넣을까)에서 고른 기준으로 나눌 수 있는 그룹. 그룹이 둘 미만이면 비교할 수 없다.
  function compareGroups(panel) {
    const c = panel.compare;
    if (!c || c === "none") return { ok: false, groups: [] };
    const [aLo, aHi] = String(panel.age).split("-").map(Number);
    let groups = [], why = "";
    if (c === "age") { groups = AGE_GROUPS.filter(g => g[3] >= aLo && g[2] <= aHi).map(g => ({ key: g[0], label: g[1], share: g[4], lo: Math.max(g[2], aLo), hi: Math.min(g[3], aHi) })); why = "연령 범위를 20~30대 이상으로 넓혀야 연령끼리 비교할 수 있습니다."; }
    if (c === "occupation") { groups = panel.occupation === "all" ? [{ key: "student", label: "대학생", share: 0.3 }, { key: "worker", label: "직장인", share: 0.7 }] : []; why = "소속을 '전체'로 해야 소속끼리 비교할 수 있습니다."; }
    if (c === "gender") groups = [{ key: "f", label: "여성", share: 0.5 }, { key: "m", label: "남성", share: 0.5 }];
    if (c === "price") { groups = panel.price === "all" ? ["low", "mid", "high"].map(b => ({ key: b, label: "가격 민감도 " + BAND_LABEL[b], share: PUBLIC_MIX.price[b] })) : []; why = "가격 민감도를 '전체'로 해야 가격 민감도끼리 비교할 수 있습니다."; }
    if (groups.length < 2) return { ok: false, groups: [], why };
    const tot = groups.reduce((a, g) => a + g.share, 0); groups.forEach(g => (g.share = g.share / tot));
    return { ok: true, dim: c, groups };
  }
  const panelSize = panel => { const cg = compareGroups(panel); return cg.ok ? cg.groups.length * (panel.minPer || 30) : panel.count; };

  const TOOLS = { gcal: "구글 캘린더", notion: "노션", naver: "네이버 캘린더", paper: "종이 플래너", none: "따로 없음" };
  const TOOL_MIX = [["gcal", 0.34], ["notion", 0.22], ["naver", 0.16], ["paper", 0.12], ["none", 0.16]];
  const REGIONS = ["서울", "경기", "광주", "부산", "대구", "대전", "인천", "전남"];
  const DROP = {
    UNCLEAR_PURPOSE: "무슨 앱인지 모르겠다",
    TOO_MANY_STEPS: "단계·입력 항목이 너무 많다",
    PRIVACY: "개인정보를 과하게 요구한다",
    PRICE: "가격이 부담된다",
    TRUST: "믿기 어렵다",
    FEATURE_MISSING: "필요한 기능이 없다",
    SWITCHING_COST: "쓰던 것을 옮기기 번거롭다",
    NAVIGATION_LOST: "어디로 가야 할지 모르겠다",
  };

  const PRODUCT = {
    name: "일정메이트",
    description: "흩어진 수업·과제·동아리 일정을 한곳에 모아 오늘 할 일의 우선순위를 추천하는 앱",
    features: ["자동 정리", "우선순위 추천", "캘린더 연동", "친구 공유", "알림 설정"],
    price: "기본 무료, 월 유료 전환",
    plan: "일정메이트는 대학생의 수업, 과제, 동아리 일정을 한곳에서 정리합니다.\n자동 정리, 우선순위 추천, 캘린더 연동, 친구 공유, 알림 설정을 제공합니다.\n기본 기능은 무료이고, 고급 추천은 월 구독으로 제공합니다.",
  };
  const SCREENS = [
    { id: "S01", label: "온보딩", desc: "일정을 자동으로 정리하고 우선순위를 추천해 드려요", fields: [], buttons: [["시작하기", "S02"]] },
    { id: "S02", label: "회원가입", desc: "이메일·비밀번호·휴대폰 인증", fields: ["이메일", "비밀번호", "휴대폰 번호"], buttons: [["다음", "S03"], ["뒤로", "S01"]] },
    { id: "S03", label: "학교·학년", desc: "학교명, 학년, 전공을 알려주세요", fields: ["학교", "학년", "전공"], buttons: [["다음", "S04"], ["건너뛰기", "S04"]] },
    { id: "S04", label: "관심분야", desc: "관심분야를 5개 이상 골라주세요", fields: ["관심분야 5개"], buttons: [["완료", "S05"], ["건너뛰기", "S05"]] },
    { id: "S05", label: "홈", desc: "오늘의 일정과 추천 우선순위", fields: [], buttons: [] },
  ];
  const TASK = { text: "회원가입을 완료하세요", goal: "S05" };

  const defaultPanel = () => ({ count: 100, occupation: "student", age: "20-29", price: "all", privacy: "all", seed: 0, compare: "none", minPer: 30 });

  function pickWeighted(r, mix) {
    let x = r(), acc = 0;
    for (const [k, w] of mix) { acc += w; if (x <= acc) return k; }
    return mix[mix.length - 1][0];
  }
  function sampleBand(r, choice, mixKey) {
    const band = choice === "all" ? pickWeighted(r, Object.entries(PUBLIC_MIX[mixKey])) : choice;
    const [lo, hi] = BANDS[band];
    return round2(clamp(lo + r() * (hi - lo), 0.02, 0.98));
  }

  // '전체'일 때는 공개 분포 비율대로 정확히 나눠 뽑는다 (층화 샘플링)
  function quota(r, n, choice, mixKey) {
    if (choice !== "all") return Array(n).fill(choice);
    const mix = PUBLIC_MIX[mixKey], out = [];
    Object.entries(mix).forEach(([b, w]) => { for (let i = 0; i < Math.round(n * w); i++) out.push(b); });
    while (out.length < n) out.push("mid"); out.length = n;
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }
  function inBand(r, band) { const [lo, hi] = BANDS[band]; return round2(clamp(lo + 0.01 + r() * (hi - lo - 0.02), 0.02, 0.98)); }
  function makePersona(r, i, f) {
    const traits = [];
    if (f.app >= 0.75) traits.push("앱을 자주 바꿔 씀");
    if (f.digital >= 0.8) traits.push("새 서비스 먼저 써봄");
    if (f.price >= 0.7) traits.push("구독료에 민감");
    if (f.privacy >= 0.7) traits.push("개인정보 입력을 꺼림");
    if (r() < 0.35) traits.push("시간에 쫓김");
    if (f.tool !== "none" && f.tool !== "paper" && r() < 0.5) traits.push("기존 캘린더에 익숙");
    return { id: `P${String(i + 1).padStart(3, "0")}`, age: f.age, gender: f.gender, occupation: f.occupation, region: REGIONS[Math.floor(r() * REGIONS.length)], price: f.price, privacy: f.privacy, app: f.app, digital: f.digital, tool: f.tool, traits, grp: f.grp };
  }
  // 비교 기준이 있으면 그룹마다 최소 인원을 채우고, 그룹 안에서는 가격·개인정보·앱 이용을 공개 분포대로 층화해 뽑는다
  function generateGrouped(panel, cg) {
    const r = rng(hash(JSON.stringify(panel))), per = panel.minPer || 30, out = [];
    const [aLo, aHi] = String(panel.age).split("-").map(Number);
    cg.groups.forEach(g => {
      const qp = quota(r, per, cg.dim === "price" ? g.key : panel.price, "price"), qv = quota(r, per, panel.privacy, "privacy"), qa = quota(r, per, "all", "app");
      for (let k = 0; k < per; k++) {
        const lo = cg.dim === "age" ? g.lo : aLo, hi = cg.dim === "age" ? g.hi : aHi;
        const age = lo + Math.floor(r() * (hi - lo + 1));
        // 소속은 나이에 따라 대학생 비율이 달라진다 (데모 가정)
        const occupation = cg.dim === "occupation" ? g.key : panel.occupation !== "all" ? panel.occupation : (r() < (age <= 24 ? 0.6 : age <= 29 ? 0.25 : 0.03) ? "student" : "worker");
        const gender = cg.dim === "gender" ? (g.key === "f" ? "여성" : "남성") : (r() < 0.5 ? "여성" : "남성");
        out.push(makePersona(r, out.length, { age, occupation, gender, price: inBand(r, qp[k]), privacy: inBand(r, qv[k]), app: inBand(r, qa[k]), digital: round2(bell(r, age >= 40 ? 0.5 : 0.62, 0.55)), tool: pickWeighted(r, TOOL_MIX), grp: g.key }));
      }
    });
    // 그룹 순서대로 번호가 붙지 않게 섞은 뒤 번호를 다시 매긴다
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    out.forEach((p, i) => (p.id = `P${String(i + 1).padStart(3, "0")}`));
    // 그룹마다 같은 인원을 뽑았으므로, 전체 수치는 공개 분포 비중으로 되돌려 계산한다 (가중치 = 비중 × 전체 인원 ÷ 그룹 인원)
    const share = Object.fromEntries(cg.groups.map(g => [g.key, g.share]));
    out.forEach(p => (p.w = Math.round(share[p.grp] * out.length / per * 10000) / 10000));
    return out;
  }
  function generatePersonas(panel) {
    const cg = compareGroups(panel);
    if (cg.ok) return generateGrouped(panel, cg);
    const r = rng(hash(JSON.stringify({ count: panel.count, occupation: panel.occupation, age: panel.age, price: panel.price, privacy: panel.privacy, seed: panel.seed })));
    const qp = quota(r, panel.count, panel.price, "price"), qv = quota(r, panel.count, panel.privacy, "privacy");
    // 앱 이용 빈도도 가격·개인정보처럼 공개 분포(15·55·30%)에 맞춰 층화 샘플링한다 (선택 항목이 없어 늘 '전체')
    const qa = quota(r, panel.count, "all", "app");
    const [aLo, aHi] = panel.age.split("-").map(Number);
    return Array.from({ length: panel.count }, (_, i) => {
      const occupation = panel.occupation === "all" ? (r() < 0.6 ? "student" : "worker") : panel.occupation;
      const price = inBand(r, qp[i]);
      const privacy = inBand(r, qv[i]);
      const app = inBand(r, qa[i]);
      const digital = round2(bell(r, 0.62, 0.55));
      const tool = pickWeighted(r, TOOL_MIX);
      const age = aLo + Math.floor(r() * (aHi - aLo + 1));
      const traits = [];
      if (app >= 0.75) traits.push("앱을 자주 바꿔 씀");
      if (digital >= 0.8) traits.push("새 서비스 먼저 써봄");
      if (price >= 0.7) traits.push("구독료에 민감");
      if (privacy >= 0.7) traits.push("개인정보 입력을 꺼림");
      if (r() < 0.35) traits.push("시간에 쫓김");
      if (tool !== "none" && tool !== "paper" && r() < 0.5) traits.push("기존 캘린더에 익숙");
      return {
        id: `P${String(i + 1).padStart(3, "0")}`,
        age, gender: r() < 0.5 ? "여성" : "남성", occupation, region: REGIONS[Math.floor(r() * REGIONS.length)],
        price, privacy, app, digital, tool, traits,
      };
    });
  }

  function ask(p, r) {
    const score = Math.round(clamp(2.9 + p.app * 1.4 + p.digital * 0.9 - p.price * 0.9 - p.privacy * 0.3 + (r() - 0.5) * 0.9, 1, 5));
    const concern = p.privacy >= 0.7 ? "PRIVACY" : p.price >= 0.72 ? "PRICE" : p.tool === "gcal" || p.tool === "notion" ? "SWITCHING_COST" : "TOO_MANY_STEPS";
    const order = [...PRODUCT.features].sort((a, b) => hash(p.id + a) - hash(p.id + b));
    const needed = order.slice(0, 2 + Math.floor(r() * 2));
    const wtp = score >= 4 && p.price < 0.75 ? Math.round((6000 - p.price * 5500 + r() * 1500) / 500) * 500 : score >= 3 && p.price < 0.5 ? 1500 : 0;
    const quotes = {
      PRIVACY: "기능은 편해 보이는데 휴대폰 인증까지 필요하면 고민될 것 같아요.",
      PRICE: "무료면 써볼 텐데 유료 전환이 언제부터인지가 걸려요.",
      SWITCHING_COST: "지금 쓰는 캘린더에서 옮겨야 한다면 귀찮을 것 같아요.",
      TOO_MANY_STEPS: "자동 정리는 유용해 보여요. 가입만 짧으면 써볼게요.",
    };
    return { intent: score, concern, needed, wtp, quote: quotes[concern] };
  }

  // 화면별 이탈 확률을 페르소나 특성으로 정한다 (데모용 규칙)
  function act(p, r) {
    const byId = Object.fromEntries(SCREENS.map(s => [s.id, s]));
    let cur = "S01"; const steps = []; let end = null;
    for (let turn = 1; turn <= 8; turn++) {
      const s = byId[cur];
      if (cur === TASK.goal) { end = { result: "complete", screen: cur }; break; }
      let risk = 0.04, reason = "UNCLEAR_PURPOSE";
      if (cur === "S01") { risk = 0.05 + (1 - p.digital) * 0.12; reason = "UNCLEAR_PURPOSE"; }
      // 30대 이상은 휴대폰 인증 부담을 더 크게 느끼고, 직장인은 학교·학년을 묻는 화면에서 목적을 잃는다 (데모 규칙)
      if (cur === "S02") { risk = 0.04 + p.privacy * 0.32 + (p.age >= 40 ? 0.26 : p.age >= 30 ? 0.06 : 0); reason = "PRIVACY"; }
      if (cur === "S03") { risk = 0.06 + (p.traits.includes("시간에 쫓김") ? 0.2 : 0) + p.privacy * 0.12 + (p.occupation === "worker" ? 0.2 : 0); reason = p.occupation === "worker" ? "UNCLEAR_PURPOSE" : p.privacy > 0.65 ? "PRIVACY" : "TOO_MANY_STEPS"; }
      if (cur === "S04") { risk = 0.18 + (p.traits.includes("시간에 쫓김") ? 0.22 : 0) + (1 - p.app) * 0.2; reason = r() < 0.2 ? "NAVIGATION_LOST" : "TOO_MANY_STEPS"; }
      if (r() < risk) {
        const quotes = {
          UNCLEAR_PURPOSE: cur === "S03" ? "직장인인데 학교랑 학년을 왜 묻는지 모르겠어요." : "첫 화면만 봐서는 기존 캘린더랑 뭐가 다른지 모르겠어요.",
          PRIVACY: "일정 앱에 휴대폰 인증까지 해야 하나 싶어서 여기서 멈출게요.",
          TOO_MANY_STEPS: cur === "S04" ? "관심분야를 5개나 고르라니 지금은 그만할래요." : "입력할 게 계속 늘어나서 나중에 할게요.",
          NAVIGATION_LOST: "건너뛰어도 되는 건지 몰라서 더 못 가겠어요.",
        };
        steps.push({ turn, screen: cur, action: "abandon", reason, quote: quotes[reason] });
        end = { result: "drop", screen: cur, reason }; break;
      }
      const skip = s.buttons.find(b => b[0] === "건너뛰기");
      const btn = skip && (p.price > 0.6 || p.traits.includes("시간에 쫓김")) && r() < 0.6 ? skip : s.buttons.find(b => b[0] !== "뒤로" && b[0] !== "건너뛰기") || s.buttons[0];
      steps.push({ turn, screen: cur, action: "click", target: btn[0], to: btn[1] });
      cur = btn[1];
      if (cur === TASK.goal) { end = { result: "complete", screen: cur }; break; }
    }
    if (!end) end = { result: "drop", screen: cur, reason: "NAVIGATION_LOST" };
    return { steps, end, path: ["S01", ...steps.filter(s => s.to).map(s => s.to)] };
  }

  function simulate(personas, seed = 0) {
    const r = rng(hash("run" + seed + personas.length));
    return personas.map(p => ({ id: p.id, ask: ask(p, r), act: act(p, r) }));
  }

  // 실제 참가자 15명 — 데모용 예시 기록 (화면별 이탈만 사용)
  const REAL = (() => {
    const plan = [["S01", 1], ["S02", 2], ["S03", 1], ["S04", 3]];
    const reasons = { S01: ["UNCLEAR_PURPOSE"], S02: ["PRIVACY", "PRIVACY"], S03: ["TOO_MANY_STEPS"], S04: ["TOO_MANY_STEPS", "TOO_MANY_STEPS", "NAVIGATION_LOST"] };
    const out = []; let n = 1;
    plan.forEach(([screen, k]) => { for (let i = 0; i < k; i++) out.push({ id: `R${String(n++).padStart(2, "0")}`, end: { result: "drop", screen, reason: reasons[screen][i] } }); });
    while (out.length < 15) out.push({ id: `R${String(n++).padStart(2, "0")}`, end: { result: "complete", screen: "S05" } });
    return out;
  })();

  function report(personas, results) {
    const n = results.length;
    const W = Object.fromEntries(personas.map(p => [p.id, p.w || 1])), weighted = personas.some(p => p.w && p.w !== 1);
    const wSum = list => list.reduce((a, r) => a + (W[r.id] || 1), 0), wTot = wSum(results);
    const wPct = list => Math.round(wSum(list) / wTot * 100);
    const reach = (list, sid) => {
      const idx = SCREENS.findIndex(s => s.id === sid);
      return list.filter(x => x.end.result === "complete" || SCREENS.findIndex(s => s.id === x.end.screen) >= idx).length;
    };
    const aiEnds = results.map(r => r.act);
    const reachW = sid => { const idx = SCREENS.findIndex(s => s.id === sid); return wPct(results.filter(r => r.act.end.result === "complete" || SCREENS.findIndex(s => s.id === r.act.end.screen) >= idx)); };
    const funnel = SCREENS.map(s => ({
      id: s.id, label: s.label,
      ai: reach(aiEnds, s.id), aiPct: reachW(s.id),
      real: reach(REAL, s.id), realPct: Math.round(reach(REAL, s.id) / REAL.length * 100),
    }));
    const aiDone = aiEnds.filter(a => a.end.result === "complete").length;
    const realDone = REAL.filter(a => a.end.result === "complete").length;
    const said = results.filter(r => r.ask.intent >= 4);
    const groups = { yesDone: [], yesDrop: [], noDone: [], noDrop: [] };
    results.forEach(r => {
      const yes = r.ask.intent >= 4, done = r.act.end.result === "complete";
      groups[yes ? (done ? "yesDone" : "yesDrop") : (done ? "noDone" : "noDrop")].push(r.id);
    });
    const tally = list => {
      const c = {}; list.forEach(k => (c[k] = (c[k] || 0) + 1));
      return Object.entries(c).sort((a, b) => b[1] - a[1]);
    };
    const aiReasons = tally(aiEnds.filter(a => a.end.result === "drop").map(a => a.end.reason));
    const realReasons = tally(REAL.filter(a => a.end.result === "drop").map(a => a.end.reason));
    // 가장 많이 그만둔 화면은 보정된 비중으로 순위를 매긴다 (값은 표본 인원)
    const dropScreens = tally(aiEnds.filter(a => a.end.result === "drop").map(a => a.end.screen))
      .map(([k, c]) => [k, c, wSum(results.filter(r => r.act.end.result === "drop" && r.act.end.screen === k))]).sort((a, b) => b[2] - a[2]).map(([k, c]) => [k, c]);
    const realDropScreens = tally(REAL.filter(a => a.end.result === "drop").map(a => a.end.screen));
    const wtps = results.map(r => r.ask.wtp).sort((a, b) => a - b);
    const median = wtps.length ? wtps[Math.floor(wtps.length / 2)] : 0;
    const features = tally(results.flatMap(r => r.ask.needed));
    const aiRate = wPct(results.filter(r => r.act.end.result === "complete")), realRate = Math.round(realDone / REAL.length * 100);
    const top3 = l => l.slice(0, 3).map(x => x[0]);
    const overlap = top3(aiReasons).filter(k => top3(realReasons).includes(k)).length;
    return {
      n, realN: REAL.length, funnel, aiDone, realDone, aiRate, realRate, gap: aiRate - realRate,
      saidYes: said.length, saidYesRate: wPct(said), weighted,
      avgIntent: (results.reduce((s, r) => s + r.ask.intent * (W[r.id] || 1), 0) / wTot).toFixed(1),
      groups, aiReasons, realReasons, dropScreens, realDropScreens,
      topScreenMatch: dropScreens[0] && realDropScreens[0] && dropScreens[0][0] === realDropScreens[0][0],
      reasonOverlap: overlap, median, features, paying: wtps.filter(v => v > 0).length,
    };
  }

  // 그룹별 결과: 그룹 × 화면 이탈 표와, 전체보다 눈에 띄게 다른 그룹을 문장으로 고른다
  const josa = w => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? "은" : "는"; };
  const MIN_GROUP = 15;
  function segments(personas, results, dim) {
    const D = DIMS[dim], byId = Object.fromEntries(personas.map(p => [p.id, p])), W = id => byId[id].w || 1;
    const steps = SCREENS.filter(s => s.id !== TASK.goal);
    const wTot = results.reduce((a, r) => a + W(r.id), 0);
    const overall = { done: results.reduce((a, r) => a + (r.act.end.result === "complete" ? W(r.id) : 0), 0) / wTot, drop: {} };
    steps.forEach(s => (overall.drop[s.id] = results.reduce((a, r) => a + (r.act.end.result === "drop" && r.act.end.screen === s.id ? W(r.id) : 0), 0) / wTot));
    const keys = Object.keys(D.names), rows = keys.map(k => {
      const rs = results.filter(r => D.of(byId[r.id]) === k), n = rs.length, drops = {};
      steps.forEach(s => (drops[s.id] = rs.filter(r => r.act.end.result === "drop" && r.act.end.screen === s.id).length));
      const done = rs.filter(r => r.act.end.result === "complete").length;
      return { key: k, label: D.names[k], n, done, doneRate: n ? done / n : 0, drops, small: n < MIN_GROUP };
    }).filter(r => r.n > 0);
    rows.forEach(r => (r.hot = {}));
    const finds = [];
    rows.filter(r => !r.small).forEach(r => {
      steps.forEach(s => {
        const c = r.drops[s.id], rate = c / r.n, base = overall.drop[s.id];
        if (c >= 4 && rate - base >= 0.1 && rate >= base * 1.3) {
          r.hot[s.id] = true;
          const x = rate / Math.max(base, 0.01);
          finds.push({ score: rate - base, key: r.key, screen: s.id, text: `${r.label}${josa(r.label)} ${s.id} ${s.label}에서 ${base < 0.02 ? "다른 그룹보다 유독 많이" : `전체보다 ${x >= 2 ? x.toFixed(1) + "배" : Math.round((rate - base) * 100) + "%p"} 많이`} 그만뒀습니다`, note: `${c}/${r.n}명 · 전체 ${Math.round(base * 100)}%` });
        }
      });
      const d = r.doneRate - overall.done;
      if (Math.abs(d) >= 0.15) finds.push({ score: Math.abs(d) * 0.8, key: r.key, screen: "", text: `${r.label}${josa(r.label)} 끝까지 간 비율이 전체보다 ${Math.round(Math.abs(d) * 100)}%p ${d < 0 ? "낮습니다" : "높습니다"}`, note: `${r.done}/${r.n}명 · 전체 ${Math.round(overall.done * 100)}%` });
    });
    finds.sort((a, b) => b.score - a.score);
    return { dim, label: D.label, steps, rows, overall, findings: finds.slice(0, 3), minGroup: MIN_GROUP, groupOf: id => D.of(byId[id]) };
  }

  // 패널 분포 점검: 목표 대비 실제 표본
  function distribution(personas, key, choice, mixKey) {
    const counts = { low: 0, mid: 0, high: 0 };
    personas.forEach(p => counts[bandOf(p[key])]++);
    const n = personas.length || 1;
    const target = choice === "all" ? PUBLIC_MIX[mixKey] : { low: choice === "low" ? 1 : 0, mid: choice === "mid" ? 1 : 0, high: choice === "high" ? 1 : 0 };
    return ["low", "mid", "high"].map(b => ({ band: b, label: BAND_LABEL[b], count: counts[b], pct: Math.round(counts[b] / n * 100), target: Math.round(target[b] * 100) }));
  }
  const percentile = (personas, key, v) => Math.round(personas.filter(p => p[key] < v).length / Math.max(1, personas.length) * 100);

  // 화면 간 상태 공유 (sessionStorage — 실패해도 기본값으로 동작)
  const STORE = "personalab-flow-v1";
  function load() {
    try { const s = JSON.parse(sessionStorage.getItem(STORE)); if (s && s.panel) return s; } catch (e) { /* 기본값 사용 */ }
    return { panel: defaultPanel(), product: { ...PRODUCT }, user: null, ran: false };
  }
  function save(state) { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* 메모리 상태로 계속 */ } }

  global.PL = {
    hash, rng, clamp, OPTIONS, OPTION_LABELS, TOOLS, DROP, PRODUCT, SCREENS, TASK, BAND_LABEL, PUBLIC_MIX,
    defaultPanel, generatePersonas, simulate, report, distribution, percentile, bandOf, REAL, load, save,
    DIMS, compareGroups, panelSize, segments, MIN_GROUP,
  };
})(window);
