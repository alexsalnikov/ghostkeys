import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronRight, CircleHelp, Code2, Flame, Keyboard, Leaf, Lightbulb, Play, RotateCcw, Sparkles, Target, Trophy, X, BarChart3, VolumeX } from 'lucide-react';
import { PracticeEditor, matchesGoal, type EditorHandle, type Snapshot } from './Editor';
import { categories, expandSteps, lessons, sandboxCode, type Exercise } from './lessons';
import { emptyResult, readProgress, reviewQueue, storageKey, today, type Progress } from './progress';
import { Introduction } from './Introduction';
import { TmuxApp } from './TmuxApp';
import { LearningPaths, type LearningPath } from './LearningPaths';

type Page='intro'|'practice'|'daily'|'free'|'progress';
const stages=['Learn it','Build the habit','Make it stick','From memory'];
function Ghost({large=false}:{large?:boolean}){return <svg className={large?'ghost-art':'ghost-logo'} viewBox="0 0 120 120" fill="none" aria-hidden="true"><ellipse cx="60" cy="108" rx="27" ry="5" fill="#ad86d5" opacity=".12"/><path d="M26 88V49a34 34 0 0 1 68 0v45l-14-9-14 11-14-11-14 11-12-8Z" fill="#e8dcf5"/><path d="M78 22c10 7 16 16 16 29v43l-14-9-7 6V43c0-9-1-16-5-24Z" fill="#c9b4e2"/><ellipse cx="48" cy="51" rx="4" ry="6" fill="#30263e"/><ellipse cx="72" cy="51" rx="4" ry="6" fill="#30263e"/><path d="M55 67q5 5 10 0" stroke="#30263e" strokeWidth="3" strokeLinecap="round"/><ellipse cx="37" cy="63" rx="6" ry="3" fill="#efaebd"/><ellipse cx="82" cy="63" rx="6" ry="3" fill="#efaebd"/><path d="m12 29 2-6 2 6 6 2-6 2-2 6-2-6-6-2 6-2ZM102 68l2-4 1 4 4 1-4 2-1 4-2-4-4-2 4-1Z" fill="#b79ace"/></svg>}
function Pumpkin(){return <svg viewBox="0 0 60 60" width="42" height="42" fill="none" aria-hidden="true"><path d="m30 20 2-11 7-2" stroke="#a0ba83" strokeWidth="5" strokeLinecap="round"/><ellipse cx="30" cy="37" rx="23" ry="18" fill="#da824e"/><ellipse cx="30" cy="37" rx="13" ry="18" fill="#ed985f"/><path d="m18 31 6 6H14l4-6Zm24 0 4 6H36l6-6ZM19 44l6 3 5-3 5 3 6-3-4 8H23l-4-8Z" fill="#523044"/></svg>}
const keyLabel=(key:string)=>key===' '?'Space':key==='Enter'?'↵ Enter':key==='Esc'?'esc':key.startsWith('type:')?`“${key.slice(5)}”`:key;

