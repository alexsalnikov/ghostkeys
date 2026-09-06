import { lessons } from './lessons';
export interface Result { wins: number; attempts: number; hints: number; last: string; mastered: boolean; stage: number }
export interface Progress { version: 1; introductionComplete?: boolean; lessons: Record<string,Result>; days: Record<string,number>; current: string; daily: { date: string; ids: string[]; done: string[] } }
export const storageKey='ghostkeys.progress.v1';
export const today=()=>new Date().toLocaleDateString('en-CA');
export const emptyResult=():Result=>({wins:0,attempts:0,hints:0,last:'',mastered:false,stage:0});
export const emptyProgress=():Progress=>({version:1,lessons:{},days:{},current:'insert',daily:{date:'',ids:[],done:[]}});
export function readProgress():{data:Progress;warning:string} {
  try {
    const raw=localStorage.getItem(storageKey);if(!raw)return {data:emptyProgress(),warning:''};
    const parsed=JSON.parse(raw);if(parsed.version!==1||!parsed.lessons||!parsed.days)throw new Error('Unknown progress format');
    const data=emptyProgress();
    data.introductionComplete=parsed.introductionComplete===true;
    for(const lesson of lessons){const r=parsed.lessons[lesson.id];if(r&&[r.wins,r.attempts,r.hints,r.stage].every(n=>Number.isFinite(n)&&n>=0)&&typeof r.last==='string')data.lessons[lesson.id]={...r,stage:Math.min(3,r.stage),mastered:!!r.mastered};}
    for(const [day,count]of Object.entries(parsed.days))if(typeof count==='number'&&Number.isFinite(count)&&count>=0)data.days[day]=count;
    if(lessons.some(l=>l.id===parsed.current))data.current=parsed.current;
    if(parsed.daily&&typeof parsed.daily.date==='string'&&Array.isArray(parsed.daily.ids)&&Array.isArray(parsed.daily.done))data.daily={date:parsed.daily.date,ids:parsed.daily.ids.filter((id:string)=>lessons.some(l=>l.id===id)),done:parsed.daily.done.filter((id:string)=>lessons.some(l=>l.id===id))};
    return {data,warning:''};
  }catch{return {data:emptyProgress(),warning:'Saved progress could not be loaded. This session starts fresh.'};}
}
export function reviewQueue(p:Progress):string[] {
  // Review practiced skills first, with hinted and older skills ahead of confident recent ones.
  const practiced=lessons.filter(l=>p.lessons[l.id]?.wins);
  const score=(id:string)=>{const r=p.lessons[id];if(!r)return 0;const age=r.last?(Date.now()-new Date(r.last).getTime())/86400000:7;return age+r.hints*2+Math.max(0,r.attempts-r.wins)-Number(r.mastered)*2;};
  practiced.sort((a,b)=>score(b.id)-score(a.id));
  return [...practiced,...lessons.filter(l=>!practiced.includes(l))].slice(0,5).map(l=>l.id);
}
