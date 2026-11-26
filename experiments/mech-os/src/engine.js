/* MECH.OS deterministic engineering core. Units: N, mm, MPa, N·m, GPa, kg/m³, IDR. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MechEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '0.3.0';
  const DEFAULT = Object.freeze({
    diameter: 30, span: 400, force: 1000, torque: 100,
    yieldStrength: 250, elasticModulus: 200, density: 7850,
    costPerKg: 25000, allowance: 20, requiredFoS: 2,
    deflectionLimit: 1.5
  });
  const MATERIALS = Object.freeze({
    steel: { label: 'Generic structural steel · illustrative', yieldStrength: 250, elasticModulus: 200, density: 7850 },
    aluminium: { label: 'Generic aluminium · illustrative', yieldStrength: 150, elasticModulus: 69, density: 2700 }
  });
  const finite = (x) => typeof x === 'number' && Number.isFinite(x);
  function validate(input) {
    if (!input || typeof input !== 'object') throw new TypeError('A parameter object is required.');
    const positive = ['diameter','span','yieldStrength','elasticModulus','density','requiredFoS'];
    const nonnegative = ['force','torque','costPerKg','allowance','deflectionLimit'];
    for (const key of [...positive, ...nonnegative]) {
      if (!finite(input[key])) throw new RangeError(`${key} must be a finite number.`);
    }
    for (const key of positive) if (input[key] <= 0) throw new RangeError(`${key} must be greater than zero.`);
    for (const key of nonnegative) if (input[key] < 0) throw new RangeError(`${key} must not be negative.`);
    if (input.requiredFoS < 1) throw new RangeError('requiredFoS must be at least 1.');
    if (input.diameter > 2000 || input.span > 100000) throw new RangeError('Geometry is outside the prototype input range.');
    if (input.force > 1e9 || input.torque > 1e9) throw new RangeError('Load is outside the prototype input range.');
    return true;
  }
  function analyze(p) {
    validate(p);
    const { diameter: d, span: L, force: F, torque: torqueNm, yieldStrength: Sy,
      elasticModulus: E, density: rho, costPerKg, allowance, requiredFoS: n,
      deflectionLimit } = p;
    const torque = torqueNm * 1000; // N·mm
    const area = Math.PI * d**2 / 4;
    const I = Math.PI * d**4 / 64;
    const J = Math.PI * d**4 / 32;
    const moment = F * L / 4; // N·mm, center point load and simply supported beam
    const bendingStress = 32 * moment / (Math.PI * d**3);
    const shearStress = 16 * torque / (Math.PI * d**3);
    const vonMises = Math.hypot(bendingStress, Math.sqrt(3) * shearStress);
    const factorOfSafety = vonMises > 0 ? Sy / vonMises : Infinity;
    const deflection = F * L**3 / (48 * E * 1000 * I); // GPa -> N/mm² (MPa)
    const minimumDiameter = Math.cbrt((n / Sy) * Math.hypot(
      32 * moment / Math.PI, Math.sqrt(3) * 16 * torque / Math.PI
    ));
    const volumeMm3 = area * L;
    const massKg = volumeMm3 * 1e-9 * rho;
    const baseMaterialCost = massKg * costPerKg;
    const estimatedCost = baseMaterialCost * (1 + allowance / 100);
    const yieldPass = factorOfSafety >= n;
    const deflectionPass = deflectionLimit === 0 ? null : deflection <= deflectionLimit;
    const overallPass = yieldPass && deflectionPass !== false;
    return {
      model: 'Simply supported, uniform solid circular shaft; central transverse point load + constant torque',
      area, I, J, moment, bendingStress, shearStress, vonMises, factorOfSafety,
      deflection, minimumDiameter, volumeMm3, massKg, baseMaterialCost, estimatedCost,
      utilization: vonMises * n / Sy, yieldPass, deflectionPass, overallPass,
      status: overallPass ? 'PASS' : 'REVIEW'
    };
  }
  function generateSTL(diameter, span, segments = 96) {
    if (![diameter, span, segments].every(finite) || diameter <= 0 || span <= 0 ||
        !Number.isInteger(segments) || segments < 12 || segments > 512) {
      throw new RangeError('STL needs positive geometry and 12–512 integer segments.');
    }
    const r = diameter / 2;
    const point = (i, x) => [x, r * Math.cos(i * 2 * Math.PI / segments), r * Math.sin(i * 2 * Math.PI / segments)];
    const facets = [];
    function add(a, b, c) {
      const u = b.map((v, i) => v - a[i]);
      const v = c.map((q, i) => q - a[i]);
      const cr = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
      const len = Math.hypot(...cr);
      const normal = cr.map(q => q / len);
      facets.push(`facet normal ${normal.join(' ')}\n outer loop\n${[a,b,c].map(pt => '  vertex ' + pt.join(' ')).join('\n')}\n endloop\nendfacet`);
    }
    for (let i = 0; i < segments; i++) {
      const a = point(i, 0), b = point(i+1, 0), c = point(i, span), d = point(i+1, span);
      add(a, b, d); add(a, d, c);
      add([0,0,0], b, a); add([span,0,0], c, d);
    }
    return `solid mech_os_shaft_mm\n${facets.join('\n')}\nendsolid mech_os_shaft_mm\n`;
  }
  function getReport(p, r, name = 'Untitled design') {
    validate(p);
    return { schema: 'mech.os/shaft-report/v1', engineVersion: VERSION,
      generatedAt: new Date().toISOString(), name, units: {
        geometry: 'mm', force: 'N', torque: 'N·m', stress: 'MPa', modulus: 'GPa',
        density: 'kg/m³', mass: 'kg', cost: 'IDR'
      }, inputs: { ...p }, outputs: { ...r },
      assumptions: [
        'Simply supported uniform shaft with transverse point load at midspan.',
        'Constant torque; bending and torsion treated as simultaneous static loads.',
        'Linear elastic Euler–Bernoulli bending; von Mises yield criterion.',
        'No fatigue, keys, notches, stress concentrations, bearing details, or dynamic loads.',
        'Pass means only that selected static yield and optional deflection checks pass.',
        'Material presets and cost inputs are illustrative, not verified supplier data.'
      ] };
  }
  function toCSV(report) {
    const rows = [['section','parameter','value','unit']];
    const inputUnits = { diameter:'mm',span:'mm',force:'N',torque:'N·m',yieldStrength:'MPa',elasticModulus:'GPa',density:'kg/m³',costPerKg:'IDR/kg',allowance:'%',requiredFoS:'-',deflectionLimit:'mm' };
    const outputUnits = {area:'mm²',I:'mm⁴',J:'mm⁴',moment:'N·mm',bendingStress:'MPa',shearStress:'MPa',vonMises:'MPa',factorOfSafety:'-',deflection:'mm',minimumDiameter:'mm',volumeMm3:'mm³',massKg:'kg',baseMaterialCost:'IDR',estimatedCost:'IDR',utilization:'ratio'};
    for(const [k,v] of Object.entries(report.inputs)) rows.push(['input',k,v,inputUnits[k]||'-']);
    for(const [k,v] of Object.entries(report.outputs)) if(typeof v !== 'object') rows.push(['output',k,v,outputUnits[k]||'-']);
    const esc = (s) => '"' + String(s).replaceAll('"','""') + '"';
    return rows.map(r=>r.map(esc).join(',')).join('\r\n')+'\r\n';
  }
  return Object.freeze({ VERSION, DEFAULT, MATERIALS, validate, analyze, generateSTL, getReport, toCSV });
});
