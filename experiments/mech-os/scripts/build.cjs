const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
const engine=fs.readFileSync(path.join(root,'src/engine.js'),'utf8');
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const output=html.replace('<link rel="stylesheet" href="src/styles.css">','<style>\n'+css+'\n</style>').replace('<script src="src/engine.js" defer></script>','').replace('<script src="src/app.js" defer></script>','').replace('</body>','<script>\n'+engine+'\n</script>\n<script>\n'+app+'\n</script>\n</body>');
fs.writeFileSync(path.join(root,'MECH-OS-standalone.html'),output);
console.log('Generated standalone HTML');