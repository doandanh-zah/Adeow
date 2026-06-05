import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const packageRoot = path.join(
  process.cwd(),
  "node_modules",
  "@excalidraw",
  "excalidraw",
  "dist",
  "prod",
);

const originalGridDefinition =
  'Ti={Bold:"#dddddd",Regular:"#e5e5e5"},g7=(e,t,n,r,o,i,a,s)=>{let d=r%t-t,c=o%t-t,l=t*i.value,U=1/i.value;e.save(),i.value===1&&e.translate(d%1?0:.5,c%1?0:.5);for(let p=d;p<d+a+t*2;p+=t){let m=n>1&&Math.round(p-r)%(n*t)===0;if(!m&&l<10)continue;let b=Math.min(1/i.value,m?4:1);e.lineWidth=b;let E=[b*3,U+(b+U)];e.beginPath(),e.setLineDash(m?[]:E),e.strokeStyle=m?Ti.Bold:Ti.Regular,e.moveTo(p,c-t),e.lineTo(p,Math.ceil(c+s+t*2)),e.stroke()}for(let p=c;p<c+s+t*2;p+=t){let m=n>1&&Math.round(p-o)%(n*t)===0;if(!m&&l<10)continue;let b=Math.min(1/i.value,m?4:1);e.lineWidth=b;let E=[b*3,U+(b+U)];e.beginPath(),e.setLineDash(m?[]:E),e.strokeStyle=m?Ti.Bold:Ti.Regular,e.moveTo(d-t,p),e.lineTo(Math.ceil(d+a+t*2),p),e.stroke()}e.restore()}';

const patchedGridDefinition =
  'Ti={light:"#6b7280",dark:"#9ca3af"},g7=(e,t,n,r,o,i,a,s,d)=>{let c=t*i.value,l=c<16?Math.ceil(16/Math.max(c,1)):1,U=t*l,p=r%U-U,m=o%U-U,b=Math.max(.72,Math.min(2.4,.72+Math.max(0,c-16)*1375e-5))/i.value;e.save(),e.fillStyle=a==="dark"?Ti.dark:Ti.light,e.globalAlpha=a==="dark"?.56:.5,e.beginPath();for(let E=p;E<p+s+U*2;E+=U)for(let g=m;g<m+d+U*2;g+=U)e.moveTo(E+b,g),e.arc(E,g,b,0,Math.PI*2);e.fill(),e.restore()}';

const originalGridCall =
  "d&&g7(p,a.gridSize,a.gridStep,a.scrollX,a.scrollY,a.zoom,l/a.zoom.value,U/a.zoom.value);";

const patchedGridCall =
  "d&&g7(p,a.gridSize,a.gridStep,a.scrollX,a.scrollY,a.zoom,a.theme,l/a.zoom.value,U/a.zoom.value);";

const prodChunks = readdirSync(packageRoot).filter(
  (entry) => entry.startsWith("chunk-") && entry.endsWith(".js"),
);

let patchedAny = false;

for (const chunkName of prodChunks) {
  const chunkPath = path.join(packageRoot, chunkName);
  const source = readFileSync(chunkPath, "utf8");

  if (
    source.includes(patchedGridDefinition) &&
    source.includes(patchedGridCall)
  ) {
    patchedAny = true;
    continue;
  }

  if (
    !source.includes(originalGridDefinition) ||
    !source.includes(originalGridCall)
  ) {
    continue;
  }

  const nextSource = source
    .replace(originalGridDefinition, patchedGridDefinition)
    .replace(originalGridCall, patchedGridCall);

  writeFileSync(chunkPath, nextSource);
  patchedAny = true;
}

if (!patchedAny) {
  throw new Error(
    "Could not patch Excalidraw production grid. The upstream bundle shape changed.",
  );
}
