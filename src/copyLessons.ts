import type { Exercise, Lesson } from './lessons';

const ghosts=['ghost','wisp','phantom','specter'];
const lights=['candle','lantern','moonbeam','starlight'];
function edit(code:string,start:number,text:string,task:string,steps:string[],at?:number):Exercise {
  return {code,start,goal:{kind:'document',text,at},task,steps};
}
export const copyAllLesson:Lesson={
  id:'copy-all',category:'First steps',title:'Keep the whole spellbook',command:'ggVGy',
  description:'An essential rescue command: gg goes to the top, V selects whole lines, G extends to the bottom, and y copies everything into a Vim register.',
  tip:'Use capital V so the last line is included completely. Lowercase v selects characters and may stop partway through the final line. Paste with p. In clipboard-enabled Vim, ggVG"+y copies to the system clipboard.',
  make(v){
    const code=`// ${ghosts[v]}’s spellbook\nlight("${lights[v]}");\nrest("until the moon returns");`;
    return {code,start:code.indexOf('light'),goal:{kind:'register',name:'0',text:code+'\n',linewise:true,document:code},task:'Select and copy this entire file, including the full last line. Keep the text unchanged.',steps:['g','g','V','G','y']};
  },
};

export const copyLessons:Lesson[]=[
  {id:'copy-motion',category:'Editing',title:'Two guests in one little spell',command:'y2w · P',
    description:'Yank is an operator: combine y with a count and motion. y2w copies two words; P puts the characters before the cursor.',
    tip:'From the first word, y2w includes the spaces leading to the third word. P inserts that phrase before the original.',
    make(v){const phrase=`${ghosts[v]} ${lights[v]} `,code=phrase+'door';return {...edit(code,0,phrase+code,'Copy the first two words and place the copy before them.',['y','2','w','P']),language:'text'};}},
  ...(['p','P'] as const).map((put):Lesson=>({id:put==='p'?'put-after':'put-before',category:'Editing',title:put==='p'?'A guest beyond the doorway':'A guest before the doorway',command:`yiw · ${put}`,
    description:`Characterwise text stays within the line when you put it. ${put} inserts ${put==='p'?'after':'before'} the character under the cursor.`,
    tip:`Yank the name with yiw, find the | doorway with f|, then ${put}. Compare this with the neighboring lesson.`,
    make(v){const word=ghosts[v],code=word+' | end',text=word+(put==='p'?' |'+word:' '+word+'|')+' end';return {...edit(code,0,text,`Copy the name ${put==='p'?'after':'before'} the | doorway.`,['y','i','w','f','|',put]),language:'text'};}})),
  {id:'put-line-above',category:'Editing',title:'An invitation above the door',command:'yy · k · P',
    description:'yy copies a complete line. With linewise text, P inserts above the current line; p would insert below it.',
    tip:'Copy the greeting line, move up to the comment, then use capital P. The original greeting stays where it was.',
    make(v){const greeting=`greet("${ghosts[v]}");`,code=`// Open the door\n${greeting}\nrest();`;return edit(code,code.indexOf('greet'),greeting+'\n'+code,'Copy the greeting above the comment.',['y','y','k','P']);}},
  {id:'copy-counted-lines',category:'Editing',title:'Carry two pages together',command:'2yy · G · p',
    description:'A count before yy copies that many whole lines. Paste the bundle below the final line with Gp.',
    tip:'2yy copies the current line and the next one. Both return as lines when you press p.',
    make(v){const pair=`greet("${ghosts[v]}");\nlight("${lights[v]}");`,code=pair+'\nrest();';return edit(code,0,code+'\n'+pair,'Copy the first two calls below rest().',['2','y','y','G','p']);}},
  {id:'put-count',category:'Editing',title:'Four friendly visitors',command:'yy · 3p',
    description:'Counts also work with put. yy3p keeps the original line and adds three copies below it.',
    tip:'Three puts plus the original make four lines. Plain yyp would make just one extra copy.',
    make(v){const line=`invite("${ghosts[v]}");`;return edit(line,0,Array(4).fill(line).join('\n'),'Make four identical invitation calls in total.',['y','y','3','p']);}},
  ...(['gp','gP'] as const).map((put):Lesson=>({id:'cursor-'+put,category:'Editing',title:put==='gp'?'Step beyond your copied ghost':'Keep your place at the doorway',command:`yiw · ${put}`,
    description:`${put} puts text ${put==='gp'?'after':'before'} the cursor, then leaves the cursor just after the inserted text. Cursor placement is part of this task.`,
    tip:put==='gp'?'With characterwise text, p lands on the last inserted character. gp moves one position farther, onto the space after the copy.':'gP inserts the name before | and leaves you on |. Plain P would leave you on the copied name.',
    make(v){const word=ghosts[v],code=word+' | end',text=word+(put==='gp'?' |'+word:' '+word+'|')+' end',at=put==='gp'?text.indexOf(' end'):text.indexOf('|');return {...edit(code,0,text,`Copy the name and finish on ${put==='gp'?'the space after the copy':'the | doorway'}.`,['y','i','w','f','|','g',put[1]],at),language:'text'};}})),
  {id:'cut-word-put',category:'Editing',title:'Move a ghost into its jar',command:'diw · p',
    description:'Deleting also cuts into a Vim register. Move the inner word with diw, then put that saved text inside the empty quotes.',
    tip:'After diw, f" finds the opening quote. p puts the cut word after it. The surrounding text stays intact.',
    make(v){const code=`${ghosts[v]} -> ""`;return {...edit(code,0,` -> "${ghosts[v]}"`,'Move the name into the empty jar, leaving the arrow and spaces intact.',['d','i','w','f','"','p']),language:'text'};}},
  {id:'move-call-block',category:'Editing',title:'Prepare before greeting',command:'2dd · gg · j · P',
    description:'Cut several lines with one count, navigate to their new home, then put them above the current line with P.',
    tip:'Cut the two preparation calls. gg and j reach the greeting; P restores the cut lines above it.',
    make(v){const greeting=`  greet("${ghosts[v]}");`,prep=`  light("${lights[v]}");\n  openDoor();`,code=`function visit() {\n${greeting}\n${prep}\n}`;return edit(code,code.indexOf('  light'),`function visit() {\n${prep}\n${greeting}\n}`,'Move light() and openDoor() before greet().',['2','d','d','g','g','j','P']);}},
  {id:'copy-template',category:'Editing',title:'Make room for another spirit',command:'yyp · ci"',
    description:'Duplicate a line as a template, then change only the part that differs. yyp leaves the cursor on the new copy.',
    tip:'Copy the visitor entry, then ci" changes the copied name while preserving its quotes and the first visitor.',
    make(v){const line=`  { name: "${ghosts[v]}", welcome: true },`,code=`const visitors = [\n${line}\n];`;return edit(code,code.indexOf('  {'),`const visitors = [\n${line}\n${line.replace(ghosts[v],lights[v])}\n];`,`Add a second entry named ${lights[v]} using the first as a template.`,['y','y','p','c','i','"',`type:${lights[v]}`,'Esc']);}},
  ...(['a','0','_'] as const).map((register):Lesson=>({
    id:register==='a'?'named-register':register==='0'?'yank-register':'black-hole-register',category:'Editing',
    title:register==='a'?'A keepsake in pocket a':register==='0'?'Keep the copy after a cut':'Sweep dust past your keepsake',
    command:register==='a'?'"ayiw · "ap':register==='0'?'yiw · "0p':'yiw · "_dd · p',
    description:register==='a'?'Named registers a–z keep text you choose explicitly. Save a name in a, delete another line, then recover the name with "ap.':register==='0'?'Register 0 keeps the latest yank made without an explicit register. A later deletion changes the unnamed register but leaves 0 available.':'The black-hole register _ discards text without replacing your saved copy. Use "_dd when clearing a line you will not need.',
    tip:register==='a'?'The double quote selects a register: "ayiw copies into a and "ap puts from a. The later dd cannot overwrite your named keepsake.':register==='0'?'Plain p would put the deleted dust line. "0p retrieves the name you actually copied. Named yanks do not replace register 0.':'Yank the name, discard the dust line with "_dd, then paste normally. Your unnamed register still contains the name.',
    make(v){const code=`${ghosts[v]}\ndust\n""`,steps=register==='a'?['"','a','y','i','w']:['y','i','w'];steps.push('j',...(register==='_'?['"','_']:[]),'d','d','G','0',...(register==='_'?[]:['"',register]),'p');return {...edit(code,0,`${ghosts[v]}\n"${ghosts[v]}"`,'Copy the name, remove the dust line, then put the name inside the empty quotes.',steps),language:'text'};}
  })),
  {id:'append-register',category:'Editing',title:'Fill the same pocket twice',command:'"ayy · "Ayy · "ap',
    description:'A lowercase register name replaces its contents. Its uppercase form appends: "Ayy adds a line to the existing contents of a.',
    tip:'Store the first line in a, append the second through A, then put both below rest(). Uppercase A here is a register name, not Insert mode.',
    make(v){const pair=`greet("${ghosts[v]}");\nlight("${lights[v]}");`,code=pair+'\nrest();';return edit(code,0,code+'\n'+pair,'Collect the two calls in register a, then paste the collected pair below rest().',['"','a','y','y','j','"','A','y','y','G','"','a','p']);}},
  {id:'delete-history',category:'Editing',title:'Bring back two missing visitors',command:'dd · dd · "2p · "1p',
    description:'Whole-line deletions enter register 1; older entries shift toward 9. Recover the earlier cut from 2 and the latest from 1.',
    tip:'Cut both visitor lines before putting either back. Small within-line deletions normally use register - instead of this numbered history.',
    make(v){const code=`${ghosts[v]}\n${lights[v]}\nbridge\nhome`;return {...edit(code,0,`bridge\nhome\n${ghosts[v]}\n${lights[v]}`,'Cut both visitor lines, then restore them below home in their original order.',['d','d','d','d','G','"','2','p','"','1','p']),language:'text'};}},
  {id:'small-delete-register',category:'Editing',title:'Find a tiny lost keepsake',command:'diw · "-p',
    description:'Small deletions within a line normally go into the - register. You can retrieve one explicitly, just as you can a named register.',
    tip:'diw cuts the name without taking a line break. Use f" and "-p to recover it from the small-delete register.',
    make(v){const code=`${ghosts[v]} -> ""`;return {...edit(code,0,` -> "${ghosts[v]}"`,'Cut the name and recover it inside the quotes using register -.',['d','i','w','f','"','"','-','p']),language:'text'};}},
  {id:'inspect-register',category:'Editing',title:'Look inside your ghostly pocket',command:'"ayiw · :reg a · "ap',
    description:'Use :reg to inspect Vim registers, or :reg a to inspect just a. Read your saved name, dismiss the display, then put it into the jar.',
    tip:'Copy into a with "ayiw. Type :reg a and Enter to inspect it, then Esc to dismiss. G0 reaches the opening quote; "ap fills the jar.',
    make(v){const code=`${ghosts[v]}\n""`;return {...edit(code,0,`${ghosts[v]}\n"${ghosts[v]}"`,'Inspect register a after copying the name, then put that name inside the quotes.',['"','a','y','i','w',':','type:reg a','Enter','Esc','G','0','"','a','p']),language:'text'};}},
  {id:'insert-register',category:'Editing',title:'A keepsake while you write',command:'yiw · a · Ctrl+r 0',
    description:'In Insert mode, Ctrl+r followed by a register name inserts its text. This is different from Ctrl+r in Normal mode, which redoes an edit.',
    tip:'Yank the name, reach the opening quote with Gf", then a enters Insert mode inside it. Ctrl+r then 0 inserts the last yank. Esc finishes. Ctrl+r then a would insert register a.',
    make(v){const code=`// ${ghosts[v]}\nconst guest = "";`;return edit(code,3,code.replace('""',`"${ghosts[v]}"`),'Copy the ghost name into the string while in Insert mode.',['y','i','w','G','f','"','a','Ctrl+r','0','Esc']);}},
];
