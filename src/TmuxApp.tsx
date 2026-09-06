import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, RotateCcw, Terminal, Play } from 'lucide-react';
import { LearningPaths, type LearningPath } from './LearningPaths';
import { activeSession, activeWindow, tmuxKey, type Layout, type TmuxState, type TmuxWindow } from './tmuxModel';
import { expandTmux, tmuxGroups, tmuxLessons, type TmuxLesson } from './tmuxLessons';
import { emptyResult, type Result } from './progress';
import './tmux.css';

export const tmuxStorageKey='ghostkeys.tmux.v1';
interface TmuxProgress {version:1;current:string;overview:boolean;lessons:Record<string,Result>}
function readTmux():{data:TmuxProgress;warning:string}{
  const data:TmuxProgress={version:1,current:tmuxLessons[0].id,overview:true,lessons:{}};
  try{
    const raw=localStorage.getItem(tmuxStorageKey);if(!raw)return {data,warning:''};
    const saved=JSON.parse(raw);if(saved.version!==1||!saved.lessons)throw new Error();
    if(tmuxLessons.some(l=>l.id===saved.current))data.current=saved.current;
    data.overview=saved.overview!==false;
    for(const lesson of tmuxLessons){const r=saved.lessons[lesson.id];if(r&&[r.stage,r.wins,r.attempts,r.hints].every(n=>Number.isFinite(n)&&n>=0)&&typeof r.last==='string')data.lessons[lesson.id]={...r,stage:Math.min(3,Math.floor(r.stage)),mastered:r.mastered===true};}
    return {data,warning:''};
  }catch{return {data,warning:'Saved tmux progress could not be loaded. This path starts fresh.'};}
}
const label=(key:string)=>key==='ArrowLeft'?'←':key==='ArrowRight'?'→':key==='ArrowUp'?'↑':key==='ArrowDown'?'↓':key.startsWith('type:')?key.slice(5):key===' '?'Space':key;

function Panes({layout,window,input}:{layout:Layout;window:TmuxWindow;input:string}){
  if('pane'in layout){const pane=window.panes.find(p=>p.id===layout.pane)!;return <div className={'tmux-pane '+(window.active===pane.id?'active':'')} data-testid={`tmux-pane-${pane.id}`}>
    <span className="tmux-pane-title">pane {pane.id} · {pane.program}</span>
    <code>{pane.program.startsWith('lantern')?'✧ lantern watch: the flame is steady':'~ $ '+(pane.id===window.active?input:'')}</code>
    {pane.id===window.active&&<span className="tmux-caret" aria-hidden="true">▌</span>}
  </div>;}
  return <div className={'tmux-split '+layout.direction}><Panes layout={layout.first} window={window} input={input}/><Panes layout={layout.second} window={window} input={input}/></div>;
}
function TerminalView({state}:{state:TmuxState}){
  const session=activeSession(state),window=activeWindow(state);
  const prompt=state.mode==='rename-session'?'rename-session':state.mode==='rename-window'?'rename-window':state.mode==='command'?':':null;
  return <>
    <div className="tmux-terminal-meta"><span data-testid="tmux-attachment">{session?'ATTACHED · '+session.name:'OUTSIDE TMUX · SHELL'}</span><span>{state.prefix?'PREFIX READY · release Ctrl, then press the key':'Default prefix: Ctrl+b'}</span></div>
    <div className="tmux-screen">
      {state.mode==='sessions'?<div className="tmux-overlay" aria-label="Session chooser">{state.sessions.map((s,i)=><div key={s.name} className={i===state.selected?'chosen':''}>{i===state.selected?'›':' '} {s.name} · {s.windows.length} window(s)</div>)}<small>↑ ↓ select · Enter switch · q cancel</small></div>:
      state.mode==='help'?<div className="tmux-overlay" aria-label="tmux shortcut list"><strong>COMMON DEFAULT BINDINGS</strong><div className="tmux-help-grid">{['d — detach','c — new window','n / p — next / previous window','% — split left / right','" — split top / bottom','arrows / o — focus pane','z — toggle zoom','x / & — close pane / window','s — session chooser','[ — history',': — command prompt','? — this help'].map(text=><span key={text}>Ctrl+b → {text}</span>)}</div><small>q returns to the terminal</small></div>:
      state.mode==='copy'?<div className="tmux-overlay" aria-label="Terminal history"><strong>HISTORY · {state.scroll} lines up</strong>{['The ghost lit the first candle.','The lantern watch started.','A wisp passed through the attic.','The flame is still steady.'].slice(0,4-Math.min(2,state.scroll)).map(text=><div key={text}>{text}</div>)}<small>↑ ↓ move · q returns to live output</small></div>:
      window?<Panes layout={window.zoom?{pane:window.active}:window.layout} window={window} input={state.mode==='terminal'?state.input:''}/>:<div className="tmux-outside"><span>Ordinary shell · same machine as the tmux server</span><code>$ {state.input}<span className="tmux-caret">▌</span></code><p>{state.sessions.length?`${state.sessions.length} session(s) still running: ${state.sessions.map(s=>s.name).join(', ')}`:'No tmux sessions are running yet.'}</p></div>}
    </div>
    {prompt&&<div className="tmux-prompt">{prompt} {state.input}▌ <small>Enter confirms · Esc cancels</small></div>}
    {state.mode.startsWith('confirm-')&&<div className="tmux-prompt">Close this {state.mode==='confirm-pane'?'pane':'window'} and its program{state.mode==='confirm-window'?'s':''}? (y/n)</div>}
    {session&&<div className="tmux-status"><strong>[{session.name}]</strong>{session.windows.map(w=><span key={w.id} className={w.id===session.active?'current':''}>{w.id}:{w.name}{w.id===session.active?'*':''}{w.zoom?'Z':''}</span>)}</div>}
    <div className="tmux-output" role="status">{state.log.at(-1)??'Focus is here. Practice the task with your keyboard.'}</div>
  </>;
}

