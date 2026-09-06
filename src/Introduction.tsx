import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Keyboard } from 'lucide-react';

const pages = [
  { title: 'Normal mode is home', mode: 'NORMAL', description: 'Vim gives the same keys different jobs depending on the mode. You start in Normal mode: keys move the cursor or act on text.', keys: ['Esc'], action: 'Return to Normal mode', detail: 'Use h j k l to move, w to jump a word, and u to undo. These keys are commands here; they do not type letters.', note: 'Lost track of your mode? Press Esc. Pressing it again is fine.' },
  { title: 'Insert mode is for writing', mode: 'INSERT', description: 'Enter Insert mode when you want to type text, just like in a regular text editor.', keys: ['i', 'type your text', 'Esc'], action: 'Write, then return home', detail: 'From Normal mode, i inserts before the cursor. a inserts after it, and o opens a new line below. Esc finishes writing and returns to Normal mode.', note: 'If letters appear when you meant to move, you are probably in Insert mode.' },
  { title: 'Visual mode selects text', mode: 'VISUAL', description: 'Select text first, then choose what to do with it. Your selection grows as you move the cursor.', keys: ['v', 'w', 'Esc'], action: 'Select toward the next word, then cancel', detail: 'From Normal mode, v selects characters, Shift+v selects whole lines, and Ctrl+v selects a rectangular block. Move with h j k l or word motions.', note: 'With a selection active, y copies it and d deletes it. Esc cancels the selection.' },
  { title: 'Command-line mode gives instructions', mode: 'COMMAND-LINE', description: 'From Normal mode, type : to open the command line at the bottom of Vim. Type a command, then press Enter to run it.', keys: ['Esc', ':', 'w', 'Enter'], action: 'Save the current file', detail: ':w writes (saves) your file. :q quits the current window. :wq saves and quits. Esc cancels a command before you run it.', note: 'Normal mode is sometimes called command mode. Here, “command-line mode” specifically means the : prompt.' },
  { title: 'Copy the whole spellbook', mode: 'COPY EVERYTHING', description: 'Keep this sequence close: Esc, then ggVGy copies the whole current file into a Vim register.', keys: ['Esc', 'gg', 'V', 'G', 'y'], action: 'Whole lines make a whole-file copy', detail: 'gg goes to the top. Capital V selects complete lines; G extends to the bottom, and y yanks the selection. Lowercase v selects characters, so ggvG can miss the rest of the last line. Put the copy with p.', note: 'A Vim register is not automatically your system clipboard. In clipboard-enabled Vim, ggVG"+y copies there. The trainer practices internal registers.' },
  { title: 'Never get stuck in Vim', mode: 'YOUR ESCAPE ROUTE', description: 'Press Esc to leave Insert or Visual mode, type :q, then press Enter. This quits the current Vim window; the last window closes Vim.', keys: ['Esc', ':', 'q', 'Enter'], action: 'Try quitting in the safe prompt below', detail: 'If Vim says there are unsaved changes, :q will stop. Use :wq to save and quit, or :q! to discard those changes and quit.', note: 'This practice prompt only simulates quitting. GhostKeys stays open and no files are changed.' },
  { title: 'Save your spell and leave', mode: 'SAVE & QUIT', description: 'Keep your latest edits before leaving. From Normal mode, :wq writes the current file and closes its window.', keys: ['Esc', ':', 'w', 'q', 'Enter'], action: 'Save the changed spell and close the practice window', detail: 'This practice file has unsaved edits. :q refuses to abandon them. :wq saves them first; :q! would throw them away.', note: 'This is a simulation. No real files are written and GhostKeys stays open.' },
  { title: 'Leave an unwanted spell behind', mode: 'DISCARD & QUIT', description: 'When you deliberately want to abandon unsaved edits, :q! closes the current window without writing them.', keys: ['Esc', ':', 'q', '!', 'Enter'], action: 'Discard the changed spell and close the practice window', detail: 'The exclamation mark overrides the unsaved-change check. The saved file keeps its old contents. Use :wq instead when you want to keep your edits.', note: 'Discard only changes you mean to lose. This practice uses a pretend file.' },
];

const topicNames=['Normal','Insert','Visual',':w','Copy all',':q',':wq',':q!'];
const commands:Record<number,string>={3:'w',5:'q',6:'wq',7:'q!'};

