/* Map Lab: all numerical distortion uses an unscaled, untranslated sphere. */
const $ = id => document.getElementById(id);
const presets = {
  world: { center: [0, 0], zoom: 1, point: [126.978, 37.5665], name: '서울 부근' },
  korea: { center: [127, 37], zoom: 8, point: [126.978, 37.5665], name: '서울 부근' },
  africa: { center: [20, 3], zoom: 2, point: [20, 3], name: '아프리카 중부' },
  greenland: { center: [-42, 72], zoom: 3, point: [-42, 72], name: '그린란드 내륙' },
  europe: { center: [15, 51], zoom: 4, point: [15, 51], name: '유럽 중부' },
  southamerica: { center: [-60, -20], zoom: 2.5, point: [-60, -20], name: '남아메리카 중부' }
};
const state = { ...presets.world, selected: null, hover: null, circles: true };
const panels = [];
const rawProjections = [d3.geoMercator(), d3.geoEqualEarth()].map(p => p.scale(1).translate([0, 0]));
let countries = [], frame = 0;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const validPoint = p => p && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 80;

function distortion(projection, point) {
  const h = 0.00001, rad = Math.PI / 180;
  const lon = clamp(point[0], -180 + h * 2, 180 - h * 2), lat = point[1];
  const l = projection([lon - h, lat]), r = projection([lon + h, lat]);
  const b = projection([lon, lat - h]), t = projection([lon, lat + h]);
  const dx = r.map((v, i) => (v - l[i]) / (2 * h * rad * Math.cos(lat * rad)));
  const dy = t.map((v, i) => (v - b[i]) / (2 * h * rad));
  const area = Math.abs(dx[0] * dy[1] - dx[1] * dy[0]);
  const trace = dx[0] ** 2 + dx[1] ** 2 + dy[0] ** 2 + dy[1] ** 2;
  const root = Math.sqrt(Math.max(0, trace * trace - 4 * area * area));
  const a = Math.sqrt((trace + root) / 2), minor = area / a;
  return { area, angle: 2 * Math.asin(clamp((a - minor) / (a + minor), 0, 1)) / rad };
}

function metrics() {
  const point = state.hover?.point || state.point;
  const values = rawProjections.map(p => distortion(p, point));
  $('point-name').textContent = state.hover?.name || state.name;
  $('coordinates').textContent = `${Math.abs(point[1]).toFixed(2)}° ${point[1] >= 0 ? 'N' : 'S'} / ${Math.abs(point[0]).toFixed(2)}° ${point[0] >= 0 ? 'E' : 'W'}`;
  $('point-mode').textContent = state.hover ? '탐색 중 · 클릭하면 이 위치를 고정합니다' : '고정한 위치 · 지도 위에 마우스를 올려 비교';
  ['merc', 'equal'].forEach((key, i) => {
    $(key + '-area').textContent = values[i].area.toFixed(2) + '×';
    $(key + '-angle').textContent = values[i].angle.toFixed(1) + '°';
  });
  $('merc-detail').textContent = `구면 기준 면적보다 +${((values[0].area - 1) * 100).toFixed(0)}%`;
  $('equal-detail').textContent = '구면 기준 면적 유지 · 모양은 변형';
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(() => { frame = 0; render(); });
}

function render() {
  if (!panels.length) return;
  // One shared scale for both projections: never fit the panels independently.
  const base = Math.min(...panels.map(p => Math.min(p.host.clientWidth, p.host.clientHeight))) / (2 * Math.PI + .25);
  const activePoint = state.hover?.point || state.point;
  panels.forEach(p => {
    const w = p.host.clientWidth, h = p.host.clientHeight;
    p.svg.attr('viewBox', `0 0 ${w} ${h}`);
    p.projection.scale(base * state.zoom).translate([0, 0]).clipExtent(null);
    const center = p.projection(state.center);
    p.projection.translate([w / 2 - center[0], h / 2 - center[1]]).clipExtent([[0, 0], [w, h]]);
    p.ocean.attr('d', p.path({ type: 'Sphere' }));
    p.land.attr('d', p.path).classed('selected', d => d.key === (state.hover?.countryId || state.selected));
    p.grid.attr('d', p.path(d3.geoGraticule10()));
    p.circles.style('display', state.circles ? null : 'none').attr('d', p.path);
    p.cross.attr('d', `M${w / 2 - 7},${h / 2}h14 M${w / 2},${h / 2 - 7}v14`);
    const xy = p.projection(activePoint);
    p.marker.attr('cx', xy[0]).attr('cy', xy[1]);
  });
  $('zoom').value = Math.log2(state.zoom);
  $('zoom-value').textContent = state.zoom.toFixed(2) + '×';
  $('minus').disabled = state.zoom <= 1;
  $('plus').disabled = state.zoom >= 16;
  metrics();
}

