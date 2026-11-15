export const RADIUS=8.4,PLAYER_RADIUS=.45,MAX_HEALTH=3,ROUND_TIME=60;
export const INTERVALS=[1,.85,.7,.55,.4,.3];
export function levelAt(t){return Math.min(5,Math.floor(Math.max(0,t)/10))}
export function shotInterval(t){return INTERVALS[levelAt(t)]}
export function clampCircle(x,z,radius=RADIUS-PLAYER_RADIUS){const d=Math.hypot(x,z);return d>radius?{x:x/d*radius,z:z/d*radius}:{x,z}}
export function segmentHit(ax,az,bx,bz,px,pz,radius){const dx=bx-ax,dz=bz-az,d=dx*dx+dz*dz,t=d?Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/d)):0;return Math.hypot(ax+dx*t-px,az+dz*t-pz)<=radius}
export function ranking(players){const sorted=[...players].sort((a,b)=>Number(a.dead)-Number(b.dead)||(!a.dead?b.hp-a.hp:b.death-a.death)||a.id-b.id);let place=0;return sorted.map((p,i)=>{if(i===0||p.dead||sorted[i-1].dead||p.hp!==sorted[i-1].hp)place=i+1;return {...p,place}})}
