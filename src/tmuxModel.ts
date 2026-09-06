// A deliberately local teaching model. Input is never passed to a shell or tmux.
export type Layout={pane:number}|{direction:'row'|'column';first:Layout;second:Layout};
export interface Pane {id:number;program:string}
export interface TmuxWindow {id:number;name:string;panes:Pane[];active:number;layout:Layout;zoom:boolean}
export interface Session {name:string;windows:TmuxWindow[];active:number}
export interface TmuxState {
  sessions:Session[];attached:string|null;prefix:boolean;input:string;
  mode:'terminal'|'rename-session'|'rename-window'|'command'|'sessions'|'help'|'copy'|'confirm-pane'|'confirm-window';
  selected:number;scroll:number;log:string[];events:string[];
}
export const makeWindow=(id=0,name='shell'):TmuxWindow=>({id,name,panes:[{id:0,program:'shell · ready'}],active:0,layout:{pane:0},zoom:false});
export const makeSession=(name:string):Session=>({name,windows:[makeWindow()],active:0});
export const makeState=(name='ghost',attached=true):TmuxState=>({sessions:[makeSession(name)],attached:attached?name:null,prefix:false,input:'',mode:'terminal',selected:0,scroll:0,log:[],events:[]});
export const activeSession=(s:TmuxState)=>s.sessions.find(session=>session.name===s.attached);
export const activeWindow=(s:TmuxState)=>{const session=activeSession(s);return session?.windows.find(window=>window.id===session.active);};
export function paneRects(layout:Layout,x=0,y=0,width=1,height=1):{id:number;x:number;y:number;width:number;height:number}[]{
  if('pane'in layout)return [{id:layout.pane,x,y,width,height}];
  return layout.direction==='row'?[...paneRects(layout.first,x,y,width/2,height),...paneRects(layout.second,x+width/2,y,width/2,height)]:[...paneRects(layout.first,x,y,width,height/2),...paneRects(layout.second,x,y+height/2,width,height/2)];
}
function split(layout:Layout,id:number,newId:number,direction:'row'|'column'):Layout {
  if('pane'in layout)return layout.pane===id?{direction,first:layout,second:{pane:newId}}:layout;
  return {...layout,first:split(layout.first,id,newId,direction),second:split(layout.second,id,newId,direction)};
}
function remove(layout:Layout,id:number):Layout|null {
  if('pane'in layout)return layout.pane===id?null:layout;
  const first=remove(layout.first,id),second=remove(layout.second,id);
  return first&&second?{...layout,first,second}:first??second;
}
function record(s:TmuxState,event:string,message:string){s.events.push(event);s.log.push(message);s.log=s.log.slice(-6);}
function closeWindow(s:TmuxState){
  const session=activeSession(s);if(!session)return;
  session.windows=session.windows.filter(window=>window.id!==session.active);
  if(session.windows.length)session.active=session.windows[0].id;
  else {s.sessions=s.sessions.filter(item=>item!==session);s.attached=null;}
  record(s,'close-window','Window closed; its programs ended.');
}
function run(s:TmuxState,text:string,inside=false){
  const words=text.trim().split(/\s+/);if(!words[0])return;
  if(!inside&&words.shift()!=='tmux'){record(s,'unsupported','Simulation: use the tmux command in the task. No shell command was run.');return;}
  const command=words.shift(),flag=(name:string)=>{const at=words.indexOf(name);return at<0?undefined:words[at+1];};
  const allowed=['new','new-session'].includes(command??'')?['-s','-A']:['attach','attach-session','a','kill-session'].includes(command??'')?['-t']:[];
  const used=new Set<string>();
  for(let i=0;i<words.length;i++){
    const option=words[i];
    if(!allowed.includes(option)||used.has(option)||(option!=='-A'&&(!words[i+1]||words[i+1].startsWith('-')))){
      record(s,'error','Unsupported or incomplete arguments. Use the command shown in this lesson.');return;
    }
    used.add(option);if(option!=='-A')i++;
  }
  if(['ls','list-sessions'].includes(command??'')){
    record(s,'list',s.sessions.length?s.sessions.map(item=>`${item.name}: ${item.windows.length} window(s)${item.name===s.attached?' (attached)':''}`).join('\n'):'No sessions running.');return;
  }
  if(['new','new-session'].includes(command??'')){
    const name=flag('-s');if(!name||!/^[\w-]+$/.test(name)){record(s,'error','Give the session a name: tmux new -s ghost');return;}
    const existing=s.sessions.find(item=>item.name===name);
    if(existing&&!words.includes('-A')){record(s,'error','That session already exists. Attach to it instead.');return;}
    if(!existing)s.sessions.push(makeSession(name));
    s.attached=name;record(s,existing?'attach':'create',`${existing?'Reattached to':'Created'} session ${name}.`);return;
  }
  if(['attach','attach-session','a'].includes(command??'')){
    const name=flag('-t')??s.sessions[0]?.name;
    if(!s.sessions.some(item=>item.name===name)){record(s,'error','No matching session. Use tmux ls to find its name.');return;}
    s.attached=name;record(s,'attach',`Attached to ${name}; its programs are still here.`);return;
  }
  if(['detach','detach-client'].includes(command??'')){
    if(s.attached){const name=s.attached;s.attached=null;record(s,'detach',`Detached from ${name}. Session and programs keep running.`);}return;
  }
  if(command==='kill-session'){
    const name=flag('-t')??s.attached;
    if(!s.sessions.some(item=>item.name===name)){record(s,'error','No matching session to close.');return;}
    s.sessions=s.sessions.filter(item=>item.name!==name);if(s.attached===name)s.attached=null;
    record(s,'kill-session',`Session ${name} ended, including all its programs.`);return;
  }
  record(s,'unsupported','That command is outside this simulation. Follow the task or reset.');
}

