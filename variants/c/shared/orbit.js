// 3D 궤도 (확정 사항): 페르소나 휴대폰들이 원형 궤도를 돌며 프로토타입을 조작한다.
(function (g) {
  const SCREEN_BODY = {
    S01: () => `<div class="ob-art"><i></i><i></i><i></i></div><div class="ob-t">흩어진 일정을<br>한곳에서</div><div class="ob-s">수업·과제·동아리 일정을 모아<br>오늘의 우선순위를 알려드려요</div>`,
    S02: () => `<div class="h">회원가입</div>` + [["이메일", "minji@jnu.ac.kr"], ["비밀번호", "••••••••"], ["휴대폰 번호", "010-"]].map(([a, b]) => `<div class="lb">${a}</div><div class="in">${b}</div>`).join(""),
    S03: () => `<div class="h">학교 정보</div>` + [["학교", "전남대학교"], ["학년", "선택"], ["전공", ""]].map(([a, b]) => `<div class="lb">${a}</div><div class="in">${b}</div>`).join(""),
    S04: () => `<div class="h">관심분야 5개</div><div class="chips">` + [["공부", 1], ["운동", 1], ["여행", 0], ["동아리", 1], ["알바", 0], ["독서", 0], ["음악", 0], ["취업", 0]].map(([t, on]) => `<span class="${on ? "on" : ""}">${t}</span>`).join("") + `</div>`,
    S05: () => `<div class="h">오늘 할 일</div>` + [["자료구조 과제", "오늘 23:59"], ["동아리 회의", "18:00"], ["토익 단어", "추천"]].map(([t, s]) => `<div class="todo"><b>${t}</b><small>${s}</small></div>`).join(""),
  };
  const PRIMARY = { S01: "시작하기", S02: "다음", S03: "다음", S04: "완료" };

  function phoneScreen(slot) {
    if (!slot || !slot.screen) return `<div class="stbar"><span>9:41</span><span class="isl"></span><span>●●</span></div><div class="idle">다음 사람을<br>기다리는 중</div>`;
    const sid = slot.screen, st = slot.status;
    const label = slot.target || PRIMARY[sid];
    let cta = "";
    if (st === "run" && label) cta = `<div class="cta${slot.tapping ? " tapping" : ""}">${label}<i class="tap"></i></div>`;
    const flag = st === "drop" ? `<div class="flag drop"><b>그만둠</b><span>${PL.DROP[slot.reason] || ""}</span></div>` : st === "done" ? `<div class="flag done"><b>목표 도착</b><span>회원가입 완료</span></div>` : "";
    return `<div class="stbar"><span>9:41</span><span class="isl"></span><span>●●</span></div><div class="app">${SCREEN_BODY[sid]()}</div>${cta}${flag}<div class="glare"></div>`;
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
