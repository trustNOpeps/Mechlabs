const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');
const p = {...E.DEFAULT};
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)), `${a} != ${b}`);
test('center-loaded shaft mechanics',()=>{
  const r=E.analyze(p);
  near(r.moment,100000);
  near(r.bendingStress,32*100000/(Math.PI*30**3));
  near(r.shearStress,16*100000/(Math.PI*30**3));
  near(r.vonMises,Math.hypot(r.bendingStress,Math.sqrt(3)*r.shearStress));
  near(r.deflection,1000*400**3/(48*200000*(Math.PI*30**4/64)));
  assert.equal(r.status,'PASS');
});
test('minimum yield diameter produces target safety factor',()=>{
  const r=E.analyze(p);
  near(E.analyze({...p,diameter:r.minimumDiameter}).factorOfSafety,p.requiredFoS);
});
test('zero loads and deflection limit',()=>{
  const zero=E.analyze({...p,force:0,torque:0});
  assert.equal(zero.vonMises,0);
  assert.equal(zero.factorOfSafety,Infinity);
  const limit=E.analyze({...p,deflectionLimit:.001});
  assert.equal(limit.yieldPass,true);
  assert.equal(limit.deflectionPass,false);
  assert.equal(limit.overallPass,false);
});
test('rejects invalid physical inputs',()=>{
  for(const patch of [{diameter:0},{span:-1},{force:-1},{requiredFoS:.5},{elasticModulus:NaN},{diameter:Infinity}])
    assert.throws(()=>E.analyze({...p,...patch}));
});
test('dimensional scaling and cost',()=>{
  const a=E.analyze(p),b=E.analyze({...p,diameter:60});
  near(a.bendingStress/b.bendingStress,8);
  near(a.deflection/b.deflection,16);
  near(b.massKg/a.massKg,4);
  near(a.estimatedCost,a.massKg*p.costPerKg*1.2);
});
test('STL triangulation and reports',()=>{
  const stl=E.generateSTL(30,400,48);
  assert.equal((stl.match(/facet normal/g)||[]).length,192);
  assert.ok(!stl.includes('NaN'));
  const report=E.getReport(p,E.analyze(p),'Example');
  assert.equal(report.schema,'mech.os/shaft-report/v1');
  assert.ok(E.toCSV(report).includes('"vonMises"'));
});
test('pure bending has zero torsional shear',()=>{
 const r=E.analyze({...p,torque:0});near(r.vonMises,r.bendingStress);near(r.shearStress,0);
});
test('pure torsion has no central deflection',()=>{
 const r=E.analyze({...p,force:0});near(r.moment,0);near(r.deflection,0);near(r.vonMises,Math.sqrt(3)*r.shearStress);
});
test('STL closed mesh and provenance',()=>{
 const s=E.generateSTL(30,400,96);assert.equal((s.match(/facet normal/g)||[]).length,384);
 const rep=E.getReport(p,E.analyze(p),'Example');assert.equal(rep.assumptions.length,6);
 near(rep.outputs.massKg,Math.PI*(.03**2)/4*.4*7850);
});
