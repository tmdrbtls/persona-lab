// 시안 B · 스튜디오 — 턴테이블 위 실제 기기처럼. 위에서 비추는 조명, 둥근 재질 패널, 초록 강조 하나.
(function () {
  const { V, S, esc, seg, steps, facts, who, profileLine, personas, results, report, mountPanel, mountRun, reportParts, mountReport } = APP;
  V.nav = active => `<header class="nav"><a class="brand" href="#/"><i></i>PersonaLab</a><nav class="pill"><a href="#/" class="${active === "land" ? "on" : ""}">소개</a><a href="#/tests" class="${active === "tests" ? "on" : ""}">내 테스트</a><a href="#/new/product" class="${active === "setup" ? "on" : ""}">새 테스트</a></nav><a class="nav-cta" href="#/login">로그인</a></header>`;

  // 랜딩 히어로의 궤도: 실제 결과를 반복 재생
  function demoOrbit(el) {
    const rs = results(), o = new Orbit(el, { W: 128, H: 262, D: 13, R: 27, radius: 300, tilt: -13, speed: 9, minop: .35 });
    let k = 0; const fill = () => { for (let i = 0; i < o.n; i++) { const r = rs[(k + i) % rs.length], st = r.act.steps; const step = (k + i) % 3; const s = st[Math.min(step, st.length - 1)];
      o.set(i, s && s.action === "abandon" ? { pid: r.id, screen: s.screen, status: "drop", reason: s.reason } : s ? { pid: r.id, screen: s.screen, status: "run", target: s.target } : { pid: r.id, screen: "S05", status: "done" }); } k++; };
    fill(); const t = setInterval(fill, 2400);
    return () => { clearInterval(t); o.destroy(); };
  }

  V.landing = {
    html: () => {
      const rep = report();
      return `<main class="v-land">${V.nav("land")}
      <section class="hero"><h1>묻지 않고, 써보게 합니다</h1><p class="lede">AI 사용자 ${rep.n}명이 피그마 프로토타입을 직접 눌러봅니다. 어디서 멈추는지, 왜 멈추는지, 그 예측이 실제와 얼마나 다른지까지.</p>
        <div class="hero-cta"><a class="btn-primary" href="#/login">시작하기</a><a class="btn-ghost" href="#/report">샘플 결과 보기</a></div>
        <div class="hero-stage" data-slot="hero-orbit" aria-label="AI 페르소나들이 프로토타입을 조작하는 3D 궤도 예시"></div></section>
      <section class="cmp"><div class="cmp-card"><span class="k">기획서를 읽고</span><b>${rep.saidYesRate}%</b><p>가 “쓰겠다”고 답했습니다</p></div><div class="cmp-arrow" aria-hidden="true"></div>
        <div class="cmp-card strong"><span class="k">직접 써보니</span><b>${rep.aiRate}%</b><p>만 회원가입을 끝냈습니다</p></div><div class="cmp-card muted"><span class="k">실제 사람 ${rep.realN}명은</span><b>${rep.realRate}%</b><p>가 끝냈습니다 · 오차 ${Math.abs(rep.gap)}%p</p></div>
        <p class="cmp-note">일정메이트 회원가입 예시 · 데모 데이터</p></section>
      <section class="how"><h2>테스트 하나가 지나가는 길</h2><div class="how-row">
        ${[["제품 기획", "기획서를 붙여넣으면 AI가 읽을 제품 정보로 정리합니다."], ["프로토타입", "피그마 링크로 화면과 버튼 연결을 읽고 과제를 정합니다."], ["AI 패널", "분포를 골라 100명을 뽑고, 누가 뽑혔는지 확인합니다."], ["실행", "같은 100명이 먼저 답하고, 이어서 직접 써봅니다."], ["결과", "어디서 몇 명이 왜 멈췄는지와 실제 대비 오차를 봅니다."]].map(([t, d], i) => `<div class="how-card"><span>${i + 1}</span><b>${t}</b><p>${d}</p></div>`).join("")}</div></section>
      <footer class="land-foot">공개 데이터의 분포를 반영한 페르소나 샘플링 · 모델 학습 없음 · 이 페이지의 수치는 예시입니다</footer></main>`;
    },
    mount: root => demoOrbit(root.querySelector("[data-slot=hero-orbit]")),
  };

  V.panel = {
    html: () => `<main class="v-setup v-panel">${V.nav("setup")}<div class="head-row"><h1>AI 패널 만들기</h1>${steps("new/panel")}</div><div class="panel3">
      <section class="card p-left"><h2>모집 조건</h2><p class="sub">분포를 고르면 그 비율대로 뽑습니다.</p>${["count", "occupation", "age", "price", "privacy"].map(k => seg(k, "knob")).join("")}
        <button class="btn-ghost wide" data-act="redraw">패널 다시 뽑기</button><p class="hint">공개 통계 분포에서 표본을 뽑습니다. 모델을 학습시키지 않습니다.</p></section>
      <section class="card p-mid"><h2><span data-slot="count"></span>명의 성향을 한 줄씩</h2><p class="sub">선 하나가 한 사람입니다. 다섯 축을 지나는 모양이 그 사람의 성향이고, 선을 누르면 오른쪽에 나옵니다.</p>
        <div data-slot="chart" class="chart-box"></div><p class="check" data-slot="check"></p></section>
      <section class="card p-right" data-slot="side" aria-live="polite"></section></div>
      <div class="dock"><button class="btn-ghost" data-go="new/prototype">이전</button><span><b data-slot="count"></b>명 준비됨</span><button class="btn-primary" data-go="run">이 패널로 실행</button></div></main>`,
    mount: root => mountPanel(root, {
      chart: (ps, sel) => CH.parallel(ps, sel),
      side: p => `<div class="avatar">${p.id}</div><div class="who">${p.age}세 ${p.occupation === "student" ? "대학생" : "직장인"}</div><div class="whosub">${p.gender} · ${p.region} · ${PL.TOOLS[p.tool]} 사용</div>
        ${facts(p).map(f => `<div class="stat"><span>${f.label}</span><b>${f.v.toFixed(2)} <small>상위 ${f.top}%</small></b></div>`).join("")}
        <div class="say"><small>AI에게 전달되는 프로필 요약</small>${profileLine(p)}</div><div class="traits">${p.traits.map(t => `<span>${t}</span>`).join("")}</div>`,
    }),
  };

  V.run = {
    html: () => `<main class="v-run">${V.nav("setup")}<div class="run-top"><div><h1>${esc(S.product.name)} · ${esc(S.task)}</h1><p class="sub" data-k="phase">준비 중</p></div>
        <div class="legend"><span><i class="lg-run"></i>조작 중</span><span><i class="lg-done"></i>목표 도착</span><span><i class="lg-drop"></i>그만둠</span></div></div>
      <div class="run-body"><div data-slot="orbit" class="orbit-box" aria-label="AI 페르소나 8명이 프로토타입을 조작하는 턴테이블. 끌어서 돌릴 수 있습니다."></div>
        <aside class="note card" data-slot="focus" aria-live="polite"></aside>
        <aside class="logcard card"><h2>방금 일어난 일</h2><div data-slot="log" class="log"></div></aside></div>
      <div class="dock run-dock"><div class="n"><b data-k="act">0</b><span>써본 사람</span></div><div class="n"><b class="g" data-k="done">0</b><span>끝까지 감</span></div><div class="n"><b class="r" data-k="drop">0</b><span>그만둠</span></div>
        <div class="prog"><span>Ask <b data-k="ask">0</b>/<b data-k="total"></b></span><i><em data-k="askbar"></em></i><span>Act</span><i><em data-k="actbar"></em></i></div>
        <button class="btn-ghost" data-act="pause" aria-pressed="false">일시정지</button><button class="btn-ghost" data-act="speed">4배속</button><button class="btn-primary" data-act="report">결과 보기</button></div></main>`,
    mount: root => mountRun(root, {
      orbit: { W: 134, H: 274, D: 13, R: 27, radius: 310, tilt: -14, speed: 6, minop: .4 },
      logMax: 8,
      focus: (p, r) => `<div class="avatar sm">${p.id}</div><b>${p.age}세 ${p.occupation === "student" ? "대학생" : "직장인"}</b> · ${p.region}<p class="mini-k">Ask에서 사용 의향 ${r.ask.intent}/5</p><q>${esc(r.ask.quote)}</q><p class="mini-k">AI 응답 · 궤도 아래 이름표를 누르면 바뀝니다</p>`,
    }),
  };

  V.report = {
    html: () => {
      const P = reportParts(), rep = P.rep;
      return `<main class="v-report">${V.nav("setup")}<div class="head-row"><h1>${esc(S.product.name)} 결과</h1>${steps("report")}</div>
      <section class="summary card"><div class="s-main"><p class="s-line">‘쓰겠다’ <b>${rep.saidYesRate}%</b> → 끝까지 <b class="g">${rep.aiRate}%</b> <span class="vs">실제 사람 ${rep.realRate}%</span></p><p class="sub">${P.gapLine} AI가 쓴 문장은 실제 사람의 답이 아닙니다. 예시 데이터입니다.</p></div>
        <div class="s-actions"><button class="btn-ghost" data-act="rerun">화면 고치고 다시 실행</button></div></section>
      <div class="rgrid">
        <section class="card c-funnel"><h2>화면별로 남은 사람</h2><p class="sub">진한 막대 AI, 옅은 막대 실제. 행을 누르면 그 화면에서 멈춘 사람만 표시합니다.</p>${P.funnel}</section>
        <section class="card c-reasons"><h2>그만둔 이유</h2>${P.reasons}</section>
        <section class="card c-grid"><h2>AI ${rep.n}명</h2><p class="sub">한 칸이 한 사람입니다. 눌러서 말과 행동을 비교하세요.</p>${P.grid}</section>
        <section class="card c-person" data-slot="person" aria-live="polite"></section>
        <section class="card"><h2>이 결과를 얼마나 믿을까</h2>${P.calib}</section>
        <section class="card"><h2>기획서 반응</h2>${P.ask}</section>
        <section class="card"><h2>실제 참가자 초대</h2>${P.invite}</section></div></main>`;
    },
    mount: root => mountReport(root),
  };
})();