function FilePractice({target,done,onDone}:{target:string;done:boolean;onDone():void}) {
  const [mode,setMode]=useState('insert'),[command,setCommand]=useState(''),[message,setMessage]=useState('');
  const [saved,setSaved]=useState(target==='q'?'warm glow':done&&target!=='q!'?'new glow':'old glow');
  const prompt=useRef<HTMLDivElement>(null);
  useEffect(()=>{prompt.current?.focus();},[]);
  const buffer=target==='q'?'warm glow':'new glow';
  return <div ref={prompt} className={'quit-prompt '+(done?'finished':'')} role="textbox" aria-label="Safe Vim file practice" aria-multiline="false" tabIndex={0} onKeyDown={event=>{
    if(event.key==='Tab'||event.ctrlKey||event.altKey||event.metaKey||event.nativeEvent.isComposing||event.key==='Shift')return;
    event.preventDefault();if(event.repeat||done)return;
    if(event.key==='Escape'){setMode('normal');setCommand('');setMessage('Normal mode. Type : to open the command line.');}
    else if(mode==='normal'&&event.key===':'){setMode('command');setCommand('');setMessage('Type '+target+', then Enter.');}
    else if(mode==='command'&&event.key==='Backspace')setCommand(value=>value.slice(0,-1));
    else if(mode==='command'&&event.key==='Enter'){
      const entered=command.trim();setMode('normal');setCommand('');
      if(entered==='q'&&saved!==buffer){setMessage('Unsaved changes: :q cannot close this file. Use :wq to save or :q! to discard.');return;}
      if(entered==='w'){setSaved(buffer);if(target!=='w'){setMessage('Practice file saved; window still open. Now use :'+target+'.');return;}}
      if(entered!==target){setMessage('This task asks for :'+target+'. Try that command to practice the requested outcome.');return;}
      if(entered==='wq')setSaved(buffer);
      setMessage(entered==='w'?'Saved successfully. The practice window stays open.':entered==='wq'?'Saved and closed. Your new glow is kept.':entered==='q!'?'Closed without saving. The old glow is kept.':'Quit successful. There were no unsaved changes.');onDone();
    }else if(mode==='command'&&event.key.length===1)setCommand(value=>(value+event.key).slice(0,30));
    else setMessage('Start with Esc to return to Normal mode.');
  }}>
    <span className="mini-label">SIMULATED FILE · {done&&target!=='w'?'CLOSED':mode.toUpperCase()} · SAVED: {saved}</span>
    <code>{done?'✓ '+(target==='w'?'Saved; still open':'Quit successful'):mode==='command'?':'+command+'▏':mode==='insert'?'-- INSERT --  Press Esc to begin':'Normal mode · buffer: '+buffer}</code>
    <span role="status">{message||'A pretend spell.txt. Try the keys above.'}</span>
  </div>;
}

export function Introduction({ onComplete,onPracticeCopy }: { onComplete(): void;onPracticeCopy():void }) {
  const [step,setStep]=useState(0),[completed,setCompleted]=useState<Record<number,boolean>>({});
  const next=useRef<HTMLButtonElement>(null);
  const page=pages[step],last=step===pages.length-1,target=commands[step],ready=!target||completed[step];
  useEffect(()=>{if(!target||completed[step])next.current?.focus();},[step,target,completed]);
  function advance(){if(last)onComplete();else setStep(s=>s+1);}
  return <div className="workspace introduction-page">
    <div className="lesson-topline"><div className="eyebrow">CHAPTER 01 · BEFORE YOU BEGIN</div><span className="lesson-count">{step+1} / {pages.length}</span></div>
    <div className="title-row"><div><h1>{page.title}<span>.</span></h1><p className="intro">{page.description}</p></div><div className="lesson-badge"><Keyboard size={25}/></div></div>
    <nav className="intro-tabs" aria-label="Introduction topics">{topicNames.map((name,i)=><button key={name} aria-current={step===i?'step':undefined} onClick={()=>setStep(i)}>{i+1}<span>{name}</span></button>)}</nav>
    <section className="panel intro-card" aria-label={page.title}>
      <span className={'mode-badge '+page.mode.toLowerCase()}>{page.mode}</span>
      <h2>{page.action}</h2>
      <div className="key-sequence">{page.keys.map((key,i)=><div className="key-step" key={key}><kbd className={i===0?'current':''}>{key}</kbd>{i<page.keys.length-1&&<span className="key-arrow">→</span>}</div>)}</div>
      <p>{page.detail}</p>
      {target?<FilePractice key={step} target={target} done={!!completed[step]} onDone={()=>setCompleted(previous=>({...previous,[step]:true}))}/>:step===4?<button className="text-button" onClick={onPracticeCopy}>Practice copying the whole file<ArrowRight size={15}/></button>:<div className="mode-route"><span>Normal</span><ArrowRight size={16}/><span>{step===0?'Move / edit':step===1?'i → Insert':'v → Visual'}</span><ArrowRight size={16}/><span>Esc → Normal</span></div>}
      <p className="intro-note">{page.note}</p>
    </section>
    <div className="intro-navigation"><button className="text-button" disabled={step===0} onClick={()=>setStep(s=>s-1)}><ArrowLeft size={15}/>Previous topic</button><span>{!ready?'Try the command to continue':'Press Enter to continue'}</span><button ref={next} className="primary-button" disabled={!ready} onKeyDown={e=>{if(e.key==='Enter'&&e.repeat)e.preventDefault();}} onClick={advance}>{last?<><Check size={15}/>Start training</>:<>Next topic<ArrowRight size={15}/></>}</button></div>
  </div>;
}