function TmuxDrill({lesson,stage,onWin,onNext,onReset,onAttempt}:{lesson:TmuxLesson;stage:number;onWin(hinted:boolean):void;onNext(hinted:boolean):void;onReset():void;onAttempt():void}){
  const exercise=useMemo(()=>lesson.make(stage),[lesson,stage]);
  const [state,setState]=useState(exercise.initial),stateRef=useRef(state),host=useRef<HTMLDivElement>(null);
  const [success,setSuccess]=useState(false),successRef=useRef(false),[hint,setHint]=useState(stage!==3),hinted=useRef(false),attempted=useRef(false);
  const [keys,setKeys]=useState<string[]>([]),keysRef=useRef<string[]>([]),[feedback,setFeedback]=useState('');
  const [demo,setDemo]=useState(false),demoRef=useRef(false),[demoDone,setDemoDone]=useState(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const expected=expandTmux(exercise.steps);
  let matched=0;
  for(let length=Math.min(keys.length,expected.length);length>0;length--)if(expected.slice(0,length).every((key,i)=>keys[keys.length-length+i]===key)){matched=length;break;}
  useEffect(()=>{host.current?.focus();return ()=>{if(timer.current)clearTimeout(timer.current);};},[]);
  function apply(key:string){
    if(!demoRef.current&&!attempted.current){attempted.current=true;onAttempt();}
    const next=tmuxKey(stateRef.current,key);stateRef.current=next;setState(next);
    const log=[...keysRef.current,key].slice(-500);keysRef.current=log;setKeys(log);
    if(demoRef.current)return;
    const valid=next.mode==='terminal'&&!next.prefix&&!next.input&&exercise.goal(next);
    const technique=log.some((_,i)=>expected.every((k,j)=>log[i+j]===k));
    if(valid&&(stage===3||technique)){successRef.current=true;setSuccess(true);onWin(hinted.current);}
    else if(valid)setFeedback('That works. For this guided repetition, practice the sequence shown below.');
  }
  function demonstrate(){
    demoRef.current=true;setDemo(true);setHint(true);setState(exercise.initial);stateRef.current=exercise.initial;keysRef.current=[];setKeys([]);setFeedback('');
    let i=0;const tick=()=>{if(i===expected.length){setDemoDone(true);return;}apply(expected[i++]);timer.current=setTimeout(tick,expected[i-1].length===1?95:370);};timer.current=setTimeout(tick,200);host.current?.focus();
  }
  return <>
    <div className="stage-track" aria-label="tmux lesson stages">{['Learn it','Build the habit','Make it stick','From memory'].map((name,i)=><div className={i===stage?'current':i<stage?'passed':''} key={name}><span>{i+1}</span>{name}</div>)}</div>
    <section className="practice-panel tmux-practice" aria-label="tmux practice exercise">
      <div className="task-bar"><Terminal size={18}/><div><span className="mini-label">{demo?'DEMONSTRATION':'YOUR TASK'}</span><p>{exercise.task}</p></div><button className="icon-button" aria-label="Reset tmux exercise" onClick={onReset}><RotateCcw size={16}/></button></div>
      <div ref={host} className="tmux-terminal" role="textbox" aria-label="Simulated tmux terminal" aria-multiline="true" tabIndex={0} onKeyDown={event=>{
        if(event.key==='Tab'||['Shift','Control','Alt','Meta'].includes(event.key)||event.altKey||event.metaKey||event.nativeEvent.isComposing)return;
        event.preventDefault();if(event.repeat||demoRef.current)return;
        if(successRef.current){if(event.key==='Enter'&&!event.ctrlKey&&!event.shiftKey){successRef.current=false;onNext(hinted.current);}return;}
        apply(event.key==='Escape'?'Esc':event.ctrlKey?'Ctrl+'+event.key.toLowerCase():event.key);
      }}><TerminalView state={state}/></div>
    </section>
    <section className="panel key-panel tmux-guidance" aria-label="tmux key guidance">
      {success?<div className="success-message" data-testid="tmux-success"><Check size={26}/><div><h2>{stage===3&&!hinted.current?'Another tmux skill learned.':'The little haunt is in order.'}</h2><p>Press Enter to continue.</p></div><button className="primary-button" onClick={()=>onNext(hinted.current)}>{stage<3?'Next repetition':hinted.current?'Try from memory':'Next lesson'} ↵</button></div>:<>
        <div className="key-panel-heading"><span className="mini-label">{stage===3?'FROM MEMORY':'YOUR NEXT LITTLE SPELL'}</span><button className="text-button" disabled={demo} onClick={()=>{setHint(!hint);if(!hint&&stage===3)hinted.current=true;host.current?.focus();}}>{hint?'Hide hint':'Show hint'}</button></div>
        {hint?<><div className="key-sequence">{exercise.steps.map((key,i)=>{const before=expandTmux(exercise.steps.slice(0,i)).length,count=expandTmux([key]).length;return <div className="key-step" key={i}><kbd className={(key.startsWith('type:')?'text-key ':'')+(matched>=before+count?'done':matched>=before?'current':'')}>{label(key)}</kbd>{i<exercise.steps.length-1&&<span className="key-arrow">→</span>}</div>;})}</div><p className="key-explanation">{lesson.tip}</p></>:<p className="key-explanation">Complete the task from memory. Reveal the hint whenever you need it.</p>}
        {feedback&&<p className="feedback" role="status">{feedback}</p>}
        <div className="tmux-guidance-footer"><span>Repetition {stage+1} of 4</span>{demo?<button className="text-button" onClick={onReset}>{demoDone?'Now you try':'Stop demonstration'}</button>:<button className="text-button" onClick={demonstrate}><Play size={13}/>Watch it first</button>}</div>
        {keys.length>0&&<div className="pressed-keys"><span>{demo?'DEMO':'YOU PRESSED'}</span>{keys.slice(-12).map((key,i)=><code key={i}>{label(key)}</code>)}</div>}
      </>}
    </section>
  </>;
}

export function TmuxApp({onPathChange}:{onPathChange(path:LearningPath):void}){
  const initial=useMemo(readTmux,[]),[progress,setProgress]=useState(initial.data),[warning,setWarning]=useState(initial.warning);
  const [stage,setStage]=useState(initial.data.lessons[initial.data.current]?.stage??0),[reset,setReset]=useState(0);
  const lesson=tmuxLessons.find(l=>l.id===progress.current)!,index=tmuxLessons.indexOf(lesson),[expanded,setExpanded]=useState(lesson.group);
  const learned=tmuxLessons.filter(l=>progress.lessons[l.id]?.mastered).length;
  useEffect(()=>{try{localStorage.setItem(tmuxStorageKey,JSON.stringify(progress));}catch{setWarning('Tmux progress could not be saved. Keep this window open to retain this session.');}},[progress]);
  function choose(id:string){const target=tmuxLessons.find(l=>l.id===id)!;setStage(progress.lessons[id]?.mastered?0:progress.lessons[id]?.stage??0);setExpanded(target.group);setReset(n=>n+1);setProgress(p=>({...p,current:id,overview:false}));}
  function win(hinted:boolean){setProgress(p=>{const old=p.lessons[lesson.id]??emptyResult();return {...p,lessons:{...p.lessons,[lesson.id]:{...old,wins:old.wins+1,hints:old.hints+Number(hinted),stage:Math.min(stage+1,3),mastered:old.mastered||(stage===3&&!hinted),last:new Date().toISOString()}}};});}
  function next(hinted:boolean){if(stage<3){setStage(stage+1);setReset(n=>n+1);}else if(hinted)setReset(n=>n+1);else choose(tmuxLessons[(index+1)%tmuxLessons.length].id);}
  return <div className="app-shell tmux-app">
    <aside className="sidebar"><a className="brand" href="#" onClick={e=>{e.preventDefault();setProgress(p=>({...p,overview:true}));}}><img className="ghost-logo" src="./ghost.png" alt=""/><span>ghostkeys<span className="brand-dot">.</span><small>YOUR TERMINAL PRACTICE</small></span></a>
      <LearningPaths current="tmux" onChange={onPathChange}/>
      <nav className="main-nav" aria-label="tmux practice modes"><button className={'nav-item '+(progress.overview?'active':'')} onClick={()=>setProgress(p=>({...p,overview:true}))}><Terminal size={18}/>Why tmux?</button><button className="nav-item" onClick={()=>choose(progress.current)}>Continue tmux<ArrowRight size={15}/></button></nav>
      <div className="sidebar-label">TMUX LEARNING PATH <span>{learned}/{tmuxLessons.length}</span></div>
      <div className="course-list">{tmuxGroups.map((group,i)=><div className="course" key={group}><button className={'course-toggle '+(expanded===group?'open':'')} aria-expanded={expanded===group} onClick={()=>setExpanded(expanded===group?'':group)}><span className="course-number">{String(i+1).padStart(2,'0')}</span><span>{group}<small>{tmuxLessons.filter(l=>l.group===group&&progress.lessons[l.id]?.mastered).length} learned</small></span><ChevronDown size={14}/></button>{expanded===group&&<div className="lesson-links">{tmuxLessons.filter(l=>l.group===group).map(l=><button className={'lesson-link '+(l.id===lesson.id&&!progress.overview?'selected':'')} data-testid={'tmux-lesson-'+l.id} key={l.id} onClick={()=>choose(l.id)}><span className="lesson-mark">{progress.lessons[l.id]?.mastered?'✓':'·'}</span>{l.title}</button>)}</div>}</div>)}</div>
      <div className="sidebar-foot"><span className="status-dot"/>Local simulation<span>tmux</span></div>
    </aside>
    <main className="main-content"><header className="topbar"><span>tmux · {progress.overview?'Your terminal, kept together':lesson.group}</span><span>{learned} / {tmuxLessons.length} learned</span></header>
      {warning&&<div className="warning" role="alert">{warning}</div>}
      {progress.overview?<div className="workspace tmux-overview"><div className="eyebrow">A SEPARATE PATH · SAME FRIENDLY GHOSTS</div><h1>Keep your terminal haunt alive.</h1><p className="intro">tmux is a terminal multiplexer: several shells and programs share one terminal, organized into sessions, windows, and panes.</p>
        <div className="tmux-overview-grid"><section className="panel"><h2>Why use it?</h2><p>Keep an editor, server logs, and a shell together. Detach and come back later. On a remote machine, tmux lets your programs survive a dropped SSH connection.</p><p>Reconnect to that same machine, then attach to the session. tmux does not replace SSH, save your files, or keep programs alive through a reboot.</p></section>
          <section className="panel"><h2>A little house for your work</h2><div className="tmux-concept"><strong>Session: ghost</strong><div>Window 0: editor<div>Pane: Vim</div></div><div>Window 1: watch<div>Pane: server logs · Pane: shell</div></div></div><p>One session holds windows. Each window holds one or more panes. Each pane runs a terminal program.</p></section></div>
        <section className="panel tmux-quickstart"><h2>Leave and return</h2><div><code>tmux new -s ghost</code><span>Start from your shell</span></div><div><code>Ctrl+b → d</code><span>Detach; programs keep running</span></div><div><code>tmux ls</code><span>Find existing sessions</span></div><div><code>tmux attach -t ghost</code><span>Return from the shell</span></div></section>
        <p className="tmux-note">Shortcuts use default tmux bindings. Press Ctrl+b together, release both keys, then press the next key. Your personal tmux configuration may use a different prefix.</p>
        <div className="tmux-overview-footer"><span>{tmuxLessons.length} lessons · four repetitions each · separate saved progress<br/>Practice is simulated; your real sessions are untouched.</span><button className="primary-button" autoFocus onClick={()=>choose(progress.current)}>Start tmux practice<ArrowRight size={16}/></button></div>
      </div>:<div className="workspace training-workspace tmux-workspace"><div className="lesson-topline"><div className="eyebrow">TMUX · {lesson.group.toUpperCase()}</div><span className="lesson-count">Lesson {index+1} of {tmuxLessons.length}</span></div><div className="title-row"><div><h1>{lesson.title}.</h1><p className="intro">{lesson.description}</p></div></div>
        <TmuxDrill key={`${lesson.id}-${stage}-${reset}`} lesson={lesson} stage={stage} onWin={win} onNext={next} onReset={()=>setReset(n=>n+1)} onAttempt={()=>setProgress(p=>{const r=p.lessons[lesson.id]??emptyResult();return {...p,lessons:{...p.lessons,[lesson.id]:{...r,attempts:r.attempts+1}}};})}/>
        <div className="lesson-navigation"><button className="text-button" disabled={index===0} onClick={()=>choose(tmuxLessons[index-1].id)}><ArrowLeft size={14}/>Previous tmux lesson</button><button className="text-button" disabled={index===tmuxLessons.length-1} onClick={()=>choose(tmuxLessons[index+1].id)}>Explore next tmux lesson<ArrowRight size={14}/></button></div>
      </div>}
    </main>
  </div>;
}
