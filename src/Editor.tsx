import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, keymap } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle, bracketMatching, indentUnit } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { history, defaultKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { vim, Vim, getCM } from '@replit/codemirror-vim';
import type { Exercise, Goal } from './lessons';

// The bundled Vim engine lacks g_. Register it as a motion so counts,
// Visual selection, and operators share the engine's normal handling.
Vim.defineMotion('ghostkeysLastNonblank', (cm, head, args, state) => {
  const line = Math.min(cm.lastLine(), head.line + args.repeat - 1);
  const ch = Math.max(0, cm.getLine(line).replace(/[ \t]+$/, '').length - 1);
  const target = { line, ch };
  state.lastHPos = ch;
  state.lastHSPos = cm.charCoords(target, 'div').left;
  return target;
});
Vim.mapCommand('g_', 'motion', 'ghostkeysLastNonblank', { inclusive: true }, {});

// Reuse the engine's put action, including counts, registers, and edit history.
// The missing g variants differ only in where the cursor lands after insertion.
type VimAction = Parameters<typeof Vim.defineAction>[1];
type VimRegister = ReturnType<ReturnType<typeof Vim.getRegisterController>['getRegister']>;
Vim.defineAction('ghostkeysPutAndAdvance', function(this:{continuePaste(...args:[...Parameters<VimAction>,string,VimRegister]):void},cm,args,state) {
  const register=Vim.getRegisterController().getRegister(args.registerName);
  const put=(text:string)=>{
    if(!text)return;
    const start=cm.getCursor();
    const startIndex=cm.indexFromPos({line:start.line,ch:Math.min(cm.getLine(start.line).length,start.ch+(args.after?1:0))});
    // Block counts repeat columns, rather than concatenating rectangular rows.
    const block=register.blockwise?text.replace(/\n$/,'').split('\n').map(line=>line.repeat(args.repeat)):undefined;
    this.continuePaste(cm,block?{...args,repeat:1}:args,state,block?block.join('\n'):text,register);
    let target;
    if(block){
      target={line:start.line+block.length-1,ch:start.ch+(args.after?1:0)+block[block.length-1].length};
    }else if(register.linewise){
      const line=Math.min(cm.lastLine(),start.line+(args.after?1:0)+(text.match(/\n/g)?.length??0)*args.repeat);
      target={line,ch:Math.max(0,cm.getLine(line).search(/\S/))};
    }else target=cm.posFromIndex(startIndex+text.length*args.repeat);
    target.ch=Math.min(target.ch,Math.max(0,cm.getLine(target.line).length-1));
    cm.setCursor(target);state.lastHPos=target.ch;state.lastHSPos=cm.charCoords(target,'div').left;
  };
  if(args.registerName==='+')void navigator.clipboard.readText().then(put).catch(()=>cm.openNotification(document.createTextNode('Could not read the system clipboard.'),{duration:5000}));
  else put(register.toString());
});
Vim.mapCommand('gp','action','ghostkeysPutAndAdvance',{after:true},{context:'normal',isEdit:true});
Vim.mapCommand('gP','action','ghostkeysPutAndAdvance',{after:false},{context:'normal',isEdit:true});

export interface Snapshot { text: string; cursor: number; ranges: [number,number][]; mode: string; line: number; column: number; register?: { text: string; linewise: boolean } }
export interface EditorHandle { focus(): void; press(key: string): void }
export function matchesGoal(goal: Goal, s: Snapshot): boolean {
  if (goal.kind === 'document') return s.text === goal.text && s.mode === 'normal' && (goal.at === undefined || s.cursor === goal.at);
  if (goal.kind === 'register') return s.mode === 'normal' && s.text === goal.document && s.register?.text === goal.text && s.register.linewise === goal.linewise;
  if (goal.kind === 'cursor') return s.cursor === goal.at && s.mode === 'normal' && (goal.text === undefined || s.text === goal.text);
  if (!s.mode.startsWith('visual')) return false;
  if (goal.kind === 'selection') return s.ranges.length === 1 && s.ranges[0][0] === goal.from && s.ranges[0][1] === goal.to;
  return s.ranges.length === goal.ranges.length && s.ranges.every((r,i)=>r[0]===goal.ranges[i][0] && r[1]===goal.ranges[i][1]);
}

const editorTheme = EditorView.theme({
  '&': { backgroundColor: '#16131d', color: '#d5ccdf', height: '100%', fontSize: '15px' },
  '.cm-scroller': { fontFamily: '"CaskaydiaMono Nerd Font", "Cascadia Code", "DejaVu Sans Mono", monospace', lineHeight: '1.95', overflow: 'auto' },
  '.cm-content': { padding: '24px 0', caretColor: '#f3af79' },
  '.cm-line': { padding: '0 24px 0 16px' },
  '.cm-gutters': { backgroundColor: '#16131d', border: 'none', color: '#80718f', padding: '0 8px 0 14px' },
  '.cm-lineNumbers .cm-gutterElement': { minWidth: '24px' },
  '.cm-activeLine': { backgroundColor: '#26202f80' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#d5b1f5' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: '#76509670 !important' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#ffc28f' },
  '.cm-fat-cursor': { background: '#d6b2f5 !important', color: '#191321 !important' },
  '&.cm-focused': { outline: 'none' },
  '.cm-panels': { backgroundColor: '#241d2d', color: '#eadcf5', borderColor: '#3d314a' },
  '.cm-textfield': { backgroundColor: '#16131d', border: '1px solid #705780', color: '#eee', padding: '6px' },
  '.cm-searchMatch': { backgroundColor: '#b8803633', outline: '1px solid #b8803655' },
}, { dark: true });
const colors=HighlightStyle.define([
  {tag:tags.keyword,color:'#caa4e8'},
  {tag:tags.comment,color:'#8f809d',fontStyle:'italic'},
  {tag:tags.string,color:'#b8cd9d'},
  {tag:tags.number,color:'#e9b985'},
  {tag:tags.bool,color:'#e9b985'},
  {tag:tags.function(tags.variableName),color:'#e9bd94'},
  {tag:tags.variableName,color:'#d5cee1'},
  {tag:tags.operator,color:'#b6a3d0'},
  {tag:tags.propertyName,color:'#b5c3e0'},
  {tag:tags.tagName,color:'#caa4e8'},
  {tag:tags.attributeName,color:'#e9bd94'},
]);

export const PracticeEditor = forwardRef<EditorHandle, { exercise: Exercise; instanceKey: string; onSnapshot(s: Snapshot): void; onKey(key: string): void; locked?: boolean }>(function PracticeEditor({ exercise, instanceKey, onSnapshot, onKey, locked }, ref) {
  const host = useRef<HTMLDivElement>(null), viewRef=useRef<EditorView|null>(null);
  const callbacks = useRef({onSnapshot,onKey,locked});callbacks.current={onSnapshot,onKey,locked};
  const publishRef=useRef(()=>{}),programmatic=useRef(false);
  useImperativeHandle(ref,()=>({
    focus(){viewRef.current?.focus();},
    press(key){
      const view=viewRef.current;if(!view)return;
      const cm=getCM(view);if(!cm)return;
      const input=view.dom.querySelector<HTMLInputElement>('input');
      if(input){
        if(key==='Enter'||key==='Esc'){
          programmatic.current=true;
          input.dispatchEvent(new KeyboardEvent('keydown',{key:key==='Esc'?'Escape':'Enter',keyCode:key==='Esc'?27:13,bubbles:true,cancelable:true}));
          programmatic.current=false;
        }
        else {input.value+=key;input.dispatchEvent(new Event('input',{bubbles:true}));}
      } else if(cm.state.vim?.insertMode && !cm.state.vim.inputState.keyBuffer.length && key.length===1) cm.replaceSelection(key);
      else Vim.handleKey(cm,key==='Esc'?'<Esc>':key==='Enter'?'<CR>':key.startsWith('Ctrl+')?`<C-${key.slice(5)}>`:key,'user');
      setTimeout(()=>publishRef.current(),0);
    },
  }),[]);
  useEffect(()=>{
    if(!host.current)return;
    // Lessons are isolated: registers, searches, and dot-repeat never leak between drills.
    Vim.resetVimGlobalState_();
    let live=true;
    const publish=()=>{
      if(!live)return;
      const cm=getCM(view);if(!cm)return;
      const state=view.state,selection=state.selection.main,line=state.doc.lineAt(selection.head);
      const v=cm.state.vim;
      const mode=v?.insertMode?'insert':v?.visualMode?(v.visualBlock?'visual block':v.visualLine?'visual line':'visual'):'normal';
      const ranges: [number,number][]=state.selection.ranges.map(r=>v?.visualLine
        ? [state.doc.lineAt(r.from).from,Math.min(state.doc.length,state.doc.lineAt(Math.max(r.from,r.to-1)).to+1)]
        : [r.from,r.to]);
      const register=exercise.goal.kind==='register'?Vim.getRegisterController().getRegister(exercise.goal.name):undefined;
      callbacks.current.onSnapshot({text:state.doc.toString(),cursor:selection.head,ranges,mode,line:line.number,column:selection.head-line.from+1,register:register?{text:register.toString(),linewise:register.linewise}:undefined});
    };
    const view=new EditorView({parent:host.current,state:EditorState.create({
      doc:exercise.code,selection:{anchor:exercise.start},extensions:[
        vim(),lineNumbers(),highlightActiveLineGutter(),highlightActiveLine(),drawSelection(),history(),
        // Practice every tag explicitly; automatic closing tags alter the taught edits.
        exercise.language==='html'?html({autoCloseTags:false}):exercise.language==='text'?[]:javascript(),
        syntaxHighlighting(colors),bracketMatching(),indentUnit.of('  '),
        keymap.of(defaultKeymap),EditorState.allowMultipleSelections.of(true),editorTheme,
        EditorView.contentAttributes.of({'aria-label':'Vim practice editor',spellcheck:'false'}),
        EditorView.updateListener.of(()=>queueMicrotask(publish)),
      ],
    })});
    viewRef.current=view;publishRef.current=publish;
    const cm=getCM(view)!;
    cm.on('vim-mode-change',()=>queueMicrotask(publish));
    for(const key of exercise.setup??[])Vim.handleKey(cm,key,'user');
    const handle=(e:KeyboardEvent)=>{
      if(programmatic.current||e.key==='Tab' || ['Shift','Control','Alt','Meta'].includes(e.key))return;
      if(callbacks.current.locked){e.preventDefault();e.stopPropagation();return;}
      const key=e.key==='Escape'?'Esc':e.ctrlKey?`Ctrl+${e.key.toLowerCase()}`:e.key;
      callbacks.current.onKey(key);
      setTimeout(publish,0);
    };
    const stopWheelBlur=()=>view.focus();
    view.dom.addEventListener('keydown',handle,true);
    view.contentDOM.addEventListener('pointerdown',stopWheelBlur);
    publish();view.focus();
    return()=>{live=false;view.dom.removeEventListener('keydown',handle,true);view.destroy();viewRef.current=null;};
  // Reset only when the exercise identity changes, not on each key press.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[instanceKey]);
  return <div className="editor-host" ref={host}/>;
});