function clearPreset() { document.querySelectorAll('[data-place]').forEach(b => b.classList.remove('active')); }
function setZoom(z) { state.zoom = clamp(z, 1, 16); state.hover = null; clearPreset(); schedule(); }
function countryName(feature) {
  const known = { '410': '대한민국', '408': '북한', '304': '그린란드', '840': '미국', '156': '중국', '392': '일본', '643': '러시아', '076': '브라질', '036': '오스트레일리아', '124': '캐나다', '356': '인도', '250': '프랑스', '276': '독일', '826': '영국', '710': '남아프리카공화국' };
  if (feature.id === '036' && feature.properties.name !== 'Australia') return feature.properties.name;
  return known[feature.id] || feature.properties.name;
}
function createPanel(id, projection) {
  const host = $(id), svg = d3.select(host).append('svg').attr('aria-hidden', 'true');
  const p = { host, svg, projection, path: d3.geoPath(projection) };
  p.ocean = svg.append('path').attr('class', 'ocean');
  p.land = svg.append('g').selectAll('path').data(countries).join('path').attr('class', 'country');
  p.grid = svg.append('path').attr('class', 'grid');
  const circles = [];
  for (let lat = -60; lat <= 60; lat += 30) for (let lon = -150; lon <= 150; lon += 30) circles.push(d3.geoCircle().center([lon, lat]).radius(4).precision(4)());
  p.circles = svg.append('g').selectAll('path').data(circles).join('path').attr('class', 'tissot');
  p.cross = svg.append('path').attr('class', 'crosshair');
  p.marker = svg.append('circle').attr('class', 'marker').attr('r', 5);
  let drag = null;
  const location = event => {
    const rect = host.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };
  host.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    drag = { start: location(event), last: location(event), moved: false, id: event.pointerId };
    host.setPointerCapture(event.pointerId);
    state.hover = null;
  });
  host.addEventListener('pointermove', event => {
    const xy = location(event);
    if (drag) {
      if (event.pointerId !== drag.id) return;
      if (Math.hypot(xy[0] - drag.start[0], xy[1] - drag.start[1]) > 4) drag.moved = true;
      if (drag.moved) {
        // Re-render synchronously so successive deltas use the latest projection.
        const point = p.projection.invert([host.clientWidth / 2 - xy[0] + drag.last[0], host.clientHeight / 2 - xy[1] + drag.last[1]]);
        if (point?.every(Number.isFinite)) state.center = [clamp(point[0], -175, 175), clamp(point[1], -80, 80)];
        clearPreset(); render();
      }
      drag.last = xy;
    } else {
      const point = p.projection.invert(xy);
      const roundtrip = validPoint(point) ? p.projection(point) : null;
      if (!roundtrip || Math.hypot(roundtrip[0] - xy[0], roundtrip[1] - xy[1]) > 1) { state.hover = null; schedule(); return; }
      const feature = event.target.__data__?.properties ? event.target.__data__ : null;
      state.hover = { point, countryId: feature?.key, name: feature ? countryName(feature) : '선택 지점' };
      schedule();
    }
  });
  host.addEventListener('pointerup', event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.moved) {
      const xy = location(event), point = p.projection.invert(xy);
      const roundtrip = validPoint(point) ? p.projection(point) : null;
      if (roundtrip && Math.hypot(roundtrip[0] - xy[0], roundtrip[1] - xy[1]) < 1) {
        const country = countries.find(f => d3.geoContains(f, point));
        state.point = point; state.name = country ? countryName(country) : '선택 지점'; state.selected = country?.key || null;
      }
    }
    drag = null; state.hover = null; host.releasePointerCapture(event.pointerId); schedule();
  });
  host.addEventListener('pointercancel', () => { drag = null; state.hover = null; schedule(); });
  host.addEventListener('pointerleave', () => { if (!drag) { state.hover = null; schedule(); } });
  host.addEventListener('wheel', event => { event.preventDefault(); setZoom(state.zoom * Math.exp(-event.deltaY * .0015)); }, { passive: false });
  panels.push(p);
}

document.querySelectorAll('[data-place]').forEach(button => button.addEventListener('click', () => {
  Object.assign(state, presets[button.dataset.place], { hover: null, selected: null });
  clearPreset(); button.classList.add('active'); $('country').value = ''; schedule();
}));
$('zoom').addEventListener('input', e => setZoom(2 ** Number(e.target.value)));
$('minus').addEventListener('click', () => setZoom(state.zoom / 1.5));
$('plus').addEventListener('click', () => setZoom(state.zoom * 1.5));
$('reset').addEventListener('click', () => document.querySelector('[data-place="world"]').click());
$('circles').addEventListener('change', e => { state.circles = e.target.checked; schedule(); });
$('country').addEventListener('change', e => {
  const country = countries.find(f => f.key === e.target.value);
  if (!country) return;
  const center = d3.geoCentroid(country);
  center[0] = clamp(center[0], -175, 175); center[1] = clamp(center[1], -80, 80);
  state.center = center; state.point = center; state.name = countryName(country) + ' · 구면 중심';
  state.selected = country.key; state.hover = null; state.zoom = 4; clearPreset(); schedule();
});

async function init() {
  try {
    const response = await fetch('vendor/countries-50m.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const world = await response.json();
    countries = topojson.feature(world, world.objects.countries).features;
    countries.forEach((f, i) => { f.key = `${f.id || 'region'}-${i}`; });
    [...countries].sort((a, b) => countryName(a).localeCompare(countryName(b), 'ko')).forEach(f => {
      const option = document.createElement('option'); option.value = f.key; option.textContent = countryName(f); $('country').append(option);
    });
    createPanel('mercator', d3.geoMercator()); createPanel('equal', d3.geoEqualEarth());
    new ResizeObserver(schedule).observe(document.querySelector('.maps'));
    $('load-status').textContent = '동일한 투영 스케일 · 구면 기준 · 최대 16×';
    render();
  } catch (error) {
    $('load-status').textContent = '지도 데이터를 불러오지 못했습니다. 연결을 확인한 뒤 새로고침하세요.';
    $('load-status').classList.add('error'); console.error(error);
  }
}
init();