export function tmuxKey(previous:TmuxState,key:string):TmuxState {
  const s=structuredClone(previous),session=activeSession(s),window=activeWindow(s);
  if(s.mode==='confirm-pane'||s.mode==='confirm-window'){
    if(key==='y'){
      if(s.mode==='confirm-window')closeWindow(s);
      else if(window){
        if(window.panes.length===1)closeWindow(s);
        else {window.layout=remove(window.layout,window.active)!;window.panes=window.panes.filter(pane=>pane.id!==window.active);window.active=window.panes[0].id;window.zoom=false;}
        record(s,'close-pane','Pane closed; its program ended.');
      }
      s.mode='terminal';
    }else if(['n','Esc','Enter'].includes(key)){s.mode='terminal';record(s,'cancel','Close cancelled.');}
    return s;
  }
  if(s.mode==='help'||s.mode==='copy'){
    if(key==='q'||key==='Esc'){record(s,s.mode==='help'?'help-close':'copy-close','Back to the live terminal.');s.mode='terminal';}
    else if(key==='ArrowUp'){s.scroll++;record(s,'scroll','Moved up through previous output.');}
    else if(key==='ArrowDown')s.scroll=Math.max(0,s.scroll-1);
    return s;
  }
  if(s.mode==='sessions'){
    if(key==='ArrowDown')s.selected=Math.min(s.sessions.length-1,s.selected+1);
    if(key==='ArrowUp')s.selected=Math.max(0,s.selected-1);
    if(key==='Enter'){s.attached=s.sessions[s.selected]?.name??s.attached;s.mode='terminal';record(s,'switch-session',`Switched to ${s.attached}.`);}
    if(key==='q'||key==='Esc')s.mode='terminal';return s;
  }
  if(['rename-session','rename-window','command'].includes(s.mode)||!s.attached){
    if(key==='Esc'){s.mode='terminal';s.input='';s.prefix=false;return s;}
    if(key==='Ctrl+u'){s.input='';return s;}
    if(key==='Backspace'){s.input=s.input.slice(0,-1);return s;}
    if(key==='Enter'){
      const value=s.input.trim(),mode=s.mode;s.input='';s.mode='terminal';
      if(mode==='rename-session'&&session){
        if(value&&!s.sessions.some(item=>item!==session&&item.name===value)){session.name=value;s.attached=value;record(s,'rename-session',`Session is now ${value}.`);}
        else record(s,'error','Use a nonempty, unused session name.');
      }else if(mode==='rename-window'&&window&&value){window.name=value;record(s,'rename-window',`Window is now ${value}.`);}
      else run(s,value,mode==='command');
      return s;
    }
    if(key.length===1)s.input=(s.input+key).slice(0,180);return s;
  }
  if(s.prefix){
    s.prefix=false;
    if(key==='Esc')return s;
    if(key==='d'){const name=s.attached;s.attached=null;s.input='';record(s,'detach',`Detached from ${name}. Session and programs keep running.`);}
    else if(key==='c'&&session){const created=makeWindow(Math.max(...session.windows.map(w=>w.id))+1);session.windows.push(created);session.active=created.id;record(s,'new-window','New window opened. The previous one is still running.');}
    else if((key==='n'||key==='p')&&session){const index=session.windows.findIndex(w=>w.id===session.active);session.active=session.windows[(index+(key==='n'?1:-1)+session.windows.length)%session.windows.length].id;record(s,'switch-window',`Selected window ${session.active}.`);}
    else if(/^\d$/.test(key)&&session){if(session.windows.some(w=>w.id===Number(key))){session.active=Number(key);record(s,'switch-window',`Selected window ${key}.`);}}
    else if(key===','&&window){s.mode='rename-window';s.input=window.name;}
    else if(key==='$'&&session){s.mode='rename-session';s.input=session.name;}
    else if((key==='%'||key==='"')&&window){
      const id=Math.max(...window.panes.map(pane=>pane.id))+1;
      window.layout=split(window.layout,window.active,id,key==='%'?'row':'column');window.panes.push({id,program:'shell · ready'});window.active=id;window.zoom=false;
      record(s,key==='%'?'split-right':'split-down',`Split the active pane ${key==='%'?'left / right':'top / bottom'}.`);
    }else if(key==='o'&&window){window.active=window.panes[(window.panes.findIndex(pane=>pane.id===window.active)+1)%window.panes.length].id;record(s,'focus-pane',`Focused pane ${window.active}.`);}
    else if(key.startsWith('Arrow')&&window){
      const rects=paneRects(window.layout),current=rects.find(rect=>rect.id===window.active)!;
      const candidates=rects.filter(rect=>rect.id!==current.id&&(key==='ArrowLeft'?rect.x+rect.width<=current.x:key==='ArrowRight'?rect.x>=current.x+current.width:key==='ArrowUp'?rect.y+rect.height<=current.y:rect.y>=current.y+current.height));
      candidates.sort((a,b)=>Math.hypot(a.x+a.width/2-current.x-current.width/2,a.y+a.height/2-current.y-current.height/2)-Math.hypot(b.x+b.width/2-current.x-current.width/2,b.y+b.height/2-current.y-current.height/2));
      if(candidates[0]){window.active=candidates[0].id;record(s,'focus-pane',`Focused pane ${window.active}.`);}
    }else if(key==='z'&&window){window.zoom=!window.zoom;record(s,window.zoom?'zoom-in':'zoom-out',window.zoom?'Active pane fills the window. Other panes keep running.':'All panes visible again.');}
    else if(key==='x')s.mode='confirm-pane';
    else if(key==='&')s.mode='confirm-window';
    else if(key==='?'){s.mode='help';record(s,'help-open','Default bindings are shown. Press q to return.');}
    else if(key==='['){s.mode='copy';s.scroll=0;record(s,'copy-open','Viewing history. Arrow keys move; q returns to live output.');}
    else if(key==='s'){s.mode='sessions';s.selected=s.sessions.findIndex(item=>item.name===s.attached);}
    else if(key===':'){s.mode='command';s.input='';}
    else record(s,'unsupported','This shortcut is outside the practice model. Use the task hint or reset.');
    return s;
  }
  if(key==='Ctrl+b'){s.prefix=true;return s;}
  if(key==='Esc'||key==='Ctrl+u'){s.input='';return s;}
  if(key==='Backspace'){s.input=s.input.slice(0,-1);return s;}
  if(key==='Enter'){
    if(s.input.trim()==='exit'){
      if(window&&window.panes.length>1){window.layout=remove(window.layout,window.active)!;window.panes=window.panes.filter(pane=>pane.id!==window.active);window.active=window.panes[0].id;record(s,'close-pane','Shell exited; pane and its program ended.');}
      else closeWindow(s);
    }else record(s,'shell','Typed into the pane shell, not a tmux shortcut. Use Ctrl+b, release it, then the command key.');
    s.input='';return s;
  }
  if(key.length===1)s.input=(s.input+key).slice(0,180);
  return s;
}
