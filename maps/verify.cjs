// Independent analytical references: spherical Mercator sec²(latitude),
// Equal Earth equal-area property. No network or browser required.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const d3 = require('./vendor/d3.min.js');
const source = fs.readFileSync(__dirname + '/app.js', 'utf8');
const fn = source.slice(source.indexOf('function distortion('), source.indexOf('\nfunction metrics('));
const distortion = vm.runInNewContext('const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));' + fn + ';distortion');
let checks = 0;
for (const lon of [-180, -179, -90, 0, 127, 179, 180]) {
  for (const lat of [-80, -60, -30, 0, 37.5665, 60, 72, 80]) {
    const merc = distortion(d3.geoMercator().scale(1).translate([0,0]), [lon,lat]);
    const eq = distortion(d3.geoEqualEarth().scale(1).translate([0,0]), [lon,lat]);
    const expected = 1 / Math.cos(lat * Math.PI / 180) ** 2;
    assert.ok(Math.abs(merc.area / expected - 1) < 1e-6, `Mercator area at ${lon},${lat}`);
    assert.ok(merc.angle < .001, `Mercator conformality at ${lon},${lat}`);
    assert.ok(Math.abs(eq.area - 1) < 1e-6, `Equal Earth area at ${lon},${lat}`);
    assert.ok(Number.isFinite(eq.angle) && eq.angle >= 0 && eq.angle < 180);
    checks += 4;
  }
}
console.log(`PASS: ${checks} analytical checks across 56 locations, including ±180° seams and ±80° latitude.`);
