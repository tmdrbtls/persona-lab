// 시안 A · 정밀 — 스위스 타이포그래피. 선과 여백으로만 나누고, 큰 숫자가 위계를 만든다.
(function () {
  const { V, S, esc, seg, steps, facts, who, profileLine, personas, report, mountPanel, mountRun, reportParts, mountReport } = APP;
  const NAV = [["", "소개"], ["tests", "내 테스트"], ["new/product", "새 테스트"]];
  V.nav = active => `<header class="nav"><a class="brand" href="#/">personalab</a><nav>${NAV.map(([r, l]) => `<a href="#/${r}" class="${(active === "tests" && r === "tests") || (active === "setup" && r === "new/product") ? "on" : ""}">${l}</a>`).join("")}</nav><a class="nav-cta" href="#/login">로그인</a></header>`;

  V.landing = {
    html: () => {
      const rep = report();
      return `<main class="v-land">${V.nav("land")}
      <section class="hero"><h1>묻지 않고,<br>써보게 합니다.</h1>
        <p class="lede">AI 사용자 ${rep.n}명에게 프로토타입을 직접 써보게 하고, 어디서 멈추는지 기록합니다. 그리고 실제 사용자와 비교해 그 예측이 얼마나 틀리는지도 함께 보여드립니다.</p>
        <div class="hero-cta"><a class="btn-primary" href="#/login">시작하기</a><a class="btn-ghost" href="#/report">샘플 결과 보기</a></div></section>
      <section class="saydo" aria-label="말과 행동의 차이 예시">
        <div><span class="k">물어보면</span><b>${rep.saidYesRate}<small>%</small></b><span class="d">“쓰겠다”고 답함</span></div>
        <div><span class="k">써보게 하면</span><b>${rep.aiRate}<small>%</small></b><span class="d">끝까지 가입함</span></div>
        <div><span class="k">실제 사람은</span><b class="dim">${rep.realRate}<small>%</small></b><span class="d">같은 과제를 끝냄</span></div>
        <p class="foot">일정메이트 회원가입 온보딩 예시 · 모든 수치는 데모 데이터입니다</p></section>
      <section class="how"><h2>세 단계로 확인합니다</h2><ol>
        <li><b>기획서를 읽고 답합니다</b><p>AI 패널이 제품 설명을 읽고 사용 의향과 우려를 답합니다. 이것이 ‘말’입니다.</p></li>
        <li><b>프로토타입을 직접 써봅니다</b><p>같은 사람들이 피그마 프로토타입의 버튼을 눌러 과제를 수행합니다. 이것이 ‘행동’입니다.</p></li>
        <li><b>실제 사용자로 오차를 잽니다</b><p>실제 사람 12~15명에게 같은 과제를 시켜, AI 예측이 얼마나 맞는지 결과 옆에 붙입니다.</p></li></ol></section>
      <section class="preview"><h2>어느 화면을 먼저 고칠지 보입니다</h2><div class="pv-grid"><div>${CH.funnel(rep, { w: 620 })}<p class="c-note">굵은 막대는 AI, 가는 막대는 실제 사용자. 화면별로 남은 비율입니다.</p></div>
        <div class="pv-side"><span class="k">가장 많이 그만둔 화면</span><b>${rep.dropScreens[0][0]} ${PL.SCREENS.find(s => s.id === rep.dropScreens[0][0]).label}</b><span class="k">가장 많은 이유</span><b>${PL.DROP[rep.aiReasons[0][0]]}</b><a class="btn-ghost" href="#/report">샘플 결과 전체 보기</a></div></div></section>
      <footer class="land-foot"><span>personalab</span><span>공개 데이터의 분포를 반영해 페르소나를 샘플링합니다. 모델을 학습시키지 않습니다.</span></footer></main>`;
    },
  };

  V.panel = {
    html: s => `<main class="v-setup v-panel">${V.nav("setup")}${steps("new/panel")}<div class="panel3">
      <section class="p-left"><h1>누구에게<br>써보게 할까요</h1><p class="sub">한 명씩 만들지 않고 분포를 고릅니다.</p>${["count", "occupation", "age", "price", "privacy"].map(k => seg(k)).join("")}
        <button class="redo" data-act="redraw">패널 다시 뽑기</button><p class="hint">NVIDIA 한국인 페르소나에 한국미디어패널의 소비 습관을 짝지어 뽑습니다. 학습이 아니라 샘플링입니다.</p></section>
      <section class="p-mid"><h2><span data-slot="count"></span>명이 이렇게 퍼져 있습니다</h2><p class="sub">점 하나가 한 사람입니다. 점을 누르면 오른쪽에 그 사람이 나옵니다. 축 바깥 막대는 목표 분포(회색)와 실제로 뽑힌 분포(검정)입니다.</p>
        <div data-slot="chart" class="chart-box"></div><p class="check" data-slot="check"></p></section>
      <section class="p-right" data-slot="side" aria-live="polite"></section></div>
      <footer class="setup-foot"><button class="btn-ghost" data-go="new/prototype">이전: 프로토타입</button><span class="save-state">자동 저장됨</span><button class="btn-primary" data-go="run">이 패널로 실행하기</button></footer></main>`,
    mount: root => mountPanel(root, {
      chart: (ps, sel, panel) => CH.scatter(ps, sel, panel),
      side: p => `<div class="pid-big">${p.id}</div><div class="who">${who(p)}</div><div class="tool">지금 쓰는 도구 · ${PL.TOOLS[p.tool]}</div>
        ${facts(p).map(f => `<div class="fact"><span>${f.label}</span><i><em style="width:${f.v * 100}%"></em></i><b>${f.v.toFixed(2)}</b></div>`).join("")}
        <p class="pos">가격 민감도는 이 패널에서 <b>상위 ${facts(p)[0].top}%</b>, 앱 이용 빈도는 상위 ${facts(p)[1].top}%입니다.</p>
        <div class="profile"><span>이 사람이 AI에게 전달되는 방식</span><p>${profileLine(p)}</p></div>
        <div class="traits">${p.traits.map(t => `<span>${t}</span>`).join("")}</div>`,
    }),
  };

  V.run = {
    html: s => `<main class="v-run">${V.nav("setup")}<div class="run-grid">
      <section class="r-left"><div class="phase" data-k="phase">준비 중</div>
        <div class="big"><span class="k">프로토타입을 써본 사람</span><b><span data-k="act">0</span><small>/<span data-k="total"></span></small></b></div>
        <div class="big"><span class="k">끝까지 간 사람</span><b data-k="done">0</b></div><div class="big"><span class="k">중간에 그만둔 사람</span><b class="red" data-k="drop">0</b></div>
        <div class="bars"><div><span>Ask · 기획서 응답 <b data-k="ask">0</b></span><i><em data-k="askbar"></em></i></div><div><span>Act · 프로토타입 조작</span><i><em data-k="actbar"></em></i></div></div>
        <div class="task">${esc(S.task)}<small>${esc(S.product.name)} · 목표 ${S.goal}</small></div>
        <div class="ctl"><button data-act="pause" aria-pressed="false">일시정지</button><button data-act="speed">4배속</button></div>
        <button class="btn-primary to-report" data-act="report">결과 보기</button></section>
      <section class="r-stage"><div data-slot="orbit" class="orbit-box" aria-label="AI 페르소나 8명이 프로토타입을 조작하는 3D 궤도. 끌어서 돌릴 수 있습니다."></div>
        <div class="focus" data-slot="focus" aria-live="polite"></div></section>
      <section class="r-log"><h2>실시간 기록</h2><div data-slot="log" class="log"></div></section></div></main>`,
    mount: root => mountRun(root, {
      orbit: { W: 132, H: 268, D: 11, R: 25, radius: 290, tilt: -18, speed: 6 },
      focus: (p, r) => `<b>${p.id}</b> ${who(p)} · Ask 사용 의향 ${r.ask.intent}/5`,
    }),
  };

  V.report = {
    html: () => {
      const P = reportParts(), rep = P.rep;
      return `<main class="v-report">${V.nav("setup")}${steps("report")}
      <header class="rp-head"><div><h1>${esc(S.product.name)} · ${esc(S.task)}</h1><p class="sub">AI 패널 ${rep.n}명, 실제 참가자 ${rep.realN}명 · AI가 쓴 문장은 실제 사람의 답이 아닙니다 · 예시 데이터</p></div>
        <div class="rp-actions"><button class="btn-ghost" data-act="rerun">화면 고치고 다시 실행</button></div></header>
      <section class="rp-top"><div class="kpi"><span class="k">쓰겠다고 답함</span><b>${rep.saidYesRate}%</b></div><div class="kpi"><span class="k">AI가 끝까지 감</span><b>${rep.aiRate}%</b></div><div class="kpi"><span class="k">실제 사람이 끝까지 감</span><b class="dim">${rep.realRate}%</b></div>
        <p class="gap">${P.gapLine}</p></section>
      <section class="rp-row"><div class="rp-funnel"><h2>화면별로 남은 사람</h2><p class="sub">행을 누르면 그 화면에서 그만둔 사람이 아래 표에 표시됩니다.</p>${P.funnel}</div>
        <div class="rp-reasons"><h2>그만둔 이유</h2><p class="sub">굵은 막대 AI, 가는 막대 실제</p>${P.reasons}</div></section>
      <section class="rp-row"><div class="rp-grid"><h2>AI ${rep.n}명 한 칸씩</h2><p class="sub">칸을 누르면 그 사람의 말과 행동을 나란히 봅니다.</p>${P.grid}</div><div class="rp-person" data-slot="person" aria-live="polite"></div></section>
      <section class="rp-row three"><div><h2>이 결과를 얼마나 믿을까</h2>${P.calib}</div><div><h2>기획서 반응</h2>${P.ask}</div><div><h2>실제 참가자 초대</h2>${P.invite}</div></section></main>`;
    },
    mount: root => mountReport(root),
  };
})();
