// 3D 궤도 (확정 사항): 페르소나 휴대폰들이 원형 궤도를 돌며 프로토타입을 조작한다.
(function (g) {
  // 휴대폰 화면: 테스트 대상 앱 '일정메이트'의 5개 화면.
  // 크기는 모두 em(기준 9.5px)이라 궤도·프로토타입 미리보기·참가자 화면에서 같은 비율로 보인다.
  // 클래스는 ps- 접두어를 붙여 시안 CSS(.focus, .prog 등)와 부딪히지 않게 한다.
  const SV = (d, w = 1.7) => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const IC = {
    back: SV("M10 3 5 8l5 5", 1.9), search: SV("M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10Zm3.6-1.4L14 14"), check: SV("m3.5 8.5 3 3 6-7", 2.2),
    home: SV("M2.5 7.5 8 3l5.5 4.5V13a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1Z"), cal: SV("M3 4h10v9H3zM3 7h10M6 2.5v3M10 2.5v3"), plus: SV("M8 3.5v9M3.5 8h9", 2), user: SV("M8 8a2.6 2.6 0 1 0 0-5.2A2.6 2.6 0 0 0 8 8Zm-5 6c.6-2.6 2.6-4 5-4s4.4 1.4 5 4"),
  };
  const SB = `<div class="stbar"><span class="ps-time">9:41</span><span class="isl"></span><span class="ps-ind"><i class="ps-sig"><b></b><b></b><b></b><b></b></i><i class="ps-bat"></i></span></div>`;
  // 위쪽 바: 뒤로 · 가입 진행 단계(3단계) · 건너뛰기
  const top = (step, skip) => `<div class="ps-hd"><span class="ps-act" data-b="뒤로">${IC.back}</span><div class="ps-prog" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div><span class="ps-n">${step}/3</span>${skip ? `<span class="ps-act ps-skip" data-b="건너뛰기">건너뛰기</span>` : ""}</div>`;
  const field = (l, v, o = {}) => `<div class="ps-fld${o.typing ? " typing" : ""}"><span class="ps-fl">${l}</span><span class="ps-fv${v ? "" : " ph"}">${v || o.ph || ""}${o.typing ? '<i class="ps-caret"></i>' : ""}</span>${o.icon || ""}${o.btn ? `<em>${o.btn}</em>` : ""}</div>`;
  const day = (list, today) => `<div class="ps-wk">${list.map((d, i) => `<span class="${i === today ? "on" : ""}">${d}<b>${14 + i}</b></span>`).join("")}</div>`;
  const SCREEN_BODY = {
    S01: () => `<div class="ps-logo"><i></i>일정메이트</div>
      <div class="ps-card">${day(["월", "화", "수", "목", "금"], 2)}<div class="ps-ev c1"><b>자료구조 과제</b><small>23:59</small></div><div class="ps-ev c2"><b>동아리 회의</b><small>18:00</small></div></div>
      <div class="ps-big">흩어진 일정을<br>한곳에서</div><div class="ps-lede">오늘 할 일의 순서를 알려드려요</div>`,
    S02: () => `${top(1)}<div class="ps-ttl">계정을 만들어요</div>${field("이메일", "minji@jnu.ac.kr")}${field("비밀번호", "••••••••")}${field("휴대폰 번호", "010-", { typing: true, btn: "인증" })}`,
    S03: () => `${top(2, true)}<div class="ps-ttl">학교 정보를<br>알려주세요</div>${field("학교", "전남대학교", { icon: `<span class="ps-fi">${IC.search}</span>` })}<div class="ps-segs" aria-label="학년">${[1, 2, 3, 4].map(n => `<span class="${n === 2 ? "on" : ""}">${n}학년</span>`).join("")}</div>${field("전공", "", { ph: "전공을 입력하세요", typing: true })}`,
    S04: () => `${top(3, true)}<div class="ps-ttl">관심분야를<br>5개 골라주세요</div><div class="ps-cnt"><b>3</b>/5 선택</div><div class="chips">${[["공부", 1], ["운동", 1], ["여행", 0], ["동아리", 1], ["알바", 0], ["독서", 0], ["취업", 0]].map(([t, on]) => `<span class="${on ? "on" : ""}">${on ? IC.check : ""}${t}</span>`).join("")}</div>`,
    S05: () => `<div class="ps-hm"><div><small>11월 16일 수요일</small><b>오늘 할 일 3개</b></div><i class="ps-av">민</i></div>${day(["월", "화", "수", "목", "금", "토"], 2)}
      <div class="ps-sec">우선순위 추천</div>${[["c1", "자료구조 과제", "오늘 23:59", "1순위"], ["c2", "동아리 회의", "18:00", ""], ["c3", "토익 단어 30개", "10분", "추천"]].map(([c, t, m, tag]) => `<div class="todo ${c}"><div><b>${t}</b><small>${m}</small></div>${tag ? `<em>${tag}</em>` : ""}</div>`).join("")}
      <div class="ps-tabs">${[IC.home, IC.cal, IC.plus, IC.user].map((ic, i) => `<span class="${i === 0 ? "on" : ""}${i === 2 ? " ps-add" : ""}">${ic}</span>`).join("")}</div>`,
  };
  // 화면 아래 주 버튼. 뒤로·건너뛰기는 위쪽 바에 있다.
  const PRIMARY = { S01: "시작하기", S02: "다음", S03: "다음", S04: "완료" };

  function phoneScreen(slot) {
    if (!slot || !slot.screen) return `${SB}<div class="idle"><i class="ps-spin"></i>다음 사람을<br>기다리는 중</div>`;
    const sid = slot.screen, st = slot.status, label = st === "run" ? (slot.target || PRIMARY[sid]) : null;
    const foot = PRIMARY[sid] ? `<div class="cta"><span class="ps-pri" data-b="${PRIMARY[sid]}">${PRIMARY[sid]}</span></div>` : "";
    let html = `${SB}<div class="app">${SCREEN_BODY[sid]()}</div>${foot}`;
    // 지금 누르는 버튼(주 버튼·뒤로·건너뛰기)에 누르는 표시를 붙인다
    if (label) html = html.replace(new RegExp(`class="([^"]*)" data-b="${label}">`), (m, c) => `class="${c} hit" data-b="${label}"><i class="tap"></i>`);
    if (st === "drop") html += `<div class="ps-scrim"></div><div class="flag drop"><span class="ps-fx">!</span><b>여기서 그만둠</b><span>${PL.DROP[slot.reason] || ""}</span></div>`;
    if (st === "done") html += `<div class="ps-scrim light"></div><div class="flag done"><span class="ps-fx">${IC.check}</span><b>회원가입 완료</b><span>목표 화면에 도착</span></div>`;
    return html + `<div class="glare"></div>`;
  }

  class Orbit {
    constructor(el, o = {}) {
      this.el = el; this.n = o.count || 8; this.o = Object.assign({ W: 130, H: 266, D: 11, R: 25, radius: 300, tilt: -18, roll: 0, speed: 7, lift: 22, minop: 0.4 }, o);
      this.angle = o.start || 0; this.paused = false; this.slots = Array(this.n).fill(null); this.onPick = o.onPick;
      this.build(); this.bindDrag(); this.last = performance.now();
      this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const loop = t => { if (!this.alive) return; const dt = (t - this.last) / 1000; this.last = t; if (!this.paused && !this.dragging && !this.reduced) this.angle += this.o.speed * dt; this.place(); this.raf = requestAnimationFrame(loop); };
      this.alive = true; this.raf = requestAnimationFrame(loop);
    }
    build() {
      const { W, H, D, R, radius, tilt, roll, lift } = this.o;
      this.el.classList.add("orbit");
      this.el.innerHTML = `<div class="o-cam"><div class="o-ring" style="transform:rotateX(${tilt}deg) rotateZ(${roll}deg)"><div class="o-plate" style="width:${radius * 2 + 80}px;height:${radius * 2 + 80}px;transform:translateY(${H / 2 + lift + 1}px) rotateX(90deg)"></div></div></div>`;
      this.ring = this.el.querySelector(".o-ring");
      this.devs = [];
      for (let i = 0; i < this.n; i++) {
        const d = document.createElement("div"); d.className = "o-dev"; d.dataset.i = i;
        d.innerHTML = `<div class="o-cast" style="width:${W * 1.15}px;height:${W * 0.42}px;transform:translateY(${H / 2 + lift}px) rotateX(90deg)"></div>
<div class="o-f o-front" style="width:${W}px;height:${H}px;border-radius:${R}px;transform:translateZ(${D / 2}px)"><div class="o-scr"></div></div>
<div class="o-f o-back" style="width:${W}px;height:${H}px;border-radius:${R}px;transform:rotateY(180deg) translateZ(${D / 2}px)"><div class="cam"><i></i><i></i></div></div>
<div class="o-f o-edge e1" style="width:${D}px;height:${H - R * 1.25}px;transform:rotateY(90deg) translateZ(${W / 2}px)"></div>
<div class="o-f o-edge e2" style="width:${D}px;height:${H - R * 1.25}px;transform:rotateY(-90deg) translateZ(${W / 2}px)"></div>
<div class="o-f o-edge" style="width:${W - R * 1.25}px;height:${D}px;transform:rotateX(90deg) translateZ(${H / 2}px);filter:brightness(1.1)"></div>
<div class="o-f o-edge" style="width:${W - R * 1.25}px;height:${D}px;transform:rotateX(-90deg) translateZ(${H / 2}px);filter:brightness(.55)"></div>
<button class="o-pid" type="button" style="transform:translateY(${H / 2 + 34}px) translateZ(${D}px)"></button>`;
        d.querySelector(".o-pid").addEventListener("click", () => { const s = this.slots[i]; if (s && this.onPick) this.onPick(s.pid); });
        this.ring.appendChild(d); this.devs.push(d);
      }
      this.place();
    }
    place() {
      const { radius } = this.o;
      this.devs.forEach((d, i) => {
        const a = this.angle + i * 360 / this.n, c = Math.cos(a * Math.PI / 180), s = Math.abs(Math.sin(a * Math.PI / 180));
        d.style.transform = `rotateY(${a}deg) translateZ(${radius}px)`;
        d.style.setProperty("--op", (this.o.minop + (1 - this.o.minop) * (c + 1) / 2).toFixed(2));
        d.style.setProperty("--shade", (0.55 + 0.45 * s).toFixed(2));
        d.style.zIndex = Math.round(c * 100) + 100;
        // 뒤로 돈 휴대폰의 이름표는 카메라 쪽으로 돌려 좌우가 뒤집혀 보이지 않게 한다
        const pid = d.querySelector(".o-pid"), back = c < 0;
        if (pid.dataset.back !== String(back)) { pid.dataset.back = back; pid.style.transform = `translateY(${this.o.H / 2 + 34}px) translateZ(${back ? -this.o.D : this.o.D}px)${back ? " rotateY(180deg)" : ""}`; }
      });
    }
    set(i, slot) {
      this.slots[i] = slot; const d = this.devs[i];
      d.querySelector(".o-scr").innerHTML = phoneScreen(slot);
      d.querySelector(".o-scr").className = "o-scr " + (slot ? slot.status : "idle");
      const pid = d.querySelector(".o-pid"); pid.textContent = slot ? slot.pid : ""; pid.className = "o-pid " + (slot ? slot.status : "");
      pid.style.visibility = slot ? "visible" : "hidden";
    }
    bindDrag() {
      let x0 = 0, a0 = 0;
      this.el.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; this.dragging = true; x0 = e.clientX; a0 = this.angle; this.el.setPointerCapture(e.pointerId); });
      this.el.addEventListener("pointermove", e => { if (this.dragging) { this.angle = a0 + (e.clientX - x0) * 0.35; this.place(); } });
      const up = () => { this.dragging = false; };
      this.el.addEventListener("pointerup", up); this.el.addEventListener("pointercancel", up);
    }
    destroy() { this.alive = false; cancelAnimationFrame(this.raf); }
  }

  // 실행 스케줄러: Ask 100명 → Act를 8칸 동시에 진행
  class Runner {
    constructor(personas, results, h) {
      this.p = personas; this.r = results; this.h = h; this.speed = 1; this.paused = false;
      this.askDone = 0; this.queue = results.map((_, i) => i); this.started = 0; this.finished = 0; this.done = 0; this.drop = 0;
      this.slotState = Array(h.slots || 8).fill(null); this.timer = null;
    }
    start() { this.phase = "ask"; this.tick(); }
    wait(ms) { return Math.max(40, ms / this.speed); }
    tick() {
      clearTimeout(this.timer);
      if (this.paused) return;
      if (this.phase === "ask") {
        this.askDone = Math.min(this.r.length, this.askDone + 4);
        this.h.onAsk && this.h.onAsk(this.askDone);
        if (this.askDone >= this.r.length) { this.phase = "act"; this.h.onPhase && this.h.onPhase("act"); }
        this.timer = setTimeout(() => this.tick(), this.wait(this.phase === "ask" ? 90 : 300));
        return;
      }
      if (this.phase === "act") {
        this.slotState.forEach((s, i) => this.advance(i));
        if (this.finished >= this.r.length) { this.phase = "done"; this.h.onDone && this.h.onDone(); return; }
        this.timer = setTimeout(() => this.tick(), this.wait(950));
      }
    }
    advance(i) {
      let s = this.slotState[i];
      if (s && (s.status === "done" || s.status === "drop")) {
        if (++s.hold < 2) return;
        s = this.slotState[i] = null;
      }
      if (!s) {
        if (!this.queue.length) { this.h.onSlot(i, null); return; }
        const idx = this.queue.shift(), res = this.r[idx];
        s = this.slotState[i] = { idx, pid: res.id, step: 0, screen: "S01", status: "run", hold: 0 };
        this.started++;
        const first = res.act.steps[0];
        s.target = first && first.action === "click" ? first.target : null;
        this.h.onSlot(i, s); this.h.onProgress && this.h.onProgress(this); return;
      }
      const res = this.r[s.idx], st = res.act.steps[s.step];
      if (!st) { s.status = "done"; this.finish(s, res); this.h.onSlot(i, s); return; }
      if (st.action === "abandon") { s.status = "drop"; s.reason = st.reason; this.finish(s, res, st); this.h.onSlot(i, s); return; }
      s.step++; s.screen = st.to;
      this.h.onLog && this.h.onLog({ pid: s.pid, type: "click", from: st.screen, to: st.to, target: st.target });
      const nxt = res.act.steps[s.step];
      if (s.screen === PL.TASK.goal) { s.status = "done"; this.finish(s, res); }
      else s.target = nxt && nxt.action === "click" ? nxt.target : null;
      this.h.onSlot(i, s);
    }
    finish(s, res, st) {
      this.finished++; if (s.status === "done") this.done++; else this.drop++;
      this.h.onLog && this.h.onLog({ pid: s.pid, type: s.status, screen: s.screen, reason: s.reason, quote: st && st.quote });
      this.h.onProgress && this.h.onProgress(this);
    }
    pause(v) { this.paused = v; if (!v) this.tick(); }
    stop() { clearTimeout(this.timer); this.paused = true; }
  }

  g.Orbit = Orbit; g.Runner = Runner; g.phoneScreen = phoneScreen;
})(window);
