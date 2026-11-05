// 분포 시각화 3종 + 보조 차트. 색은 CSS 변수로 받아 시안별 테마를 따른다.
(function (g) {
  const fmt = n => Number(n).toFixed(2);
  // 좁은 화면에서는 viewBox를 줄여 그린다. 넓게 그린 SVG를 줄이면 글자가 5~6px까지 작아진다.
  const narrow = () => (window.innerWidth || 1440) < 700;

  // A: 가격 민감도 × 앱 이용 빈도 산점도 + 목표/표본 분포 막대
  function scatter(personas, selId, panel, opt = {}) {
    const W = opt.w || 620, H = opt.h || 450, x0 = 48, y0 = 34, x1 = W - 96, y1 = H - 70;
    const X = v => x0 + v * (x1 - x0), Y = v => y1 - v * (y1 - y0);
    const dPrice = PL.distribution(personas, "price", panel.price, "price");
    const dApp = PL.distribution(personas, "app", "all", "app");
    let s = `<svg class="chart scatter" viewBox="0 0 ${W} ${H}" role="img" aria-label="가격 민감도와 앱 이용 빈도 산점도">`;
    s += `<line class="axis" x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}"/><line class="axis" x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}"/>`;
    [0.4, 0.7].forEach(t => { s += `<line class="guide" x1="${X(t)}" y1="${y0}" x2="${X(t)}" y2="${y1}"/><line class="guide" x1="${x0}" y1="${Y(t)}" x2="${x1}" y2="${Y(t)}"/>`; });
    personas.forEach(p => {
      if (p.id === selId) return;
      s += `<circle class="dot" data-id="${p.id}" cx="${X(p.price).toFixed(1)}" cy="${Y(p.app).toFixed(1)}" r="4.6"><title>${p.id}</title></circle>`;
    });
    const sel = personas.find(p => p.id === selId);
    if (sel) s += `<circle class="sel-ring" cx="${X(sel.price)}" cy="${Y(sel.app)}" r="11"/><circle class="dot sel" data-id="${sel.id}" cx="${X(sel.price)}" cy="${Y(sel.app)}" r="5.5"/><text class="sel-label" x="${X(sel.price) + 15}" y="${Y(sel.app) + 4}">${sel.id}</text>`;
    const bands = [["low", 0, 0.4], ["mid", 0.4, 0.7], ["high", 0.7, 1]];
    bands.forEach(([b, a, c], i) => {
      const w = X(c) - X(a) - 10, d = dPrice[i];
      s += `<rect class="bar-target" x="${X(a) + 5}" y="${y1 + 14}" width="${(w * d.target / 60).toFixed(1)}" height="7"/>`;
      s += `<rect class="bar-sample" x="${X(a) + 5}" y="${y1 + 24}" width="${(w * d.pct / 60).toFixed(1)}" height="7"/>`;
      s += `<text class="tick strong" x="${X(a) + 5}" y="${y1 + 46}">${d.label} ${d.count}명</text><text class="tick" x="${X(a) + 5}" y="${y1 + 61}">목표 ${d.target}%</text>`;
      const hh = Y(a) - Y(c) - 10, e = dApp[i];
      s += `<rect class="bar-target" x="${x1 + 14}" y="${Y(c) + 5}" width="7" height="${(hh * e.target / 60).toFixed(1)}"/>`;
      s += `<rect class="bar-sample" x="${x1 + 24}" y="${Y(c) + 5}" width="7" height="${(hh * e.pct / 60).toFixed(1)}"/>`;
      s += `<text class="tick" x="${x1 + 38}" y="${Y(c) + 16}">${e.label}</text><text class="tick strong" x="${x1 + 38}" y="${Y(c) + 31}">${e.count}명</text>`;
    });
    s += `<text class="axis-label" x="${x1}" y="${y1 - 8}" text-anchor="end">가격 민감도 →</text>`;
    s += `<text class="axis-label" x="${x0 - 6}" y="${y0 - 14}">↑ 앱 이용 빈도</text></svg>`;
    return s;
  }

  // B: 평행 좌표 — 한 사람이 선 하나
  function parallel(personas, selId, opt = {}) {
    const W = opt.w || 620, H = opt.h || 400;
    const axes = [["나이", "age", 20, 34], ["앱 이용", "app", 0, 1], ["가격 민감도", "price", 0, 1], ["디지털 수용도", "digital", 0, 1], ["개인정보 우려", "privacy", 0, 1]];
    const xs = axes.map((_, i) => 40 + i * (W - 80) / (axes.length - 1)), top = 44, bot = H - 30;
    const Y = (v, lo, hi) => bot - (v - lo) / (hi - lo) * (bot - top);
    const pts = p => axes.map(([, k, lo, hi], i) => `${xs[i].toFixed(1)},${Y(p[k], lo, hi).toFixed(1)}`).join(" ");
    let s = `<svg class="chart parallel" viewBox="0 0 ${W} ${H}" role="img" aria-label="페르소나 특성 평행 좌표">`;
    axes.forEach(([lab, k, lo, hi], i) => {
      s += `<line class="axis" x1="${xs[i]}" y1="${top}" x2="${xs[i]}" y2="${bot}"/><text class="axis-label" x="${xs[i]}" y="${top - 18}" text-anchor="middle">${lab}</text>`;
      s += `<text class="tick" x="${xs[i] + 6}" y="${top + 4}">${k === "age" ? hi : "높음"}</text><text class="tick" x="${xs[i] + 6}" y="${bot}">${k === "age" ? lo : "낮음"}</text>`;
    });
    personas.forEach(p => { if (p.id !== selId) s += `<polyline class="line" data-id="${p.id}" points="${pts(p)}"/>`; });
    const sel = personas.find(p => p.id === selId);
    if (sel) {
      s += `<polyline class="line sel" points="${pts(sel)}"/>`;
      axes.forEach(([, k, lo, hi], i) => { s += `<circle class="node" cx="${xs[i]}" cy="${Y(sel[k], lo, hi)}" r="5"/>`; });
    }
    return s + "</svg>";
  }

  // C: 점 쌓기 — 가격 민감도 순, 색은 지금 쓰는 도구
  function swarm(personas, selId, opt = {}) {
    const W = opt.w || 620, H = opt.h || 360, x0 = 24, x1 = W - 24, base = H - 56, r = opt.r || 9;
    const placed = [];
    [...personas].sort((a, b) => a.price - b.price).forEach(p => {
      const x = x0 + p.price * (x1 - x0); let y = base;
      while (placed.some(q => (x - q.x) ** 2 + (y - q.y) ** 2 < (2 * r + 1.5) ** 2)) y -= 2;
      placed.push({ x, y, p });
    });
    const top = Math.min(...placed.map(q => q.y));
    let s = `<svg class="chart swarm" viewBox="0 0 ${W} ${H}" role="img" aria-label="가격 민감도 순 페르소나 분포">`;
    s += `<line class="axis" x1="${x0}" y1="${base + r + 6}" x2="${x1}" y2="${base + r + 6}"/>`;
    placed.forEach(({ x, y, p }) => { s += `<circle class="tok t-${p.tool}${p.id === selId ? " sel" : ""}" data-id="${p.id}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"><title>${p.id}</title></circle>`; });
    const sel = placed.find(q => q.p.id === selId);
    if (sel) s += `<circle class="sel-ring" cx="${sel.x}" cy="${sel.y}" r="${r + 6}"/><line class="sel-stem" x1="${sel.x}" y1="${sel.y - r - 8}" x2="${sel.x}" y2="${top - 26}"/><text class="sel-label" x="${sel.x}" y="${top - 34}" text-anchor="middle">${sel.p.id}</text>`;
    s += `<text class="axis-label" x="${x0}" y="${base + r + 30}">가격에 둔감</text><text class="axis-label" x="${x1}" y="${base + r + 30}" text-anchor="end">가격에 민감</text></svg>`;
    return s;
  }

  // 퍼널: AI와 실제 겹침 막대. 실제 참가자는 사람 수로 적는다. 행은 키보드로도 누를 수 있다.
  function funnel(rep, opt = {}) {
    const W = opt.w || 640, rowH = opt.rowH || 46, H = rep.funnel.length * rowH + 20, lw = W < 500 ? 104 : 120, rw = W < 500 ? 92 : 120, bw = W - lw - rw;
    let s = `<svg class="chart funnel" viewBox="0 0 ${W} ${H}" role="group" aria-label="화면별 남은 사람. 행을 누르면 그 화면에서 그만둔 사람만 표시합니다.">`;
    rep.funnel.forEach((f, i) => {
      const y = 10 + i * rowH;
      s += `<g class="frow" data-screen="${f.id}" tabindex="0" role="button" aria-pressed="false" aria-label="${f.id} ${f.label}: AI ${f.aiPct}% 남음, 실제 ${f.real}/${rep.realN}명 남음">`;
      s += `<rect class="f-hit" x="-4" y="${y - 2}" width="${W + 4}" height="${rowH - 6}" rx="2"/>`;
      s += `<text class="tick strong" x="0" y="${y + 17}">${f.id} ${f.label}</text>`;
      s += `<rect class="f-ai" x="${lw}" y="${y + 4}" width="${(bw * f.aiPct / 100).toFixed(1)}" height="14"/>`;
      s += `<rect class="f-real" x="${lw}" y="${y + 21}" width="${(bw * f.realPct / 100).toFixed(1)}" height="8"/>`;
      s += `<text class="tick" x="${lw + bw + 10}" y="${y + 16}">AI ${f.aiPct}%</text><text class="tick dim" x="${lw + bw + 10}" y="${y + 31}">실제 ${f.real}/${rep.realN}명</text></g>`;
    });
    return s + "</svg>";
  }

  g.CH = { scatter, parallel, swarm, funnel, fmt, narrow };
})(window);
