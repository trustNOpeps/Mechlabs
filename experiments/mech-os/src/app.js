/* MECH.OS Shaft Studio UI — no frameworks, network calls, or third-party scripts. */
(() => {
  'use strict';
  const E = window.MechEngine;
  if (!E) throw Error('The MECH.OS engineering engine failed to load.');
  const $ = (id) => document.getElementById(id);
  const INPUTS = Object.keys(E.DEFAULT);
  const HISTORY_KEY = 'mech-os/v0.2/studies';
  const BASELINE_KEY = 'mech-os/v0.2/baseline';
  const f = (n, digits=2) => Number.isFinite(n) ? n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:digits}) : '∞';
  const money = (n) => 'Rp ' + f(n,0);
  let current = null, baseline = null, wireframe = false, angle = 0.59, pitch = 0.31, dragging = null, orbitTouch = false, toastTimeout = 0;
  const canvas = $('shaftCanvas');
  const ctx = canvas.getContext('2d', { alpha:false });
  const materialFields = ['yieldStrength','elasticModulus','density'];

  function readInputs() {
    const p = {};
    for (const key of INPUTS) p[key] = $(key).value.trim() === '' ? NaN : Number($(key).value);
    return p;
  }
  function setInputs(p) {
    for (const key of INPUTS) if (Object.prototype.hasOwnProperty.call(p,key)) $(key).value = p[key];
    const preset = Object.entries(E.MATERIALS).find(([,m])=>materialFields.every(k=>p[k]===m[k]));
    $('material').value = preset ? preset[0] : 'custom';
    render();
  }
  function showToast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => $('toast').classList.remove('show'), 2800);
  }
  function setText(id, val) { $(id).textContent = String(val); }
  function setTable(id, rows) {
    const tbody=$(id); tbody.replaceChildren();
    rows.forEach(([label,value])=>{const tr=document.createElement('tr');const l=document.createElement('td');const v=document.createElement('td');l.textContent=label;v.textContent=value;tr.append(l,v);tbody.appendChild(tr);});
  }
  function safeName() { return $('designName').value.trim().slice(0,80) || 'Untitled design'; }
  function resetOutput() {
    for(const id of ['vonMises','factorOfSafety','deflection','utilizationText','estimatedCost']) setText(id,'—');
    $('breakdown').replaceChildren();$('costTable').replaceChildren();
    $('statusBadge').textContent='INVALID INPUT'; $('statusBadge').className='status-badge invalid';
    $('utilizationFill').style.width='0%';
    ['saveStudy','exportReport','exportSTL','exportCSV','exportJSON','setBaseline','copySummary'].forEach(id=>$(id).disabled=true);
    drawPlaceholder();
  }
  function render() {
    try {
      const p=readInputs(); const r=E.analyze(p); current={p,r};
      $('formError').hidden=true; $('formError').textContent='';
      ['saveStudy','exportReport','exportSTL','exportCSV','exportJSON','setBaseline','copySummary'].forEach(id=>$(id).disabled=false);
      const pass=r.overallPass;
      $('statusBadge').textContent=pass?'PASS / PRELIMINARY':'REVIEW / BELOW LIMIT';
      $('statusBadge').className='status-badge'+(pass?'':' review');
      setText('vonMises',f(r.vonMises,2)); setText('factorOfSafety',f(r.factorOfSafety,2)); setText('deflection',f(r.deflection,4));
      setText('fosSub','TARGET ≥ '+f(p.requiredFoS,2));
      setText('deflectionSub',p.deflectionLimit===0?'CHECK DISABLED':'LIMIT '+f(p.deflectionLimit,3)+' mm');
      const percent=100*r.utilization;
      setText('utilizationText',f(percent,1)+'%');
      $('utilizationFill').style.width=Math.max(0,Math.min(100,percent))+'%';
      $('utilizationFill').className=percent>100?'review':'';
      updateCheck('yield',r.yieldPass);
      updateCheck('deflection',r.deflectionPass);
      setText('estimatedCost',money(r.estimatedCost));
      setTable('breakdown',[
        ['Max. bending moment',f(r.moment/1000,3)+' N·m'],
        ['Bending stress',f(r.bendingStress,3)+' MPa'],
        ['Torsional shear stress',f(r.shearStress,3)+' MPa'],
        ['Required diameter',f(r.minimumDiameter,2)+' mm'],
        ['Second moment of area',f(r.I,0)+' mm⁴'],
        ['Polar moment of inertia',f(r.J,0)+' mm⁴']
      ]);
      setTable('costTable',[
        ['Material volume',f(r.volumeMm3/1000000,4)+' L'],
        ['Estimated mass',f(r.massKg,3)+' kg'],
        ['Material rate',money(p.costPerKg)+'/kg'],
        ['Base material cost',money(r.baseMaterialCost)],
        ['Allowance',f(p.allowance,1)+'%']
      ]);
      renderBaseline(); drawModel();
    } catch(err) {
      current=null;
      $('formError').hidden=false;
      $('formError').textContent='Check inputs: '+err.message;
      resetOutput();
    }
  }
  function updateCheck(key,value) {
    const disabled=value===null;
    const ok=value===true;
    $(key+'Status').textContent=disabled?'NOT SET':ok?'PASS':'REVIEW';
    $(key+'Status').className=(disabled||!ok)?'review':'';
    $(key+'Icon').textContent=disabled?'–':ok?'✓':'!';
    $(key+'Icon').className='check-icon'+((disabled||!ok)?' review':'');
  }
  function download(name,body,mime) {
    const blob=new Blob([body],{type:mime});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showToast(name+' downloaded.');
  }
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'shaft'; }
  function report() { return E.getReport(current.p,current.r,safeName()); }
  function exportFile(type) {
    if(!current)return;
    const name=slug(safeName());
    if(type==='stl') download(name+'-mm.stl',E.generateSTL(current.p.diameter,current.p.span),'model/stl');
    else if(type==='csv') download(name+'-analysis.csv',E.toCSV(report()),'text/csv;charset=utf-8');
    else download(name+'-report.json',JSON.stringify(report(),(key,value)=>typeof value==='number'&&!Number.isFinite(value)?'Infinity':value,2)+'\n','application/json;charset=utf-8');
  }
  function storageGet(key, fallback) { try {const x=localStorage.getItem(key);return x?JSON.parse(x):fallback;} catch {return fallback;} }
  function storageSet(key,val) { try {localStorage.setItem(key,JSON.stringify(val));return true;}catch{showToast('Local storage is unavailable in this browser.');return false;} }
  function getStudies(){const studies=storageGet(HISTORY_KEY,[]);return Array.isArray(studies)?studies.filter(s=>s&&typeof s==='object').slice(0,20):[];}
  function renderStudies(){const studies=getStudies();setText('historyCount',String(studies.length).padStart(2,'0'));const list=$('studyList');list.replaceChildren();
    if(studies.length===0){const p=document.createElement('p');p.className='empty';p.textContent='No saved studies yet. Save a run to build your design history.';list.append(p);return;}
    studies.forEach((s,i)=>{
      const item=document.createElement('div');item.className='study-item';
      const meta=document.createElement('div');meta.className='study-meta';
      const name=document.createElement('strong');name.textContent=String(s.name||'Untitled').slice(0,80);
      const sub=document.createElement('small');sub.textContent=(s.date||'')+' · Ø '+f(s.p?.diameter||0,1)+' mm';meta.append(name,sub);
      const actions=document.createElement('div');actions.className='study-actions';
      const load=document.createElement('button');load.type='button';load.textContent='LOAD';load.setAttribute('aria-label','Load '+name.textContent);load.addEventListener('click',()=>{$('designName').value=name.textContent;setInputs(s.p);showToast('Study loaded.');});
      const del=document.createElement('button');del.type='button';del.textContent='×';del.setAttribute('aria-label','Delete '+name.textContent);del.addEventListener('click',()=>{const filtered=getStudies();filtered.splice(i,1);storageSet(HISTORY_KEY,filtered);renderStudies();showToast('Study removed locally.');});
      actions.append(load,del);item.append(meta,actions);list.append(item);
    });
  }
  function saveStudy() {
    if(!current)return;
    const studies=getStudies();studies.unshift({name:safeName(),date:new Date().toLocaleDateString('en-GB'),p:{...current.p}});
    if(storageSet(HISTORY_KEY,studies.slice(0,20))){renderStudies();showToast('Study saved in this browser.');}
  }
  function renderBaseline() {
    setText('baselineName',baseline?baseline.name:'No baseline selected');
    if(!baseline||!current){setText('baselineDiff','Store a reference case to compare the factor of safety and material mass.');return;}
    const deltaSafety=current.r.factorOfSafety-baseline.r.factorOfSafety;
    const deltaMass=current.r.massKg-baseline.r.massKg;
    setText('baselineDiff','Δ FoS '+(deltaSafety>=0?'+':'')+f(deltaSafety,2)+' · Δ mass '+(deltaMass>=0?'+':'')+f(deltaMass,3)+' kg');
  }
  function setBaseline() {if(!current)return;baseline={name:safeName(),r:current.r,p:current.p};storageSet(BASELINE_KEY,{name:baseline.name,p:baseline.p});renderBaseline();showToast('Current design is now the baseline.');}
  function getSummary(){if(!current)return '';const {p,r}=current;return [
    'MECH.OS / SHAFT STUDIO',safeName(),
    `Geometry: Ø${p.diameter} mm × ${p.span} mm`,
    `Load: ${p.force} N central force, ${p.torque} N·m torque`,
    `σᵥ: ${f(r.vonMises,3)} MPa | FoS: ${f(r.factorOfSafety,3)} (required ${p.requiredFoS})`,
    `Deflection: ${f(r.deflection,4)} mm | limit: ${p.deflectionLimit?`${p.deflectionLimit} mm`:'disabled'}`,
    `Minimum yield diameter: ${f(r.minimumDiameter,3)} mm`,
    `Mass: ${f(r.massKg,3)} kg | Cost: ${money(r.estimatedCost)} (illustrative)`,
    `Result: ${r.status} (static yield + specified deflection only)`,
    'Educational, non-certified analysis. No fatigue, keyways or stress concentration checks.'
  ].join('\n');}

  // Canvas 2D renderer of an actual 3D cylindrical mesh, projected to screen.
  // Its triangulated geometry matches the STL cylinder, but this canvas is not a CAD B-rep viewer.
  function drawPlaceholder(){const size=syncCanvas();if(!ctx)return;const w=size.w,h=size.h;ctx.fillStyle='#101914';ctx.fillRect(0,0,w,h);ctx.fillStyle='#9db19e';ctx.font='14px monospace';ctx.textAlign='center';ctx.fillText('ENTER VALID PARAMETERS TO DISPLAY GEOMETRY',w/2,h/2);}
  function syncCanvas(){const box=canvas.getBoundingClientRect();const w=Math.max(100,box.width||960),h=Math.max(100,box.height||350),dpr=Math.min(window.devicePixelRatio||1,2);const pxW=Math.round(w*dpr),pxH=Math.round(h*dpr);if(canvas.width!==pxW||canvas.height!==pxH){canvas.width=pxW;canvas.height=pxH;}ctx.setTransform(dpr,0,0,dpr,0,0);return{w,h};}
  function drawModel(){if(!current)return;const {w,h}=syncCanvas();const p=current.p;
    const d=p.diameter,L=p.span,r=d/2;const cx=w*.51,cy=h*.52;
    const scale=Math.min((w*.64)/Math.max(L*.86,d*3),(h*.58)/Math.max(d*3,60));
    function point(v){const [x,y,z]=v;const ca=Math.cos(angle),sa=Math.sin(angle),cp=Math.cos(pitch),sp=Math.sin(pitch);
      return {x:cx+(x*ca-y*sa)*scale,y:cy+(x*sa*sp+y*ca*sp-z*cp)*scale,z:x*sa*cp+y*ca*cp+z*sp};}
    const line=(a,b,color='#667c68',lw=1)=>{ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
    const path=(a,fill,stroke)=>{ctx.beginPath();ctx.moveTo(a[0].x,a[0].y);for(let i=1;i<a.length;i++)ctx.lineTo(a[i].x,a[i].y);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();}};
    ctx.fillStyle='#111b15';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#233428';ctx.lineWidth=.7;
    for(let x=0;x<=w;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for(let y=0;y<=h;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    // technical axes
    const px=point([-L*.65,0,0]);const qx=point([L*.65,0,0]);line(px,qx,'#3d6646',1);
    const segs=64, faces=[];
    for(let i=0;i<segs;i++){
      const a=i*2*Math.PI/segs,b=(i+1)*2*Math.PI/segs;
      const verts=[[0,r*Math.cos(a),r*Math.sin(a)],[L,r*Math.cos(a),r*Math.sin(a)],[L,r*Math.cos(b),r*Math.sin(b)],[0,r*Math.cos(b),r*Math.sin(b)]];
      // World x is 0..L, shift to center before projection.
      const mapped=verts.map(pt=>point([pt[0]-L/2,pt[1],pt[2]]));
      const middle=(a+b)/2;
      const lum=.42+.32*Math.max(0,Math.sin(middle)*.9+Math.cos(middle)*.5);
      faces.push({depth:mapped.reduce((a,v)=>a+v.z,0)/4,poly:mapped,fill:`hsl(139 15% ${Math.round(22+lum*38)}%)`});
    }
    const cap0=[],cap1=[];
    for(let i=0;i<segs;i++){const a=i*2*Math.PI/segs;cap0.push(point([-L/2,r*Math.cos(a),r*Math.sin(a)]));cap1.push(point([L/2,r*Math.cos(a),r*Math.sin(a)]));}
    const averageDepth=poly=>poly.reduce((sum,x)=>sum+x.z,0)/poly.length;
    faces.push({depth:averageDepth(cap0),poly:cap0,fill:'#405b46',cap:true});
    faces.push({depth:averageDepth(cap1),poly:cap1,fill:'#6f9475',cap:true});
    faces.sort((a,b)=>a.depth-b.depth);
    for(const face of faces) path(face.poly,wireframe?null:face.fill,wireframe?'#b6d09f':face.cap?'#b1c7ac':'#526d55');
    // End ring outlines and center lines
    for(const cap of [cap0,cap1]){
      ctx.strokeStyle='#b7c9aa';ctx.lineWidth=1;ctx.beginPath();cap.forEach((pt,i)=>i?ctx.lineTo(pt.x,pt.y):ctx.moveTo(pt.x,pt.y));ctx.closePath();ctx.stroke();
    }
    const left=point([-L/2,0,0]),right=point([L/2,0,0]);line(left,right,'#b3eaa0',.7);
    // Midspan load indicator
    const loadStart=point([0,0,r*2.9]),loadEnd=point([0,0,r*1.15]);line(loadStart,loadEnd,'#f5ad7b',2);
    ctx.fillStyle='#f5ad7b';ctx.beginPath();ctx.moveTo(loadEnd.x,loadEnd.y);ctx.lineTo(loadEnd.x-5,loadEnd.y-11);ctx.lineTo(loadEnd.x+5,loadEnd.y-11);ctx.closePath();ctx.fill();
    ctx.textAlign='center';ctx.font='11px monospace';ctx.fillText('F = '+f(p.force,0)+' N',loadStart.x,loadStart.y-10);
    ctx.fillStyle='#c9f483';ctx.fillText('Ø '+f(d,1)+' mm',left.x-4,left.y-28);
    ctx.fillStyle='#91ad90';ctx.fillText('L = '+f(L,1)+' mm',w/2,Math.min(h-29,Math.max(left.y,right.y)+66));
    ctx.textAlign='start';
    $('viewTheta').textContent=Math.round(angle*180/Math.PI)+'°';$('viewPhi').textContent=Math.round(pitch*180/Math.PI)+'°';
  }
  function attachOrbit(){canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!orbitTouch)return;dragging={x:e.clientX,y:e.clientY,angle,pitch};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(!dragging)return;angle=dragging.angle+(e.clientX-dragging.x)*.009;pitch=Math.max(-1.1,Math.min(1.1,dragging.pitch+(e.clientY-dragging.y)*.007));drawModel();});
    const stop=()=>dragging=null;canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
    canvas.tabIndex=0;canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();angle+=(e.key==='ArrowRight'?.12:e.key==='ArrowLeft'?-.12:0);pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.key==='ArrowDown'?.12:e.key==='ArrowUp'?-.12:0)));drawModel();});
    $('toggleTouchOrbit').addEventListener('click',()=>{orbitTouch=!orbitTouch;canvas.classList.toggle('orbit-touch-enabled',orbitTouch);$('toggleTouchOrbit').setAttribute('aria-pressed',String(orbitTouch));$('toggleTouchOrbit').textContent=orbitTouch?'Orbit: on':'Orbit: off';});
    $('resetView').addEventListener('click',()=>{angle=.59;pitch=.31;drawModel();});
    $('toggleWire').addEventListener('click',()=>{wireframe=!wireframe;$('toggleWire').setAttribute('aria-pressed',String(wireframe));$('toggleWire').textContent=wireframe?'Shaded':'Wireframe';drawModel();});
    window.addEventListener('resize',()=>{if(current)drawModel();else drawPlaceholder();});
  }
  function initialize(){
    for(const key of INPUTS) $(key).addEventListener('input',()=>{if(materialFields.includes(key))$('material').value='custom';render();});
    $('material').addEventListener('change',()=>{const m=E.MATERIALS[$('material').value];if(m){for(const key of materialFields)$(key).value=m[key];}render();});
    $('loadExample').addEventListener('click',()=>{$('designName').value='Shaft concept A';setInputs(E.DEFAULT);showToast('Illustrative example loaded.');});
    $('saveStudy').addEventListener('click',saveStudy);
    $('setBaseline').addEventListener('click',setBaseline);
    $('exportSTL').addEventListener('click',()=>exportFile('stl'));
    $('exportCSV').addEventListener('click',()=>exportFile('csv'));
    $('exportJSON').addEventListener('click',()=>exportFile('json'));
    $('exportReport').addEventListener('click',()=>{if(!current)return;document.title=`MECH.OS | ${safeName()}`;window.print();document.title='MECH.OS — Engineering Workspace';});
    $('copySummary').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(getSummary());showToast('Calculation summary copied.');}catch{showToast('Clipboard unavailable; use JSON or CSV export.');}});
    attachOrbit();
    const savedBaseline=storageGet(BASELINE_KEY,null);
    if(savedBaseline&&savedBaseline.p){try{baseline={name:String(savedBaseline.name||'Baseline'),p:savedBaseline.p,r:E.analyze(savedBaseline.p)};}catch{baseline=null;}}
    // Keep routine controls reachable while optional details remain compact on phones.
    if(window.matchMedia('(max-width:680px)').matches){
      for(const group of document.querySelectorAll('.input-group')) {
        if(['material-properties','serviceability-and-cost'].includes(group.dataset.group)) group.open=false;
      }
    }
    render();renderStudies();
  }
  initialize();
})();
