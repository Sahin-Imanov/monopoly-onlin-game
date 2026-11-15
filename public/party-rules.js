(function(root){'use strict';
 const TYPES={laser:'Lazer adası',lava:'Lava adası',cannon:'Top adası',mine:'Mayın adası'};
 function defaults(){return {enabled:true,orderMode:'ordered',every:5,games:Object.keys(TYPES),prizes:[300,150,75,25,0,0]}}
 function orderStart(ids){return {groups:[[...ids]],rolls:{},last:{},serial:0,round:1,done:false}}
 function needsRoll(order,id){return !order.done&&order.groups.some(g=>g.length>1&&g.includes(id))&&!order.rolls[id]}
 function orderRoll(order,id,dice){if(!needsRoll(order,id)||!Array.isArray(dice)||dice.length!==2||dice.some(d=>!Number.isInteger(d)||d<1||d>6))return false;order.rolls[id]=[...dice];order.last[id]=[...dice];order.serial++;if(order.groups.some(g=>g.length>1&&g.some(i=>!order.rolls[i])))return true;
 const groups=[];for(const group of order.groups){if(group.length===1){groups.push(group);continue}const scores=new Map();for(const i of group){const sum=order.rolls[i][0]+order.rolls[i][1];if(!scores.has(sum))scores.set(sum,[]);scores.get(sum).push(i)}for(const score of [...scores.keys()].sort((a,b)=>b-a))groups.push(scores.get(score))}order.groups=groups;order.rolls={};order.round++;order.done=groups.every(g=>g.length===1);return true}
 function nextSeat(state,current){const order=state.turnOrder?.length?state.turnOrder:state.p.map(p=>p.i);let n=order.indexOf(current);for(let k=0;k<order.length;k++){n=(n+1)%order.length;const i=order[n];if(!state.p[i].out)return i}return current}
 const api={TYPES,defaults,orderStart,needsRoll,orderRoll,nextSeat};if(typeof module!=='undefined')module.exports=api;else root.PartyRules=api;
})(typeof window!=='undefined'?window:globalThis);
