// 공통 라우터·상태·화면. 시안별 views.js가 V에 화면을 덮어써서 디자인을 바꾼다.
(function (g) {
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const S = PL.load();
  S.screens = S.screens || PL.SCREENS.map(s => ({ ...s }));
  S.task = S.task || PL.TASK.text; S.goal = S.goal || PL.TASK.goal;
  S.figma = S.figma ?? ""; S.organized = S.organized ?? true; S.invited = S.invited || 0;
  const save = () => PL.save(S);
  let cache = {};
  const personas = () => (cache.pk === JSON.stringify(S.panel) ? cache.p : (cache = { pk: JSON.stringify(S.panel), p: PL.generatePersonas(S.panel) }).p);
  const results = () => { const p = personas(); if (cache.rk !== cache.pk) { cache.r = PL.simulate(p, S.panel.seed); cache.rk = cache.pk; } return cache.r; };
  const report = () => PL.report(personas(), results());
  const pById = id => personas().find(p => p.id === id);

  const ROUTES = ["", "login", "tests", "new/product", "new/prototype", "new/panel", "run", "report", "p"];
  const STEPS = [["new/product", "제품 기획"], ["new/prototype", "프로토타입"], ["new/panel", "AI 패널"], ["run", "실행"], ["report", "결과"]];
  const V = {};
  let cleanup = null;
  function route() { const h = location.hash.replace(/^#\/?/, "").split("?")[0]; return ROUTES.includes(h) ? h : (h.startsWith("p/") ? "p" : ""); }
  function go(r) { location.hash = "#/" + r; }
  function render() {
    if (cleanup) { cleanup(); cleanup = null; }
    const r = route(), key = r === "" ? "landing" : r.replace("new/", "").replace("/", "_");
    const view = V[key]; const root = document.getElementById("app");
    document.body.dataset.route = key;
    root.innerHTML = view.html(S);
    if (view.mount) cleanup = view.mount(root, S) || null;
    root.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); go(b.dataset.go); }));
    const h1 = root.querySelector("h1, h2"); if (h1) { h1.setAttribute("tabindex", "-1"); }
    window.scrollTo(0, 0);
  }
  addEventListener("hashchange", render);

  // ---------- 공통 조각 ----------
  const seg = (key, cls = "seg") => `<div class="set" data-key="${key}"><div class="set-label">${PL.OPTION_LABELS[key]}</div><div class="${cls}" role="radiogroup" aria-label="${PL.OPTION_LABELS[key]}">` +
    PL.OPTIONS[key].map(([v, l]) => `<button type="button" role="radio" aria-checked="${String(S.panel[key]) === String(v)}" data-val="${v}">${l}</button>`).join("") + `</div></div>`;
  const steps = active => `<ol class="steps">${STEPS.map(([r, l]) => `<li class="${r === active ? "on" : ""}"><a href="#/${r}">${l}</a></li>`).join("")}</ol>`;
  const facts = p => [["가격 민감도", "price"], ["앱 이용 빈도", "app"], ["디지털 수용도", "digital"], ["개인정보 우려", "privacy"]]
    .map(([l, k]) => ({ label: l, key: k, v: p[k], top: 100 - PL.percentile(personas(), k, p[k]) }));
  const who = p => `${p.age}세 · ${p.gender} · ${p.occupation === "student" ? "대학생" : "직장인"} · ${p.region}`;
  const profileLine = p => {
    const bits = [];
    bits.push(p.digital >= 0.7 ? "새 서비스를 먼저 써보는 편이고" : p.digital < 0.45 ? "새 서비스는 남들이 쓴 뒤에 써보는 편이고" : "새 서비스에 큰 거부감은 없고");
    bits.push(p.price >= 0.7 ? "구독료에 예민합니다" : p.price < 0.4 ? "가격보다 편의를 봅니다" : "가격은 적당하면 괜찮습니다");
    const tool = { gcal: "구글 캘린더로", notion: "노션으로", naver: "네이버 캘린더로", paper: "종이 플래너로" }[p.tool];
    return `${bits.join(" ")}. ${tool ? `일정은 ${tool} 관리합니다.` : "일정은 따로 정리하지 않습니다."}`;
  };
  const DROP_SHORT = { UNCLEAR_PURPOSE: "목적 불분명", TOO_MANY_STEPS: "단계가 많음", PRIVACY: "개인정보 부담", PRICE: "가격 부담", TRUST: "신뢰 부족", FEATURE_MISSING: "기능 없음", SWITCHING_COST: "옮기기 번거로움", NAVIGATION_LOST: "길을 잃음" };

  // ---------- 패널 화면 공통 동작 ----------
  function mountPanel(root, o) {
    let sel = S.sel && pById(S.sel) ? S.sel : personas()[Math.min(22, personas().length - 1)].id;
    const draw = () => {
      const ps = personas();
      if (!ps.find(p => p.id === sel)) sel = ps[0].id;
      root.querySelector("[data-slot=chart]").innerHTML = o.chart(ps, sel, S.panel);
      root.querySelector("[data-slot=side]").innerHTML = o.side(pById(sel), ps);
      const chk = root.querySelector("[data-slot=check]"); if (chk) chk.innerHTML = o.check ? o.check(ps) : distNote(ps);
      root.querySelectorAll("[data-slot=count]").forEach(e => e.textContent = ps.length);
      root.querySelectorAll(".set").forEach(set => set.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", String(S.panel[set.dataset.key]) === b.dataset.val)));
      root.querySelectorAll("[data-slot=chart] [data-id]").forEach(n => { n.style.cursor = "pointer"; n.addEventListener("click", () => { sel = n.dataset.id; S.sel = sel; save(); draw(); }); });
    };
    root.querySelectorAll(".set").forEach(set => set.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      const k = set.dataset.key, v = b.dataset.val; S.panel[k] = k === "count" ? Number(v) : v; S.ran = false; save(); draw();
    }));
    root.querySelectorAll("[data-act=redraw]").forEach(b => b.addEventListener("click", () => { S.panel.seed = (S.panel.seed || 0) + 1; S.ran = false; save(); draw(); }));
    draw();
  }
  function distNote(ps) {
    const d = PL.distribution(ps, "price", S.panel.price, "price"), max = Math.max(...d.map(x => Math.abs(x.pct - x.target)));
    const line = d.map(x => `${x.label} ${x.count}명`).join(" · ");
    return S.panel.price === "all"
      ? `가격 민감도 목표 20·50·30% 대비 ${line}. ${max <= 8 ? "목표와 가까워 그대로 진행해도 됩니다." : `목표와 ${max}%p 차이가 납니다. 다시 뽑아보세요.`}`
      : `가격 민감도를 '${PL.BAND_LABEL[S.panel.price]}'으로 고정했습니다. ${line}.`;
  }

  // ---------- 실행 화면 공통 동작 ----------
  function mountRun(root, o) {
    const ps = personas(), rs = results(), n = rs.length;
    const q = k => root.querySelectorAll(`[data-k=${k}]`);
    const setK = (k, v) => q(k).forEach(e => e.textContent = v);
    const orbit = new Orbit(root.querySelector("[data-slot=orbit]"), Object.assign({ onPick: pid => focus(pid) }, o.orbit));
    const log = root.querySelector("[data-slot=log]");
    const focusEl = root.querySelector("[data-slot=focus]");
    let focusId = null;
    function focus(pid) {
      focusId = pid; if (!focusEl) return;
      const p = pById(pid), r = rs.find(x => x.id === pid);
      focusEl.innerHTML = o.focus ? o.focus(p, r) : `<b>${pid}</b> ${who(p)}`;
    }
    const runner = new Runner(ps, rs, {
      slots: orbit.n,
      onAsk: k => { setK("ask", k); setK("phase", "Ask · 기획서를 읽고 답하는 중"); q("askbar").forEach(e => e.style.width = (k / n * 100) + "%"); },
      onPhase: () => setK("phase", "Act · 프로토타입을 써보는 중"),
      onSlot: (i, s) => { orbit.set(i, s); if (s && !focusId) focus(s.pid); },
      onProgress: r => { setK("act", r.started); setK("done", r.done); setK("drop", r.drop); setK("now", r.started - r.finished); q("actbar").forEach(e => e.style.width = (r.finished / n * 100) + "%"); },
      onLog: e => {
        if (!log) return;
        const row = document.createElement("div"); row.className = "log-row " + e.type;
        row.innerHTML = o.logRow ? o.logRow(e) : (e.type === "click" ? `<b>${e.pid}</b> ${e.from} → [${esc(e.target)}]` : e.type === "done" ? `<b>${e.pid}</b> 목표 화면 도착` : `<b>${e.pid}</b> ${e.screen}에서 그만둠 · ${DROP_SHORT[e.reason] || ""}${e.quote ? `<q>${esc(e.quote)}</q>` : ""}`);
        log.prepend(row); while (log.children.length > (o.logMax || 40)) log.lastChild.remove();
      },
      onDone: () => { S.ran = true; save(); setK("phase", "실행 완료"); root.querySelectorAll("[data-act=report]").forEach(b => { b.disabled = false; b.classList.add("ready"); }); o.onDone && o.onDone(); },
    });
    setK("total", n);
    root.querySelectorAll("[data-act=pause]").forEach(b => b.addEventListener("click", () => { const p = !runner.paused; runner.pause(p); orbit.paused = p; b.textContent = p ? "계속" : "일시정지"; b.setAttribute("aria-pressed", p); }));
    root.querySelectorAll("[data-act=speed]").forEach(b => b.addEventListener("click", () => { runner.speed = runner.speed === 1 ? 4 : 1; b.textContent = runner.speed === 1 ? "4배속" : "보통 속도"; }));
    root.querySelectorAll("[data-act=report]").forEach(b => { b.disabled = true; b.addEventListener("click", () => go("report")); });
    runner.start();
    return () => { runner.stop(); orbit.destroy(); };
  }

  // ---------- 결과 화면 조각 ----------
  function reportParts() {
    const rep = report(), rs = results(), ps = personas();
    const maxR = Math.max(...rep.aiReasons.map(x => x[1] / rep.n), ...rep.realReasons.map(x => x[1] / rep.realN), 0.01);
    const reasonKeys = [...new Set([...rep.aiReasons.map(x => x[0]), ...rep.realReasons.map(x => x[0])])].slice(0, 5);
    const pctOf = (list, k, tot) => Math.round(((list.find(x => x[0] === k) || [0, 0])[1]) / tot * 100);
    const reasons = `<div class="reasons">${reasonKeys.map(k => { const a = pctOf(rep.aiReasons, k, rep.n), r = pctOf(rep.realReasons, k, rep.realN); return `<button type="button" class="reason" data-reason="${k}"><span class="r-name">${PL.DROP[k]}</span><span class="r-bars"><i class="r-ai" style="width:${a / maxR}%"></i><i class="r-real" style="width:${r / maxR}%"></i></span><span class="r-num">AI ${a}% · 실제 ${r}%</span></button>`; }).join("")}</div>`;
    const G = { yesDone: "쓰겠다 · 끝까지 감", yesDrop: "쓰겠다 · 중간에 그만둠", noDone: "망설임 · 끝까지 감", noDrop: "망설임 · 그만둠" };
    const gOf = id => Object.keys(rep.groups).find(k => rep.groups[k].includes(id));
    const grid = `<div class="grid100" role="list" aria-label="AI 패널 ${rep.n}명">${rs.map(r => `<button type="button" role="listitem" class="cell g-${gOf(r.id)}" data-id="${r.id}" data-reason="${r.act.end.reason || ""}" data-screen="${r.act.end.result === "drop" ? r.act.end.screen : ""}" title="${r.id}"></button>`).join("")}</div>
      <div class="grid-key">${Object.entries(G).map(([k, l]) => `<span><i class="g-${k}"></i>${l} ${rep.groups[k].length}명</span>`).join("")}</div>`;
    const person = id => {
      const p = pById(id), r = rs.find(x => x.id === id);
      const path = r.act.path.map(s => `<span>${s}</span>`).join("<em>→</em>");
      return `<div class="person"><div class="pp-head"><b>${id}</b><span>${who(p)}</span></div>
        <div class="pp-cols"><div><div class="pp-k">말 · 기획서를 읽고</div><div class="pp-v">사용 의향 ${r.ask.intent}/5</div><p>${esc(r.ask.quote)}</p><div class="pp-ai">AI 응답</div></div>
        <div><div class="pp-k">행동 · 프로토타입에서</div><div class="pp-v">${r.act.end.result === "complete" ? "끝까지 감" : `${r.act.end.screen}에서 그만둠`}</div><div class="pp-path">${path}</div>${r.act.end.result === "drop" ? `<p>${esc((r.act.steps.at(-1) || {}).quote || "")}</p><div class="pp-ai">AI 응답 · ${PL.DROP[r.act.end.reason]}</div>` : ""}</div></div></div>`;
    };
    const gapLine = `‘쓰겠다’고 답한 ${rep.saidYes}명 중 ${rep.groups.yesDrop.length}명이 끝까지 가지 못했습니다.`;
    const calib = `<div class="calib"><div class="c-row"><span>완료율</span><b>AI ${rep.aiRate}% · 실제 ${rep.realRate}%</b></div>
      <p>${rep.gap < 0 ? `AI가 실제보다 ${-rep.gap}%p 낮게 예측했습니다.` : rep.gap > 0 ? `AI가 실제보다 ${rep.gap}%p 낙관적으로 예측했습니다.` : "AI 예측과 실제가 같았습니다."} 완료율 숫자는 참고로만 보세요.</p>
      <div class="c-row"><span>가장 많이 그만둔 화면</span><b>${rep.topScreenMatch ? "AI와 실제 일치" : "AI와 실제가 다름"}</b></div>
      <div class="c-row"><span>그만둔 이유 상위 3개</span><b>${rep.reasonOverlap}/3 겹침</b></div><div class="c-note">실제 참가자 ${rep.realN}명 기준 · 예시 데이터</div></div>`;
    const ask = `<div class="askr"><div class="a-row"><span>평균 사용 의향</span><b>${rep.avgIntent} / 5</b></div><div class="a-row"><span>지불 의향 중앙값</span><b>월 ${rep.median.toLocaleString()}원</b></div>
      <div class="a-feat">${rep.features.slice(0, 5).map(([f, c]) => `<div><span>${f}</span><i style="width:${c}%"></i><b>${c}명</b></div>`).join("")}</div><div class="c-note">금액을 제시하지 않고 직접 입력받았습니다.</div></div>`;
    const invite = `<div class="invite"><p>같은 프로토타입과 과제를 실제 사람에게도 시켜 AI 예측의 오차를 잽니다. 링크를 받은 사람은 로그인 없이 참여합니다.</p>
      <div class="inv-row"><code data-slot="invlink">${S.invited ? location.href.split("#")[0] + "#/p/demo" : "아직 만든 링크가 없습니다"}</code><button type="button" data-act="invite">${S.invited ? "링크 복사" : "참가 링크 만들기"}</button></div>
      <div class="c-note">참여 ${rep.realN}/15명 · 예시 데이터 · <a href="#/p/demo">참가자 화면 미리보기</a></div></div>`;
    return { rep, reasons, grid, person, gapLine, calib, ask, invite, funnel: CH.funnel(rep), firstId: rep.groups.yesDrop[0] || rs[0].id };
  }
  function mountReport(root) {
    const parts = reportParts();
    const show = id => { const el = root.querySelector("[data-slot=person]"); if (el) el.innerHTML = parts.person(id); root.querySelectorAll(".cell").forEach(c => c.classList.toggle("picked", c.dataset.id === id)); };
    root.querySelectorAll(".cell").forEach(c => c.addEventListener("click", () => show(c.dataset.id)));
    const lit = (attr, v, btn) => {
      const on = !btn.classList.contains("on");
      root.querySelectorAll(".reason, .frow").forEach(b => b.classList.remove("on"));
      root.querySelectorAll(".cell").forEach(c => c.classList.toggle("dim", on && c.dataset[attr] !== v));
      if (on) btn.classList.add("on");
    };
    root.querySelectorAll(".reason").forEach(b => b.addEventListener("click", () => lit("reason", b.dataset.reason, b)));
    root.querySelectorAll(".frow").forEach(b => { b.style.cursor = "pointer"; b.addEventListener("click", () => lit("screen", b.dataset.screen, b)); });
    root.querySelectorAll("[data-act=invite]").forEach(b => b.addEventListener("click", () => {
      const url = location.href.split("#")[0] + "#/p/demo";
      if (!S.invited) { S.invited = 1; save(); root.querySelector("[data-slot=invlink]").textContent = url; b.textContent = "링크 복사"; return; }
      try { navigator.clipboard.writeText(url); b.textContent = "복사했습니다"; } catch (e) { b.textContent = "주소를 직접 복사하세요"; }
    }));
    root.querySelectorAll("[data-act=rerun]").forEach(b => b.addEventListener("click", () => { S.ran = false; save(); go("new/prototype"); }));
    show(parts.firstId);
  }

  // ---------- 기본 화면 (시안이 덮어쓰지 않으면 이 구조 사용) ----------
  V.login = {
    html: () => `<main class="v-login"><a class="brand" href="#/">personalab</a><section class="login-card"><h1>로그인</h1><p class="sub">테스트 기록은 계정에 저장됩니다.</p>
      <button class="btn-social google" data-go="tests"><svg class="brand-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS.google}"/></svg>구글로 계속하기</button><button class="btn-social kakao" data-go="tests"><svg class="brand-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS.kakao}"/></svg>카카오로 계속하기</button>
      <div class="or"><span>또는 이메일로</span></div><form class="email" novalidate><label class="field">이메일<input type="email" name="email" autocomplete="email" placeholder="name@school.ac.kr"></label><label class="field">비밀번호<input type="password" name="pw" autocomplete="current-password"></label>
      <p class="err" role="alert" hidden></p><button class="btn-primary" type="submit">로그인</button></form><div class="login-foot"><a href="#/login">비밀번호 다시 설정</a><a href="#/login">이메일로 가입하기</a></div>
      <p class="demo-note">데모 버전입니다. 실제 계정 인증 없이 데모 사용자로 들어갑니다.</p></section></main>`,
    mount: root => {
      root.querySelector("form").addEventListener("submit", e => {
        e.preventDefault(); const f = e.target, err = f.querySelector(".err");
        if (!/.+@.+\..+/.test(f.email.value)) { err.hidden = false; err.textContent = "이메일 주소를 확인하세요. 예: name@school.ac.kr"; f.email.focus(); return; }
        if (!f.pw.value) { err.hidden = false; err.textContent = "비밀번호를 입력하세요."; f.pw.focus(); return; }
        S.user = f.email.value; save(); go("tests");
      });
    },
  };
  const sampleTests = () => {
    const rep = S.ran ? report() : null;
    return [
      { name: "일정메이트 · 회원가입 온보딩", status: S.ran ? "결과 있음" : "설정 중", meta: S.ran ? `완료율 AI ${rep.aiRate}% · 실제 ${rep.realRate}% · 최다 이탈 ${rep.dropScreens[0][0]}` : `AI 패널 ${S.panel.count}명 · 이어서 작성할 수 있습니다`, go: S.ran ? "report" : "new/product", primary: true },
      { name: "스터디플랜 · 첫 계획 만들기", status: "결과 있음", meta: "완료율 AI 58% · 실제 64% · 최다 이탈 S03 · 예시", go: "report" },
      { name: "동아리 회비 정산 · 초대 수락", status: "설정 중", meta: "프로토타입 연결 전 · 예시", go: "new/prototype" },
    ];
  };
  V.tests = {
    html: () => `<main class="v-tests">${V.nav ? V.nav("tests") : ""}<header class="page-head"><h1>내 테스트</h1><button class="btn-primary" data-go="new/product">새 테스트 만들기</button></header>
      <ul class="test-list">${sampleTests().map(t => `<li><a href="#/${t.go}" class="${t.primary ? "primary" : ""}"><span class="t-status s-${t.status === "결과 있음" ? "done" : "draft"}">${t.status}</span><b>${t.name}</b><span class="t-meta">${t.meta}</span></a></li>`).join("")}</ul></main>`,
  };
  V.product = {
    html: s => `<main class="v-setup v-product">${V.nav ? V.nav("setup") : ""}${steps("new/product")}<div class="setup-grid">
      <section class="pane"><h1>제품 기획</h1><p class="sub">기획서를 붙여넣으면 AI 페르소나가 읽을 제품 정보로 정리합니다. Ask 단계에서 쓰입니다.</p>
        <label class="field">기획서<textarea name="plan" rows="7">${esc(s.product.plan)}</textarea></label>
        <div class="row-btns"><label class="btn-ghost file">파일 올리기<input type="file" accept=".txt,.md" hidden></label><button class="btn-ghost" data-act="organize">AI로 정리</button><span class="hint" data-slot="msg">.txt, .md 파일을 읽습니다</span></div></section>
      <section class="pane"><h2>AI 페르소나가 읽는 제품 정보</h2>
        <label class="field">제품명<input name="name" value="${esc(s.product.name)}"></label>
        <label class="field">한 줄 설명<textarea name="description" rows="2">${esc(s.product.description)}</textarea></label>
        <label class="field">기능 <small>한 줄에 하나</small><textarea name="features" rows="5">${esc(s.product.features.join("\n"))}</textarea></label>
        <label class="field">가격 안내<input name="price" value="${esc(s.product.price)}"></label>
        <p class="hint">지불 의향은 금액을 제시하지 않고 페르소나가 직접 답하게 합니다.</p></section></div>
      <footer class="setup-foot"><button class="btn-ghost" data-go="tests">목록으로</button><span class="save-state">자동 저장됨</span><button class="btn-primary" data-act="next">다음: 프로토타입</button></footer></main>`,
    mount: root => {
      const f = n => root.querySelector(`[name=${n}]`), msg = root.querySelector("[data-slot=msg]");
      const sync = () => { S.product.name = f("name").value; S.product.description = f("description").value; S.product.features = f("features").value.split("\n").map(x => x.trim()).filter(Boolean); S.product.price = f("price").value; S.product.plan = f("plan").value; save(); };
      root.querySelectorAll("input,textarea").forEach(i => i.addEventListener("input", sync));
      root.querySelector("[data-act=organize]").addEventListener("click", () => {
        const t = f("plan").value.trim(); if (!t) { msg.textContent = "기획서 내용을 먼저 붙여넣으세요."; return; }
        const first = t.split(/\n/)[0]; const name = (first.split(/[은는이가 ]/)[0] || "새 제품").slice(0, 20);
        const feats = PL.PRODUCT.features.filter(x => t.includes(x));
        f("name").value = name; f("description").value = first.slice(0, 90);
        if (feats.length) f("features").value = feats.join("\n");
        f("price").value = /무료/.test(t) ? (/구독|유료/.test(t) ? "기본 무료, 월 유료 전환" : "무료") : f("price").value;
        sync(); msg.textContent = "데모: 문장 규칙으로 정리했습니다. 실제 서비스에서는 AI가 정리합니다.";
      });
      root.querySelector("input[type=file]").addEventListener("change", async e => { const file = e.target.files[0]; if (!file) return; f("plan").value = await file.text(); sync(); msg.textContent = `${file.name}을 불러왔습니다. 'AI로 정리'를 누르세요.`; });
      root.querySelector("[data-act=next]").addEventListener("click", () => { sync(); if (!S.product.name.trim() || !S.product.description.trim()) { msg.textContent = "제품명과 한 줄 설명을 채워야 다음으로 넘어갑니다."; f(!S.product.name.trim() ? "name" : "description").focus(); return; } go("new/prototype"); });
    },
  };
  function pathOK() { const by = Object.fromEntries(S.screens.map(s => [s.id, s])), seen = new Set(), q = [S.screens[0].id]; while (q.length) { const id = q.shift(); if (id === S.goal) return true; if (seen.has(id) || !by[id]) continue; seen.add(id); by[id].buttons.forEach(b => q.push(b[1])); } return false; }
  V.prototype = {
    html: s => `<main class="v-setup v-proto">${V.nav ? V.nav("setup") : ""}${steps("new/prototype")}<div class="setup-grid wide">
      <section class="pane"><h1>프로토타입과 과제</h1><p class="sub">피그마 프로토타입의 화면과 버튼 연결을 읽어옵니다. Act 단계에서 AI가 이 연결만 따라 움직입니다.</p>
        <div class="figma-row"><input name="figma" placeholder="https://www.figma.com/proto/..." value="${esc(s.figma)}" aria-label="피그마 공유 링크"><button class="btn-ghost" data-act="load">불러오기</button></div>
        <p class="hint" data-slot="msg">화면 간 연결이 설정된 프로토타입이어야 합니다. 연결을 못 읽으면 직접 입력으로 바꿉니다.</p>
        <label class="field">과제<input name="task" value="${esc(s.task)}"></label>
        <label class="field">목표 화면<select name="goal">${s.screens.map(x => `<option value="${x.id}" ${x.id === s.goal ? "selected" : ""}>${x.id} ${x.label}</option>`).join("")}</select></label>
        <p class="path-ok" data-slot="path"></p><p class="hint">과제 문장과 이탈 이유 8가지는 AI와 실제 참가자에게 똑같이 쓰입니다.</p></section>
      <section class="pane frames-pane"><h2>인식한 화면 ${s.screens.length}개</h2><div class="frames">${s.screens.map(x => `<div class="frame ${x.id === s.goal ? "goal" : ""}"><div class="mini">${phoneScreen({ screen: x.id, status: x.id === s.goal ? "idle" : "run", target: x.buttons[0] && x.buttons[0][0] })}</div><b>${x.id} ${x.label}</b><span>${x.buttons.map(b => `[${b[0]}] → ${b[1]}`).join("<br>") || "마지막 화면"}</span></div>`).join("")}</div></section></div>
      <footer class="setup-foot"><button class="btn-ghost" data-go="new/product">이전: 제품 기획</button><span class="save-state">자동 저장됨</span><button class="btn-primary" data-act="next">다음: AI 패널</button></footer></main>`,
    mount: root => {
      const path = root.querySelector("[data-slot=path]"), msg = root.querySelector("[data-slot=msg]");
      const check = () => { const ok = pathOK(); path.textContent = ok ? `S01에서 ${S.goal}까지 이어지는 경로가 있습니다.` : `S01에서 ${S.goal}까지 가는 버튼 연결이 없습니다.`; path.className = ok ? "path-ok" : "path-ok bad"; return ok; };
      root.querySelector("[name=task]").addEventListener("input", e => { S.task = e.target.value; save(); });
      root.querySelector("[name=goal]").addEventListener("change", e => { S.goal = e.target.value; save(); check(); render(); });
      root.querySelector("[data-act=load]").addEventListener("click", () => { S.figma = root.querySelector("[name=figma]").value; save(); msg.textContent = "데모: 피그마 대신 일정메이트 샘플 화면 5개와 버튼 7개를 불러왔습니다."; });
      root.querySelector("[data-act=next]").addEventListener("click", () => { if (!S.task.trim()) { msg.textContent = "과제 문장을 입력하세요."; return; } if (!check()) return; go("new/panel"); });
      check();
    },
  };
  // 참가자 화면: 로그인 없이 같은 과제를 수행
  V.p = {
    html: () => `<main class="v-part" data-slot="part"></main>`,
    mount: root => {
      const box = root.querySelector("[data-slot=part]"); let cur = "S01", stage = "intro", path = ["S01"];
      const by = Object.fromEntries(S.screens.map(s => [s.id, s]));
      const draw = () => {
        if (stage === "intro") box.innerHTML = `<section class="part-card"><div class="part-brand">PersonaLab 사용성 참여</div><h1>앱 화면 하나를 써봐 주세요</h1><p>약 5분 걸립니다. 정답은 없고, 평소처럼 누르다가 그만두고 싶으면 언제든 그만둬도 됩니다.</p><div class="part-task"><span>과제</span><b>${esc(S.task)}</b></div><button class="btn-primary" data-x="start">시작하기</button><p class="demo-note">미리보기 모드 · 응답은 저장되지 않습니다</p></section>`;
        if (stage === "proto") { const s = by[cur]; box.innerHTML = `<section class="part-run"><div class="part-task small"><span>과제</span><b>${esc(S.task)}</b></div><div class="part-phone"><div class="o-scr run">${phoneScreen({ screen: cur, status: "idle" }).replace('<div class="glare"></div>', "")}</div><div class="part-btns">${s.buttons.map(b => `<button class="${b[0] === "뒤로" || b[0] === "건너뛰기" ? "btn-ghost" : "btn-primary"}" data-to="${b[1]}">${b[0]}</button>`).join("")}</div></div><button class="quit" data-x="quit">여기서 그만두기</button></section>`; }
        if (stage === "why") box.innerHTML = `<section class="part-card"><h1>왜 그만두셨나요?</h1><p>가장 가까운 것 하나를 골라 주세요.</p><div class="why">${Object.entries(PL.DROP).map(([k, l]) => `<button class="btn-ghost" data-why="${k}">${l}</button>`).join("")}</div></section>`;
        if (stage === "q") box.innerHTML = `<section class="part-card"><h1>마지막 두 가지</h1><form><fieldset><legend>지금 쓰는 서비스에서 옮길 이유가 있나요?</legend><div class="likert">${[1, 2, 3, 4, 5].map(i => `<label><input type="radio" name="q5" value="${i}" ${i === 3 ? "checked" : ""}>${i}</label>`).join("")}</div><div class="lk-ends"><span>전혀 없다</span><span>매우 크다</span></div></fieldset>
          <label class="field">유료라면 월 얼마까지 낼 수 있나요?<input name="q6" inputmode="numeric" placeholder="금액을 원 단위로 입력"></label><button class="btn-primary" type="submit">제출하기</button></form></section>`;
        if (stage === "end") box.innerHTML = `<section class="part-card"><h1>참여해 주셔서 감사합니다</h1><p>지나간 화면: ${path.join(" → ")}</p><a class="btn-ghost" href="#/report">결과 화면으로 돌아가기</a></section>`;
        box.querySelectorAll("[data-x=start]").forEach(b => b.onclick = () => { stage = "proto"; draw(); });
        box.querySelectorAll("[data-to]").forEach(b => b.onclick = () => { cur = b.dataset.to; path.push(cur); if (cur === S.goal) stage = "q"; draw(); });
        box.querySelectorAll("[data-x=quit]").forEach(b => b.onclick = () => { stage = "why"; draw(); });
        box.querySelectorAll("[data-why]").forEach(b => b.onclick = () => { stage = "q"; draw(); });
        const form = box.querySelector("form"); if (form) form.onsubmit = e => { e.preventDefault(); stage = "end"; draw(); };
      };
      draw();
    },
  };

  g.APP = { S, V, go, render, save, esc, seg, steps, facts, who, profileLine, personas, results, report, pById, mountPanel, mountRun, reportParts, mountReport, distNote, DROP_SHORT };
})(window);