export default function App(){
  const [path,setPath]=useState<LearningPath>(()=>{try{return localStorage.getItem('ghostkeys.path.v1')==='tmux'?'tmux':'vim';}catch{return 'vim';}});
  function changePath(value:LearningPath){setPath(value);try{localStorage.setItem('ghostkeys.path.v1',value);}catch{/* Each path reports its own progress storage errors. */}}
  return path==='tmux'?<TmuxApp onPathChange={changePath}/>:<VimApp onPathChange={changePath}/>;
}
function VimApp({onPathChange}:{onPathChange(path:LearningPath):void}){
  const initial=useMemo(readProgress,[]),[progress,setProgress]=useState<Progress>(initial.data),[warning,setWarning]=useState(initial.warning);
  const [page,setPage]=useState<Page>(initial.data.introductionComplete||Object.keys(initial.data.lessons).length?'practice':'intro'),[lessonId,setLessonId]=useState(initial.data.current),[expanded,setExpanded]=useState(lessons.find(l=>l.id===initial.data.current)?.category??'First steps');
  const [stage,setStage]=useState(initial.data.lessons[initial.data.current]?.stage??0),[reset,setReset]=useState(0),[hint,setHint]=useState((initial.data.lessons[initial.data.current]?.stage??0)!==3),[hintUsed,setHintUsed]=useState(false),[success,setSuccess]=useState(false),[demo,setDemo]=useState(false),[demoFinished,setDemoFinished]=useState(false),[help,setHelp]=useState(false);
  const [keys,setKeys]=useState<string[]>([]),[snapshot,setSnapshot]=useState<Snapshot|null>(null),[feedback,setFeedback]=useState(''),[freeCode,setFreeCode]=useState(()=>{try{return localStorage.getItem('ghostkeys.sandbox.v1')??sandboxCode;}catch{return sandboxCode;}});
  const freeBuffer=useRef(freeCode);
  const editor=useRef<EditorHandle>(null),keysRef=useRef<string[]>([]),attempted=useRef(false),demoRef=useRef(false),successRef=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),generation=useRef(0);
  const lesson=lessons.find(l=>l.id===lessonId)??lessons[0],lessonIndex=lessons.indexOf(lesson);
  const isDaily=page==='daily',isFree=page==='free',recall=stage===3||isDaily;
  const variation=isDaily?(Number(new Date().getDate())+lessonIndex)%4:stage;
  const exercise=useMemo<Exercise>(()=>isFree?{code:freeCode,start:0,goal:{kind:'cursor',at:-1},task:'',steps:[]}:lesson.make(variation),[lessonId,variation,isFree,freeCode]);
  const expected=expandSteps(exercise.steps),mastered=lessons.filter(l=>progress.lessons[l.id]?.mastered).length;
  const fileType=exercise.language==='html'?{badge:'HTML',extension:'html',name:'HTML'}:exercise.language==='text'?{badge:'TXT',extension:'txt',name:'Plain text'}:{badge:'JS',extension:'js',name:'JavaScript'};
  const dailyDone=progress.daily.date===today()?progress.daily.done.length:0;
  const dailyComplete=isDaily&&progress.daily.ids.length>0&&dailyDone===progress.daily.ids.length;
  const instanceKey=`${page}-${lesson.id}-${stage}-${reset}`;
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(progress));}catch{setWarning('Progress could not be saved on this device. Keep this window open to retain this session.');}},[progress]);
  useEffect(()=>()=>{generation.current++;if(timer.current)clearTimeout(timer.current);},[]);
  useEffect(()=>{
    if(!help)return;
    const handle=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();setHelp(false);editor.current?.focus();}
      if(event.key==='Tab'){
        const buttons=document.querySelectorAll<HTMLButtonElement>('.help-modal button:not(:disabled)');
        const first=buttons[0],last=buttons[buttons.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',handle);return()=>document.removeEventListener('keydown',handle);
  },[help]);
  function clearAttempt(memory=false){
    generation.current++;if(timer.current)clearTimeout(timer.current);
    setReset(n=>n+1);keysRef.current=[];setKeys([]);attempted.current=false;successRef.current=false;setSuccess(false);setSnapshot(null);setFeedback('');setHint(!memory);setHintUsed(false);demoRef.current=false;setDemo(false);setDemoFinished(false);
  }
  function selectLesson(id:string,target:Page='practice',forcedStage?:number){
    const item=lessons.find(l=>l.id===id)!;const nextStage=forcedStage??(progress.lessons[id]?.mastered?0:progress.lessons[id]?.stage??0);
    setLessonId(id);setPage(target);setStage(nextStage);setExpanded(item.category);clearAttempt(nextStage===3||target==='daily');
    setProgress(p=>({...p,current:id}));
  }
  function startDaily(){
    const ids=progress.daily.date===today()&&progress.daily.ids.length?progress.daily.ids:reviewQueue(progress);
    const done=progress.daily.date===today()?progress.daily.done:[];
    setProgress(p=>({...p,daily:{date:today(),ids,done}}));
    selectLesson(ids.find(id=>!done.includes(id))??ids[0],'daily',3);
  }
  function navigate(target:Page){
    if(target==='daily'){startDaily();return;}
    if(target==='practice'){selectLesson(progress.current);return;}
    if(target==='free')setFreeCode(freeBuffer.current);
    setPage(target);clearAttempt();
  }
  function onKey(key:string){
    if(demoRef.current||successRef.current||isFree)return;
    if(!attempted.current){attempted.current=true;setProgress(p=>{const r=p.lessons[lesson.id]??emptyResult();return {...p,lessons:{...p.lessons,[lesson.id]:{...r,attempts:r.attempts+1}}};});}
    keysRef.current=[...keysRef.current,key].slice(-500);setKeys(keysRef.current);
  }
  function onSnapshot(s:Snapshot){
    setSnapshot(s);
    if(isFree){freeBuffer.current=s.text;try{localStorage.setItem('ghostkeys.sandbox.v1',s.text);}catch{setWarning('The practice buffer could not be saved.');}return;}
    if(demoRef.current||successRef.current||!attempted.current)return;
    const valid=matchesGoal(exercise.goal,s);
    const log=keysRef.current;
    const usedTechnique=log.some((_,i)=>expected.every((k,j)=>log[i+j]===k));
    if(valid&&(recall||usedTechnique)){
      successRef.current=true;setSuccess(true);setFeedback('');
      setProgress(p=>{
        const r=p.lessons[lesson.id]??emptyResult(),day=today();
        const learned=r.mastered||(stage===3&&!hintUsed&&!isDaily);
        const daily=isDaily?{...p.daily,done:[...new Set([...p.daily.done,lesson.id])]}:p.daily;
        return {...p,daily,days:{...p.days,[day]:(p.days[day]??0)+1},lessons:{...p.lessons,[lesson.id]:{...r,wins:r.wins+1,last:new Date().toISOString(),mastered:learned,stage:isDaily?r.stage:Math.min(stage+1,3)}}};
      });
    } else if(valid&&!usedTechnique)setFeedback('That result is right. For this guided drill, try the key sequence below.');
    else if(log.length>=expected.length&&s.mode==='normal')setFeedback(exercise.goal.kind==='document'?'Not quite the target edit. Undo with u, keep trying, or reset the exercise.':'Keep going—you have not reached the target yet.');
  }
  function next(){
    if(isDaily){const id=progress.daily.ids.find(id=>!progress.daily.done.includes(id));if(id)selectLesson(id,'daily',3);return;}
    if(stage<3){setStage(s=>s+1);clearAttempt(stage+1===3);return;}
    if(hintUsed){clearAttempt(true);return;}
    selectLesson(lessons[(lessonIndex+1)%lessons.length].id);
  }
  useEffect(()=>{
    if((!success&&!dailyComplete)||help||(page!=='practice'&&page!=='daily'))return;
    const advance=(event:KeyboardEvent)=>{
      if(event.key!=='Enter'||event.repeat||event.isComposing||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return;
      // Let other controls keep their native Enter behavior when reached with Tab.
      const target=event.target instanceof Element?event.target:null;
      if(target?.closest('button,a,input,textarea,select,[role="button"]')&&!target.closest('[data-continue],.editor-host'))return;
      event.preventDefault();event.stopPropagation();
      if(!successRef.current&&!dailyComplete)return;
      successRef.current=false;
      if(dailyComplete)navigate('practice');else next();
    };
    // Capture before the completed editor's input lock. A search-confirming Enter
    // reaches this phase before it completes the exercise, so cannot advance it.
    window.addEventListener('keydown',advance,true);
    return()=>window.removeEventListener('keydown',advance,true);
  });
  function revealHint(){
    const next=!hint;setHint(next);
    if(next&&recall&&!hintUsed){setHintUsed(true);setProgress(p=>{const r=p.lessons[lesson.id]??emptyResult();return {...p,lessons:{...p.lessons,[lesson.id]:{...r,hints:r.hints+1}}};});}
    editor.current?.focus();
  }
  function runDemo(){
    clearAttempt();demoRef.current=true;setDemo(true);setHint(true);
    const g=generation.current;let index=0;
    const tick=()=>{if(g!==generation.current)return;if(index>=expected.length){setDemoFinished(true);return;}const key=expected[index++];editor.current?.press(key);setKeys(expected.slice(0,index));timer.current=setTimeout(tick,key.length===1?370:650);};
    timer.current=setTimeout(tick,350);
  }
  let matched=0;for(let len=Math.min(keys.length,expected.length);len>0;len--){if(expected.slice(0,len).every((k,i)=>keys[keys.length-len+i]===k)){matched=len;break;}}
  const stepsProgress=exercise.steps.map((s,i)=>{const before=expandSteps(exercise.steps.slice(0,i)).length,count=expandSteps([s]).length;return matched>=before+count?'done':matched>=before?'current':'';});
  const totals=Object.values(progress.lessons).reduce((a,r)=>({wins:a.wins+r.wins,attempts:a.attempts+r.attempts}),{wins:0,attempts:0});

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e=>{e.preventDefault();navigate('practice');}}><Ghost/><span>ghostkeys<span className="brand-dot">.</span><small>YOUR VIM PRACTICE SPACE</small></span></a>
      <LearningPaths current="vim" onChange={onPathChange}/>
      <nav className="main-nav" aria-label="Practice modes">
        <button className={page==='practice'?'nav-item active':'nav-item'} onClick={()=>navigate('practice')}><BookOpen size={18}/>Continue learning<ChevronRight size={15}/></button>
        <button className={page==='daily'?'nav-item active':'nav-item'} onClick={startDaily}><Flame size={18}/>Daily practice<span className="nav-tag">5 MIN</span></button>
      </nav>
      <div className="sidebar-label">YOUR LEARNING PATH <span>{mastered}/{lessons.length}</span></div>
      <div className="course-list">
        <button className={'course-toggle intro-link '+(page==='intro'?'open':'')} aria-current={page==='intro'?'page':undefined} onClick={()=>navigate('intro')}><span className={'course-number '+(progress.introductionComplete?'complete':'')}>{progress.introductionComplete?<Check size={13}/>:'01'}</span><span>Vim essentials<small>Modes, copy, save & quit</small></span><ChevronRight size={14}/></button>
        {categories.map((category,index)=>{const group=lessons.filter(l=>l.category===category),count=group.filter(l=>progress.lessons[l.id]?.mastered).length;return <div className="course" key={category}>
          <button className={'course-toggle '+(expanded===category?'open':'')} aria-expanded={expanded===category} onClick={()=>setExpanded(expanded===category?'':category)}><span className={'course-number '+(count===group.length?'complete':'')}>{count===group.length?<Check size={13}/>:String(index+2).padStart(2,'0')}</span><span>{category}<small>{count} of {group.length} learned</small></span><ChevronDown size={14}/></button>
          {expanded===category&&<div className="lesson-links">{group.map(l=><button key={l.id} data-testid={`lesson-${l.id}`} className={'lesson-link '+(l.id===lessonId&&page==='practice'?'selected':'')} onClick={()=>selectLesson(l.id)}><span className="lesson-mark">{progress.lessons[l.id]?.mastered?<Check size={12}/>:l.id===lessonId?'•':'·'}</span>{l.title}</button>)}</div>}
        </div>})}
      </div>
      <nav className="secondary-nav" aria-label="Other spaces"><button className={'nav-item '+(page==='free'?'active':'')} onClick={()=>navigate('free')}><Code2 size={18}/>Free practice</button><button className={'nav-item '+(page==='progress'?'active':'')} onClick={()=>navigate('progress')}><BarChart3 size={18}/>My progress</button></nav>
      <div className="sidebar-note"><div className="tiny-spark">✧</div><p>A little practice.<br/><strong>A lot more Vim.</strong></p><span>Make yourself at home.</span><Ghost large/></div>
      <div className="sidebar-foot"><span className="status-dot"/>Local & offline<span>v1.0</span></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><span className="breadcrumb">Your practice space</span><ChevronRight size={13}/><span>{page==='intro'?'Vim essentials':page==='practice'?lesson.category:page==='daily'?'Daily practice':page==='free'?'Free practice':'My progress'}</span></div><div className="topbar-right"><span className="today-count"><Flame size={15}/>{progress.days[today()]??0} today</span><button className="icon-button" aria-label="Help and keyboard tips" onClick={()=>setHelp(true)}><CircleHelp size={19}/></button></div></header>
      {warning&&<div className="warning" role="alert">{warning}<button aria-label="Dismiss warning" onClick={()=>setWarning('')}><X size={15}/></button></div>}

      {page==='intro'?<Introduction onPracticeCopy={()=>selectLesson('copy-all')} onComplete={()=>{setProgress(p=>({...p,introductionComplete:true}));selectLesson(lessons[0].id);}}/>:page==='progress'?<div className="workspace progress-page"><div className="eyebrow"><Sparkles size={15}/> SMALL STEPS, REAL SKILLS</div><h1>Look how far you’ve come<span>.</span></h1><p className="intro">Every little repetition makes the next edit feel more natural.</p><div className="stats-grid"><Stat label="Skills learned" value={`${mastered} / ${lessons.length}`} icon={<Trophy/>}/><Stat label="Successful exercises" value={totals.wins} icon={<Target/>}/><Stat label="Days practiced" value={Object.keys(progress.days).length} icon={<Flame/>}/></div><section className="panel progress-panel"><div className="section-heading"><h2>Your last seven days</h2><span>Successful exercises</span></div><div className="activity">{Array.from({length:7},(_,i)=>{const date=new Date();date.setDate(date.getDate()-6+i);const key=date.toLocaleDateString('en-CA'),n=progress.days[key]??0;return <div key={key}><span>{n}</span><div className="activity-track"><div style={{height:`${Math.max(5,Math.min(100,n*10))}%`}} className={n?'filled':''}/></div><small>{date.toLocaleDateString(undefined,{weekday:'short'})}</small></div>;})}</div></section><section className="panel progress-panel"><div className="section-heading"><h2>Your skills</h2><button className="text-button" onClick={startDaily}>Practice what needs a little love <ArrowRight size={15}/></button></div><div className="skill-table"><div className="skill-table-head"><span>SKILL</span><span>COMMAND</span><span>STATUS</span></div>{lessons.map(l=>{const r=progress.lessons[l.id];return <button key={l.id} onClick={()=>selectLesson(l.id)}><span>{l.title}</span><code>{l.command}</code><span className={r?.mastered?'learned':'muted'}>{r?.mastered?'✓ Learned':r?.wins?`${r.stage}/4 steps`:'Not started'}</span></button>;})}</div></section></div>:
      dailyComplete?<div className="workspace daily-finished"><Ghost large/><div className="eyebrow">A LITTLE BETTER THAN YESTERDAY</div><h1>Your daily practice is done<span>.</span></h1><p>Five skills revisited. Let them settle, and come back tomorrow.</p><button className="primary-button" autoFocus data-continue aria-keyshortcuts="Enter" onClick={()=>navigate('practice')}>Keep learning <kbd className="continue-key" aria-hidden="true">↵</kbd></button><button className="text-button" onClick={()=>navigate('progress')}>See my progress</button></div>:
      <div className="workspace training-workspace">
        <div className="lesson-topline"><div className="eyebrow"><span className="little-diamond"/> {isFree?'ROOM TO EXPERIMENT':isDaily?'FIVE MINUTES FOR YOUR FUTURE SELF':`CHAPTER ${String(categories.indexOf(lesson.category)+2).padStart(2,'0')} · ${lesson.category.toUpperCase()}`}</div><span className="lesson-count">{isFree?'NO SCORES. NO PRESSURE.':isDaily?`${dailyDone} / 5 reviewed`:`Lesson ${lessonIndex+1} of ${lessons.length}`}</span></div>
        <div className="title-row"><div><h1>{isFree?'A space to make mistakes':lesson.title}<span>.</span></h1><p className="intro">{isFree?'Try a command. Undo it. Follow your curiosity. Your scratchpad is saved automatically.':lesson.description}</p></div><div className="lesson-badge">{isFree?<Code2 size={25}/>:<Keyboard size={25}/>}</div></div>
        {!isFree&&<div className="stage-track" aria-label="Lesson stages">{stages.map((name,i)=><div key={name} className={i===stage?'current':i<stage?'passed':''}><span>{i<stage?<Check size={12}/>:i+1}</span>{name}{i===3&&<Sparkles size={12}/>}</div>)}</div>}

        <section className="practice-panel" aria-label="Practice exercise">
          <div className="task-bar"><span className="task-symbol">{isFree?<Code2 size={18}/>:<Target size={18}/>}</span><div><span className="mini-label">{isFree?'YOUR SCRATCHPAD':demo?'WATCH THE KEYS':'YOUR TASK'}</span><p>{isFree?'Write something wonderful. Or just practice ciw.':exercise.task}</p></div>{!isFree&&<button className="icon-button" title="Reset exercise" aria-label="Reset exercise" onClick={()=>clearAttempt(recall)}><RotateCcw size={16}/></button>}</div>
          <div className="file-bar"><span><span className="js-badge">{fileType.badge}</span>{isFree?'playground.js':`midnight.${fileType.extension}`}<span className="file-dot"/></span><span className="file-caption">{demo?'Demonstration':isFree?'Saved on this device':'A safe place to practice'}</span></div>
          <div className="editor-region"><PracticeEditor ref={editor} exercise={exercise} instanceKey={instanceKey} onSnapshot={onSnapshot} onKey={onKey} locked={success||demo}/>{success&&<div className="editor-success"><Check size={14}/> Nicely done</div>}</div>
          <div className="editor-status"><span className={'mode-badge '+(snapshot?.mode??'normal').split(' ')[0]} data-testid="vim-mode">{(snapshot?.mode??'normal').toUpperCase()}</span><span>Ln {snapshot?.line??1}, Col {snapshot?.column??1}</span><span className="editor-status-right">{fileType.name}<span>UTF-8</span><span>Vim</span></span></div>
        </section>

        {isFree?<div className="free-guide panel"><Lightbulb size={20}/><div><strong>Your cheat sheet, just in case</strong><p><code>Esc</code> Normal mode <span>·</span> <code>u</code> Undo <span>·</span> <code>ciw</code> Change word <span>·</span> <code>/</code> Search <span>·</span> <code>.</code> Repeat</p></div></div>:
        <section className={'key-panel '+(success?'is-success':'')} aria-label="Key guidance">
          <div className="key-panel-header"><span className="mini-label">{success?'THAT’S THE FEELING':demo?'WATCH & LEARN':recall?'A LITTLE LESS HELP. A LITTLE MORE YOU.':'YOUR NEXT LITTLE SPELL'}</span><button className="text-button" onClick={revealHint} disabled={demo||success}><Lightbulb size={14}/>{hint?'Hide hint':'Show hint'}</button></div>
          {success?<div className="success-content" role="status" data-testid="success"><div className="success-check"><Check size={23}/></div><div><h2>{isDaily?'One more skill, refreshed.':stage===3&&!hintUsed?'You know this one by heart.':'You’ve got it. Let’s make it stick.'}</h2><p>{stage===3&&hintUsed?'A hint helped this time. Try once more from memory to learn this skill.':stage===3?'Small steps add up. Take that confidence to your next lesson.':'A fresh example is waiting. Same command, a little more confidence.'}</p><p className="continue-hint">Press Enter to continue</p></div><button className="primary-button" data-continue aria-keyshortcuts="Enter" onClick={next}>{isDaily?'Next review':stage===3?(hintUsed?'Try from memory':'Next lesson'):'Next repetition'}<kbd className="continue-key" aria-hidden="true">↵</kbd></button></div>:
          <><div className={'key-sequence '+(!hint?'hidden-sequence':'')}>{hint?exercise.steps.map((key,i)=><div className="key-step" key={`${key}-${i}`}><kbd className={stepsProgress[i]+(key.startsWith('type:')?' text-key':'')}>{key.startsWith('Ctrl+')?<><small>ctrl</small><span>+</span>{key.slice(5)}</>:keyLabel(key)}</kbd>{i<exercise.steps.length-1&&<span className="key-arrow">→</span>}</div>):<><span className="memory-symbol"><Sparkles size={25}/></span><p>You’ve practiced this. Trust your fingers.</p></>}</div><p className="key-explanation">{hint?lesson.tip:'Complete the task above. Your hint is here if you need it.'}</p></>}
          <div className="key-panel-footer"><div className="repetition-dots">{[0,1,2,3].map(i=><span key={i} className={i<stage||success&&i===stage?'filled':i===stage?'current':''}>{i<stage||success&&i===stage?<Check size={10}/>:null}</span>)}<span>{isDaily?'Daily recall':`Repetition ${stage+1} of 4`}</span></div>{!success&&(demo?<button className="text-button" onClick={()=>clearAttempt(recall)}>{demoFinished?'Now you try':'Stop demonstration'}<ArrowRight size={14}/></button>:<button className="text-button" onClick={runDemo}><Play size={13}/>{recall?'Need a demonstration?':'Watch it first'}</button>)}</div>
          {!success&&feedback&&<div className="feedback" role="status">{feedback}</div>}
          {!success&&keys.length>0&&<div className="pressed-keys"><span>{demo?'DEMO':'YOU PRESSED'}</span>{keys.slice(-16).map((k,i)=><code key={i}>{keyLabel(k)}</code>)}</div>}
        </section>}
        <footer className="workspace-footer"><span><Leaf size={14}/> Progress over perfection. Always.</span><span><VolumeX size={14}/> A quiet corner of the internet</span></footer>
        {!isFree&&!isDaily&&<div className="lesson-navigation"><button className="text-button" disabled={lessonIndex===0} onClick={()=>selectLesson(lessons[lessonIndex-1].id)}><ArrowLeft size={14}/> Previous lesson</button><button className="text-button" disabled={lessonIndex===lessons.length-1} onClick={()=>selectLesson(lessons[lessonIndex+1].id)}>Explore next lesson <ArrowRight size={14}/></button></div>}
      </div>}
    </main>
    {help&&<div className="modal-backdrop" onClick={()=>setHelp(false)}><section className="help-modal panel" role="dialog" aria-modal="true" aria-label="Welcome to GhostKeys" onClick={e=>e.stopPropagation()}><button className="icon-button modal-close" aria-label="Close help" autoFocus onClick={()=>setHelp(false)}><X/></button><Ghost large/><h2>A little practice. A lot more Vim.</h2><p>Click the editor to give it keyboard focus. Commands act on the code, just as they do in Vim.</p><ul><li>Start with three guided variations, then try from memory.</li><li><kbd>Esc</kbd> returns to Normal mode. <kbd>u</kbd> undoes a change.</li><li>Keycaps with arrows are pressed in sequence. <kbd>Ctrl+r</kbd> is held together.</li><li>Use “Watch it first” for a demonstration. Demos never count as completed practice.</li><li>Daily practice revisits five skills, prioritizing ones that needed hints.</li><li>Your progress and scratchpad stay on this device. No account needed.</li></ul><div className="help-note"><Pumpkin/><span>Learned means you completed the final recall without a hint. Take all the time you need.</span></div><button className="primary-button" onClick={()=>{setHelp(false);editor.current?.focus();}}>Let’s practice <ArrowRight size={16}/></button></section></div>}
  </div>;
}
function Stat({label,value,icon}:{label:string;value:string|number;icon:React.ReactNode}){return <div className="stat-card panel">{icon}<strong>{value}</strong><span>{label}</span></div>}
