// 시안 A · 정밀 — 스위스 타이포그래피. 선과 여백으로만 나누고, 큰 숫자가 위계를 만든다.
(function () {
  const { V, S, esc, seg, steps, facts, who, profileLine, personas, report, mountPanel, mountRun, reportParts, mountReport, save, compareOff, groupChips, panelSummary } = APP;
  // 시안 A는 그룹 비교를 기본으로 보여준다: 범위는 넓게(소속 전체, 20~40대), 연령끼리 비교, 그룹당 30명.
  // 데모 기본 표본(seed 2)은 그룹 차이가 드러나는 예시로 골랐다. '패널 다시 뽑기'를 누르면 바뀐다.
  if (!S.panelV2) { Object.assign(S.panel, { occupation: "all", age: "20-49", price: "all", privacy: "all", compare: "age", minPer: 30, seed: 2 }); S.panelV2 = 1; S.ran = false; save(); }
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
      <section class="preview"><h2>어느 화면을 먼저 고칠지 보입니다</h2><div class="pv-grid"><div>${CH.funnel(rep, { w: CH.narrow() ? 380 : 620 })}<p class="c-note">굵은 막대는 AI, 가는 막대는 실제 사용자. 화면별로 남은 비율입니다.</p></div>
        <div class="pv-side"><span class="k">가장 많이 그만둔 화면</span><b>${rep.dropScreens[0][0]} ${PL.SCREENS.find(s => s.id === rep.dropScreens[0][0]).label}</b><span class="k">가장 많은 이유</span><b>${PL.DROP[rep.aiReasons[0][0]]}</b><a class="btn-ghost" href="#/report">샘플 결과 전체 보기</a></div></div></section>
      <footer class="land-foot"><span>personalab</span><span>공개 데이터의 분포를 반영해 페르소나를 샘플링합니다. 모델을 학습시키지 않습니다.</span></footer></main>`;
    },
  };

  V.panel = {
    html: s => `<main class="v-setup v-panel">${V.nav("setup")}${steps("new/panel")}<div class="panel3">
      <section class="p-left"><h1>누구에게<br>써보게 할까요</h1><p class="sub">한 명씩 만들지 않고 분포를 고릅니다.</p>
        <div class="p-q"><b>① 누구를 넣을까</b><span>우리 앱과 상관없는 사람만 빼세요.</span></div>${["occupation", "age", "price", "privacy"].map(k => seg(k)).join("")}
        <div class="p-q"><b>② 무엇끼리 비교할까</b><span>고른 기준의 그룹마다 최소 인원을 채워 뽑습니다. 결과에서 그룹별로 어디서 그만뒀는지 봅니다.</span></div>${seg("compare", "seg", compareOff())}
        ${PL.compareGroups(s.panel).ok ? seg("minPer") : seg("count")}
        <p class="why" data-slot="why" aria-live="polite">${s.panel.compare !== "none" && !PL.compareGroups(s.panel).ok ? esc(PL.compareGroups(s.panel).why) + " 지금은 비교 없이 뽑습니다." : ""}</p>
        <button class="redo" data-act="redraw">패널 다시 뽑기</button><p class="hint">NVIDIA 한국인 페르소나에 한국미디어패널의 소비 습관을 짝지어 뽑습니다. 학습이 아니라 샘플링입니다.</p></section>
      <section class="p-mid"><h2><span data-slot="count"></span>명이 이렇게 퍼져 있습니다</h2>
        <div class="p-chips" data-slot="check" aria-live="polite"></div>
        <p class="sub">점 하나가 한 사람${PL.compareGroups(s.panel).ok ? "이고 색은 그룹입니다" : "입니다"}. 점을 누르거나 그래프를 선택하고 방향키를 누르면 오른쪽에 그 사람이 나옵니다. 축 바깥 막대는 목표 분포(연한 막대)와 실제로 뽑힌 분포(진한 막대)입니다.</p>
        <div data-slot="chart" class="chart-box"></div></section>
      <section class="p-right" data-slot="side" aria-live="polite"></section></div>
      <footer class="setup-foot"><button class="btn-ghost" data-go="new/prototype">이전: 프로토타입</button><span class="save-state summary" data-slot="summary"></span><button class="btn-primary" data-go="run">이 패널로 실행하기</button></footer></main>`,
    mount: root => mountPanel(root, {
      rerender: ["compare", "occupation", "age", "price"],
      check: ps => groupChips(ps),
      chart: (ps, sel, panel) => { const cg = PL.compareGroups(panel), gi = cg.ok ? Object.fromEntries(cg.groups.map((g, i) => [g.key, i])) : null; return CH.scatter(ps, sel, panel, Object.assign(CH.narrow() ? { w: 380, h: 420 } : {}, { groupIdx: gi })); },
      side: p => `<div class="pid-big">${p.id}</div>${p.grp ? `<div class="grp-tag">${(PL.compareGroups(S.panel).groups.find(g => g.key === p.grp) || {}).label || ""} 그룹</div>` : ""}<div class="who">${who(p)}</div><div class="tool">지금 쓰는 도구 · ${PL.TOOLS[p.tool]}</div>
        ${facts(p).map(f => `<div class="fact"><span>${f.label}</span><i><em style="width:${f.v * 100}%"></em></i><b>${f.v.toFixed(2)}</b></div>`).join("")}
        <p class="pos">가격 민감도는 이 패널에서 <b>${facts(p)[0].rank}</b>, 앱 이용 빈도는 ${facts(p)[1].rank}입니다.</p>
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

  // 결과: 위는 3초 안에 읽히는 요약(계획서 5-1), 아래는 하나만 펼쳐지는 탭 네 개
  const TABS = [["group", "그룹별"], ["person", "사람별"], ["ask", "기획서 반응"], ["trust", "신뢰도"]];
  const TAB_KEY = "pl-a-report-tab";
  const savedTab = () => { try { const t = sessionStorage.getItem(TAB_KEY); return TABS.some(x => x[0] === t) ? t : "group"; } catch (e) { return "group"; } };
  const scr = id => (PL.SCREENS.find(s => s.id === id) || {}).label || "";
  const motion = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  V.report = {
    html: () => {
      const P = reportParts(), rep = P.rep, top = rep.dropScreens[0], cur = savedTab();
      const s1 = rep.aiDone < rep.saidYes ? `${rep.saidYes}명이 쓰겠다고 했지만 ${rep.aiDone}명만 끝까지 갔습니다.` : `${rep.saidYes}명이 쓰겠다고 했고 ${rep.aiDone}명이 끝까지 갔습니다.`;
      const s2 = top ? `가장 많이 그만둔 곳은 <em class="drop-name">${top[0]} ${scr(top[0])}</em>입니다.` : "중간에 그만둔 사람이 없습니다.";
      const tab = ([k, l]) => `<button type="button" role="tab" id="tab-${k}" aria-controls="pn-${k}" aria-selected="${k === cur}" tabindex="${k === cur ? 0 : -1}">${l}</button>`;
      const panel = (k, body) => `<div role="tabpanel" id="pn-${k}" class="pn" aria-labelledby="tab-${k}" tabindex="0"${k === cur ? "" : " hidden"}>${body}</div>`;
      return `<main class="v-report">${V.nav("setup")}${steps("report")}
      <section class="rp-sum" aria-labelledby="rp-h">
        <header class="rp-head"><h1 id="rp-h">${s1}<br>${s2}</h1><p class="sub">${esc(S.product.name)} · ${esc(S.task)} · AI 패널 ${rep.n}명 · 실제 참가자 ${rep.realN}명 · AI가 쓴 문장은 실제 사람의 답이 아닙니다 · 예시 데이터</p></header>
        <div class="rp-top"><div class="kpi"><span class="k">쓰겠다고 답함</span><b>${rep.saidYesRate}<small>%</small></b></div><div class="kpi"><span class="k">AI가 끝까지 감</span><b>${rep.aiRate}<small>%</small></b></div><div class="kpi"><span class="k">실제 사람이 끝까지 감</span><b class="dim">${rep.realDone}<small>/${rep.realN}명</small></b></div>
          <div class="trust" aria-label="이 결과를 얼마나 믿을까"><span class="t-k">실제 ${rep.realN}명과 비교</span>${P.trust.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}<button type="button" class="t-more" data-tabgo="trust">자세히</button></div></div>
        <div class="sum-row"><div class="rp-funnel"><h2>화면별로 남은 사람 <small>굵은 막대 AI · 가는 막대 실제 · 행을 누르면 그 사람들을 봅니다</small></h2>${CH.funnel(rep, CH.narrow() ? { w: 380, rowH: 42 } : { w: 640, rowH: 36 })}</div>
          <div class="rp-reasons"><h2>그만둔 이유 상위 3개</h2>${P.reasons3}</div></div>
        <div class="sum-finds"><h2>그룹별로 눈에 띄는 점 <small data-slot="finds-dim"></small></h2><div data-slot="finds"></div></div>
        <div class="rp-next"><button type="button" class="btn-primary" data-act="rerun">화면 고치고 다시 실행</button><button type="button" class="btn-ghost" data-tabgo="trust" data-target="invite">실제 참가자 초대</button></div>
      </section>
      <section class="rp-tabs" aria-label="결과 자세히 보기"><div class="tabs" role="tablist" aria-label="결과 자세히 보기">${TABS.map(tab).join("")}</div>
        ${panel("group", `<div class="rp-segs" data-slot="segs"><div class="seg-head"><p class="sub">어떤 사람들이 어느 화면에서 그만뒀는지 봅니다. 칸을 누르면 ‘사람별’에서 그 사람들만 남깁니다.</p><div data-part="pick"></div></div><div data-part="table"></div><p class="c-note" data-part="note"></p></div>`)}
        ${panel("person", `<div class="pf-bar" data-slot="pfilter" aria-live="polite"></div><div class="rp-row"><div class="rp-grid"><p class="sub">AI ${rep.n}명을 한 칸씩 놓았습니다. 칸을 누르면 그 사람의 말과 행동을 나란히 봅니다.</p>${P.grid}</div><div class="rp-person" data-slot="person" aria-live="polite"></div></div>`)}
        ${panel("ask", `<div class="rp-row"><div>${P.ask}</div><p class="sub">AI 패널이 기획서를 읽고 답한 ‘말’입니다. 프로토타입에서의 ‘행동’과는 다를 수 있습니다.</p></div>`)}
        ${panel("trust", `<div class="rp-row"><div><h2>AI와 실제 비교</h2>${P.calib}</div><div id="invite"><h2>실제 참가자 초대</h2>${P.invite}</div></div>`)}
      </section></main>`;
    },
    mount: root => {
      const tabs = [...root.querySelectorAll("[role=tab]")], tabBox = root.querySelector(".rp-tabs");
      const open = (k, focusTab) => {
        tabs.forEach(t => { const on = t.id === "tab-" + k; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; if (on && focusTab) t.focus(); });
        root.querySelectorAll("[role=tabpanel]").forEach(p => (p.hidden = p.id !== "pn-" + k));
        try { sessionStorage.setItem(TAB_KEY, k); } catch (e) {}
      };
      tabs.forEach((t, i) => {
        t.addEventListener("click", () => open(t.id.slice(4)));
        t.addEventListener("keydown", e => {
          const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
          if (j === undefined) return;
          e.preventDefault(); open(tabs[(j + tabs.length) % tabs.length].id.slice(4), true);
        });
      });
      // '자세히'와 '실제 참가자 초대'는 신뢰도 탭을 열고 그 자리로 간다
      root.querySelectorAll("[data-tabgo]").forEach(b => b.addEventListener("click", () => {
        open(b.dataset.tabgo);
        const t = (b.dataset.target && root.querySelector("#" + b.dataset.target)) || tabBox;
        t.scrollIntoView({ behavior: motion(), block: "start" });
        const f = b.dataset.target ? t.querySelector("button") : root.querySelector("#tab-" + b.dataset.tabgo);
        if (f) f.focus({ preventScroll: true });
      }));
      const unfilter = () => {
        root.querySelectorAll(".cell").forEach(c => c.classList.remove("dim"));
        root.querySelectorAll(".reason, .frow, [data-slot=segs] [data-grp]").forEach(b => b.classList.remove("on"));
        root.querySelectorAll(".frow").forEach(x => x.setAttribute("aria-pressed", "false"));
        root.querySelector("[data-slot=pfilter]").innerHTML = "";
      };
      // 퍼널·이유·그룹 칸을 누르면 '사람별' 탭을 열고, 무엇으로 좁혔는지 위에 적는다
      const reveal = f => {
        const bar = root.querySelector("[data-slot=pfilter]");
        if (!f.on) { bar.innerHTML = ""; return; }
        const what = f.kind === "screen" ? `${f.value} ${scr(f.value)}에서 그만둔 사람`
          : f.kind === "reason" ? `‘${PL.DROP[f.value]}’ 때문에 그만둔 사람`
          : `${PL.DIMS[f.dim].names[f.value]} 중 ${f.screen === "done" ? "끝까지 간 사람" : `${f.screen} ${scr(f.screen)}에서 그만둔 사람`}`;
        bar.innerHTML = `<span>지금 보는 사람 · <b>${esc(what)}</b> ${f.count}명</span><button type="button" data-act="unfilter">전체 보기</button>`;
        bar.querySelector("[data-act=unfilter]").addEventListener("click", unfilter);
        open("person");
        const first = root.querySelector(".cell:not(.dim)"); if (first && !first.classList.contains("picked")) first.click();
        tabBox.scrollIntoView({ behavior: motion(), block: "start" });
      };
      // 요약의 그룹 문장: 누르면 '그룹별' 탭의 그 칸으로 가서 강조한다 (100칸은 칸을 눌러야 좁혀진다)
      const onSeg = (dim, b) => {
        root.querySelector("[data-slot=finds-dim]").textContent = `${PL.DIMS[dim].label} 기준 · AI 패널 결과`;
        const box = root.querySelector("[data-slot=finds]");
        box.innerHTML = b.finds;
        box.querySelectorAll("[data-grp]").forEach(x => x.addEventListener("click", () => {
          open("group");
          const segs = root.querySelector("[data-slot=segs]");
          const cell = segs.querySelector(`button[data-grp="${x.dataset.grp}"][data-screen="${x.dataset.screen || "done"}"]`);
          segs.querySelectorAll(".spot").forEach(c => c.classList.remove("spot"));
          if (!cell) return;
          cell.classList.add("spot");
          cell.scrollIntoView({ behavior: motion(), block: "center" });
          cell.focus({ preventScroll: true });
        }));
      };
      mountReport(root, { reveal, onSeg });
    },
  };
})();
