export const SIZE=5,TILE=1.06,BOARD_SPACE_X=6.5,BOARD_SPACE_Z=6.65,ROUND_COUNT=10,STEP_TIME=.17;
export const DIRECTIONS={up:{dc:0,dr:-1,icon:'↑'},down:{dc:0,dr:1,icon:'↓'},left:{dc:-1,dr:0,icon:'←'},right:{dc:1,dr:0,icon:'→'}};
export function boardCenter(id){return {x:(id%3-1)*BOARD_SPACE_X,z:(Math.floor(id/3)-.5)*BOARD_SPACE_Z}}
export function tilePosition(id,c,r){const b=boardCenter(id);return {x:b.x+(c-2)*TILE,z:b.z+(r-2)*TILE}}
export function nextCell(cell,direction){const d=DIRECTIONS[direction];if(!d)return null;const c=cell.c+d.dc,r=cell.r+d.dr;return c>=0&&c<SIZE&&r>=0&&r<SIZE?{c,r}:null}
export function sequenceLength(round){return [2,3,3,4,5,6,7,8,9,10][Math.min(ROUND_COUNT-1,round)]}
// 100% in round 1, increasing linearly to 200% in round 10.
export function arrowTiming(round){const speed=1+Math.max(0,Math.min(ROUND_COUNT-1,round))/(ROUND_COUNT-1);return {speed,interval:.78/speed,visible:.48/speed}}
export function beatDuration(round){return Math.max(.92,1.6-round*.095)}
export function makeSequence(origin,length,random=Math.random){const cells=[],directions=[];let current={...origin},previous='';for(let i=0;i<length;i++){let options=Object.keys(DIRECTIONS).filter(d=>nextCell(current,d));const opposite={up:'down',down:'up',left:'right',right:'left'};if(options.length>1&&previous)options=options.filter(d=>d!==opposite[previous]);const dir=options[Math.min(options.length-1,Math.floor(random()*options.length))];current=nextCell(current,dir);cells.push({...current});directions.push(dir);previous=dir}return {origin:{...origin},directions,cells}}
export function ranking(players){const sorted=[...players].sort((a,b)=>Number(a.dead)-Number(b.dead)||(!a.dead?b.steps-a.steps:b.death-a.death)||a.id-b.id);let place=0;return sorted.map((p,i)=>{if(i===0||p.dead||sorted[i-1].dead||p.steps!==sorted[i-1].steps)place=i+1;return {...p,place}})}
