// 시안 C · 리포트 — 에디토리얼. 거대한 숫자 하나가 화면을 이끌고, 페르소나의 목소리는 세리프로.
(function () {
  const { V, S, esc, seg, steps, facts, who, profileLine, personas, results, report, mountPanel, mountRun, reportParts, mountReport } = APP;
  V.nav = active => `<header class="nav"><a class="brand" href="#/">PersonaLab</a><nav><a href="#/tests" class="${active === "tests" ? "on" : ""}">내 테스트</a><a href="#/new/product" class="${active === "setup" ? "on" : ""}">새 테스트</a><a href="#/login">로그인</a></nav></header>`;

  V.landing = {
    html: () => {
      const rep = report(), rs = results();
      const voice = rs.find(r => r.ask.intent >= 4 && r.act.end.result === "drop" && r.act.end.screen === rep.dropScreens[0][0]) || rs[0];
      const vp = APP.pById(voice.id);
      return `<main class="v-land">${V.nav("land")}
      <section class="hero"><p class="kicker">AI 사용자 ${rep.n}명에게 물었더니</p><div class="giant-row"><span class="giant">${rep.saidYesRate}</span><span class="g-unit">%가<br>쓰겠다고 했습니다</span></div>
        <p class="kicker">직접 써보게 했더니</p><div class="giant-row"><span class="giant blue">${rep.aiRate}</span><span class="g-unit">%만<br>가입을 끝냈습니다</span></div></section>
      <section class="claim"><h1>묻지 않고, 써보게 합니다.</h1><div class="claim-body"><p>PersonaLab은 AI 페르소나에게 피그마 프로토타입을 직접 조작하게 하고, 어느 화면에서 왜 멈추는지 기록합니다. 실제 사용자 ${rep.realN}명에게 같은 과제를 시켜, AI 예측이 얼마나 틀리는지도 결과 옆에 붙입니다.</p>
        <div class="hero-cta"><a class="btn-primary" href="#/login">시작하기</a><a class="btn-ghost" href="#/report">샘플 결과 보기</a></div></div></section>
      <section class="voice"><div class="v-quote">“${esc(voice.ask.quote)}”</div><div class="v-meta"><b>${voice.id}</b> ${who(vp)} · 기획서를 읽고 사용 의향 ${voice.ask.intent}/5</div>
        <div class="v-then">그리고 ${voice.act.end.screen} ${PL.SCREENS.find(s => s.id === voice.act.end.screen).label}에서 멈췄습니다.</div><div class="v-quote small">“${esc((voice.act.steps.at(-1) || {}).quote || "")}”</div><div class="v-meta">AI가 쓴 문장 · 예시</div></section>
      <section class="pages"><h2>한 번의 테스트, 다섯 장면</h2><ol>${["기획서를 붙여넣습니다", "피그마 링크와 과제를 정합니다", "AI 패널 100명을 뽑습니다", "같은 사람들이 답하고, 써봅니다", "어디서 왜 멈췄는지, 실제와 얼마나 다른지 봅니다"].map(t => `<li>${t}</li>`).join("")}</ol></section>
      <footer class="land-foot"><span>PersonaLab</span><span>공개 데이터 분포를 반영한 페르소나 샘플링 · 모델 학습 없음 · 수치는 예시</span></footer></main>`;
    },
  };

  V.panel = {
    html: () => `<main class="v-setup v-panel">${V.nav("setup")}${steps("new/panel")}<div class="panel3">
      <section class="p-left"><div class="giant"><span data-slot="count"></span></div><p class="giant-cap">명을 이렇게 뽑았습니다</p>${["count", "occupation", "age", "price", "privacy"].map(k => seg(k)).join("")}
        <button class="redo" data-act="redraw">다시 뽑기</button><p class="hint">공개 통계 분포에서 뽑을 뿐, 모델을 학습시키지 않습니다.</p></section>
      <section class="p-mid"><p class="sub">점 하나가 한 사람이고, 가격 민감도 순으로 쌓았습니다. 색은 지금 쓰는 일정 도구입니다. 점을 누르면 그 사람이 오른쪽에 나옵니다.</p><div data-slot="chart" class="chart-box"></div>
        <div class="tool-key">${Object.entries(PL.TOOLS).map(([k, l]) => `<span><i class="t-${k}"></i>${l}</span>`).join("")}</div><p class="check" data-slot="check"></p></section>
      <section class="p-right" data-slot="side" aria-live="polite"></section></div>
      <footer class="setup-foot"><button class="btn-ghost" data-go="new/prototype">이전: 프로토타입</button><span class="save-state">자동 저장됨</span><button class="btn-primary" data-go="run">이 100명으로 실행</button></footer></main>`,
    mount: root => mountPanel(root, {
      chart: (ps, sel) => CH.swarm(ps, sel, { w: 640, h: 380, r: ps.length > 60 ? 9 : 13 }),
      side: p => `<div class="q-label">AI에게 전달되는 프로필을 한 문장으로</div><div class="q">“${profileLine(p)}”</div><div class="q-who"><b>${p.id}</b> ${who(p)}</div>
        <div class="facts">${facts(p).map(f => `<div><span>${f.label}</span><b class="${f.key === "price" ? "blue" : ""}">상위 ${f.top}%</b></div>`).join("")}<div><span>지금 쓰는 도구</span><b>${PL.TOOLS[p.tool]}</b></div></div>`,
    }),
  };

  V.run = {
    html: () => `<main class="v-run">${V.nav("setup")}<div class="run-head"><p><b><span data-k="now">0</span>명이 지금 써보는 중</b> ${esc(S.product.name)} · ${esc(S.task)}</p><div class="ctl"><button data-act="pause" aria-pressed="false">일시정지</button><button data-act="speed">4배속</button><button class="btn-primary" data-act="report">결과 보기</button></div></div>
      <div class="run-stage"><div class="giant run-giant" aria-hidden="true"><span data-k="act">0</span></div><div class="giant-cap run-cap">명이 프로토타입을 열었습니다 · <span data-k="phase">준비 중</span></div>
        <div data-slot="orbit" class="orbit-box" aria-label="AI 페르소나 8명이 프로토타입을 조작하는 3D 궤도. 끌어서 돌릴 수 있습니다."></div>
        <div class="focus" data-slot="focus" aria-live="polite"></div>
        <div class="tally"><div><b data-k="done">0</b>명 끝까지 갔고</div><div><b class="blue" data-k="drop">0</b>명 중간에 그만뒀습니다</div><div class="ask">Ask <span data-k="ask">0</span>/<span data-k="total"></span> 응답 완료</div></div></div>
      <div class="ticker" data-slot="log" aria-live="off"></div></main>`,
    mount: root => mountRun(root, {
      orbit: { W: 138, H: 282, D: 12, R: 28, radius: 330, tilt: -8, roll: -4, speed: 7, minop: .3 },
      logMax: 6,
      focus: (p, r) => `<div class="q">“${esc(r.ask.quote)}”</div><div class="q-who"><b>${p.id}</b> ${who(p)} · 사용 의향 ${r.ask.intent}/5 · AI 응답</div>`,
      logRow: e => e.type === "click" ? `<b>${e.pid}</b> ${e.from} → ${esc(e.target)}` : e.type === "done" ? `<b>${e.pid}</b> 목표 도착` : `<b class="blue">${e.pid}</b> ${e.screen}에서 그만둠`,
    }),
  };

  V.report = {
    html: () => {
      const P = reportParts(), rep = P.rep;
      return `<main class="v-report">${V.nav("setup")}${steps("report")}
      <header class="rp-hero"><p class="kicker">${esc(S.product.name)} · ${esc(S.task)}</p><h1>${rep.saidYes}명이 쓰겠다고 했지만,<br>끝까지 간 사람은 <span class="blue">${rep.aiDone}명</span>입니다.</h1>
        <p class="lede">${P.gapLine} 같은 과제를 받은 실제 사람 ${rep.realN}명 중에서는 ${rep.realDone}명(${rep.realRate}%)이 끝냈습니다. AI가 쓴 문장은 실제 사람의 답이 아닙니다. 예시 데이터입니다.</p>
        <button class="btn-ghost" data-act="rerun">화면 고치고 다시 실행</button></header>
      <section class="rp-sec"><div class="sec-num">${rep.dropScreens[0][0]}</div><div><h2>가장 많이 멈춘 곳은 ${PL.SCREENS.find(s => s.id === rep.dropScreens[0][0]).label} 화면입니다</h2><p class="sub">${rep.dropScreens[0][1]}명이 여기서 그만뒀습니다. 굵은 막대 AI, 가는 막대 실제. 행을 누르면 아래 표에서 그 사람들만 남습니다.</p>${P.funnel}</div></section>
      <section class="rp-sec"><div class="sec-num small">이유</div><div><h2>${PL.DROP[rep.aiReasons[0][0]]}</h2><p class="sub">그만둔 이유 순위입니다. 막대를 누르면 해당하는 사람이 표시됩니다.</p>${P.reasons}</div></section>
      <section class="rp-sec two"><div><h2>AI ${rep.n}명, 한 칸씩</h2>${P.grid}</div><div class="rp-person" data-slot="person" aria-live="polite"></div></section>
      <section class="rp-sec three"><div><h2>얼마나 믿을까</h2>${P.calib}</div><div><h2>기획서 반응</h2>${P.ask}</div><div><h2>실제 사람에게도</h2>${P.invite}</div></section></main>`;
    },
    mount: root => mountReport(root),
  };
})();
