import type { Exercise, Lesson } from './lessons';

const spirits = ['ghost', 'wisp', 'phantom', 'specter'];
const lights = ['candle', 'lantern', 'moonbeam', 'starlight'];
const moods = ['calm', 'kind', 'cozy', 'warm'];
function select(code: string, start: number, from: number, to: number, task: string, steps: string[]): Exercise {
  return { code, start, goal: { kind: 'selection', from, to }, task, steps };
}
function edit(code: string, start: number, text: string, task: string, steps: string[], language: Exercise['language'] = 'javascript'): Exercise {
  return { code, start, goal: { kind: 'document', text }, task, steps, language };
}

export const visualLessons: Lesson[] = [
  {
    id: 'visual-characters', category: 'Selection', title: 'Catch three little sparks', command: 'v2l',
    description: 'Characterwise Visual mode begins with v. The character under the cursor is already selected; motions extend the highlighted range.',
    tip: 'v selects the first character. Moving right twice with 2l gives you three characters in total, not two.',
    make(v) {
      const word=spirits[v], code=`// Catch the first three sparks\nconst name = "${word}";`, from=code.indexOf(word);
      return select(code,from,from,from+3,`Select just the first three letters of ${word}.`,['v','2','l']);
    },
  },
  {
    id: 'visual-phrase', category: 'Selection', title: 'Gather a quiet greeting', command: 'v2e',
    description: 'Visual mode understands word motions and counts. Select a phrase by its word endings instead of counting individual characters.',
    tip: 'From quiet, v2e selects through the end of the second word. The following space stays outside the selection.',
    make(v) {
      const phrase=`quiet ${spirits[v]}`, code=`// A greeting in the guestbook\n// ${phrase} carries a ${lights[v]}.`, from=code.indexOf(phrase);
      return select(code,from,from,from+phrase.length,`Select “${phrase}” without the space after it.`,['v','2','e']);
    },
  },
  {
    id: 'visual-till', category: 'Selection', title: 'Stop at the silver thread', command: 'vt;',
    description: 'Choose the range first, then decide what to do with it. vt; selects up to the semicolon while leaving the semicolon outside.',
    tip: 't stops before the target, and Visual mode includes that stopping character. vf; would select the semicolon too.',
    make(v) {
      const code=`// Keep the silver boundary\nconst glow = ${lights[v]} + 2;`, from=code.indexOf(lights[v]);
      return select(code,from,from,code.indexOf(';'),'Select the glow expression, excluding its semicolon.',['v','t',';']);
    },
  },
  {
    id: 'visual-lines', category: 'Selection', title: 'Gather three haunted notes', command: 'V2j',
    description: 'Capital V selects whole lines. Move down to include more lines, regardless of their different lengths or the starting column.',
    tip: 'V already includes the current line. 2j adds two more, giving you three complete lines and their line breaks.',
    make(v) {
      const notes=`greet("${spirits[v]}");\nlight("${lights[v]}");\nlisten();\n`, code=`// Three notes for tonight\n${notes}rest();`, from=code.indexOf('greet');
      return select(code,from+3,from,from+notes.length,'Select the three calls above rest() as whole lines.',['V','2','j']);
    },
  },
  {
    id: 'visual-cancel', category: 'Selection', title: 'Let the little ghost go', command: 'v · e · Esc',
    description: 'A selection does not change the text by itself. Esc cancels Visual mode and leaves you in Normal mode at the selection’s active end.',
    tip: 'Select through the word ending with ve, then press Esc. Keep the word intact and leave the cursor on its final letter.',
    make(v) {
      const word=spirits[v], code=`// Let the selection go\nconst name = "${word}";`, from=code.indexOf(word);
      return {code,start:from,goal:{kind:'cursor',at:from+word.length-1,text:code},task:`Select ${word} to its end, then cancel the selection without editing it.`,steps:['v','e','Esc']};
    },
  },
  {
    id: 'visual-delete', category: 'Selection', title: 'Brush away a visible cobweb', command: 'vaw · d',
    description: 'Normal mode puts the operator first: daw. Visual mode reverses the order: select with vaw, inspect the range, then press d.',
    tip: 'Select dusty and its following space, then delete. The same edit can be done directly with daw in Normal mode.',
    make(v) {
      const code=`// A dusty ${spirits[v]} carries a ${lights[v]}.`;
      return edit(code,code.indexOf('dusty')+2,code.replace('dusty ',''),'Visually select and remove dusty plus its following space.',['v','a','w','d']);
    },
  },
  {
    id: 'visual-change', category: 'Selection', title: 'Give the greeting a warmer glow', command: 'viw · c',
    description: 'Select a word with viw, then c changes the highlighted text and enters Insert mode. Finish writing with Esc.',
    tip: 'viwc lets you inspect the word before replacing it. ciw performs the same edit directly from Normal mode.',
    make(v) {
      const code=`// A gentler greeting\nconst mood = "gloomy ${spirits[v]}";`;
      return edit(code,code.indexOf('gloomy')+2,code.replace('gloomy',moods[v]),`Visually select gloomy and replace it with ${moods[v]}.`,['v','i','w','c',`type:${moods[v]}`,'Esc']);
    },
  },
  {
    id: 'visual-case', category: 'Selection', title: 'Raise a ghostly announcement', command: 'viw · U',
    description: 'After selecting text, U makes it uppercase. In Visual mode, lowercase u makes the selection lowercase rather than undoing.',
    tip: 'Select the whole name, then use capital U. In Normal mode, gUiw would apply the same uppercase edit without showing a selection first.',
    make(v) {
      const word=spirits[v], code=`// Make the name stand out\nconst label = "${word}";`;
      return edit(code,code.indexOf(word)+1,code.replace(word,word.toUpperCase()),`Visually select ${word} and make it uppercase.`,['v','i','w','U']);
    },
  },
  {
    id: 'visual-delete-lines', category: 'Selection', title: 'Clear three dusty shelves', command: 'V2j · d',
    description: 'Linewise selection makes a multi-line deletion easy to inspect. Select the lines with V and motion, then delete with d.',
    tip: 'V2jd removes three whole lines. From the first of those lines, Normal-mode 3dd would produce the same result.',
    make(v) {
      const dust=`dust("${spirits[v]}");\ndust("${lights[v]}");\ndust("shelves");\n`, code=`// Keep the light on\n${dust}light();`;
      return edit(code,code.indexOf('dust(')+2,code.replace(dust,''),'Visually select the three dust calls and delete them, keeping light().',['V','2','j','d']);
    },
  },
  {
    id: 'visual-yank', category: 'Selection', title: 'Keep a copy of the invitation', command: 'viw · y · p',
    description: 'Use y on a Visual selection to copy it into a Vim register. The text stays in place, and p puts a copy after the cursor.',
    tip: 'Select the name, yank it, then use f" and p to fill the empty string. Normal-mode yiw copies the same word directly.',
    make(v) {
      const word=spirits[v], code=`// Copy the invitation name\nconst ${word} = "";`;
      return edit(code,code.indexOf(word)+1,code.replace('""',`"${word}"`),'Select and copy the variable name into the empty string.',['v','i','w','y','f','"','p']);
    },
  },
  {
    id: 'block-prepend', category: 'Selection', title: 'Hang a ribbon on every doorway', command: 'Ctrl+v · I',
    description: 'Visual Block selects columns across lines. Capital I inserts at the block’s left edge on every selected line.',
    tip: 'Use Ctrl+v and 2j to cover three lines, then capital I. Type // and a space; finish with Esc to complete the block edit.',
    make(v) {
      const lines=[`greet("${spirits[v]}");`,`light("${lights[v]}");`,'rest();'], code=lines.join('\n')+'\n\nlisten();';
      return edit(code,0,lines.map(line=>'// '+line).join('\n')+'\n\nlisten();','Comment out the first three calls by prepending // and a space.',['Ctrl+v','2','j','I','type:// ','Esc']);
    },
  },
  {
    id: 'block-append', category: 'Selection', title: 'A tiny seal on every spell', command: 'Ctrl+v · $ · A',
    description: 'Use $ in Visual Block to reach each line’s own ending. Capital A then appends text at those endings, even when line lengths differ.',
    tip: 'Without $, A appends at the block’s right column. With $, each line gets its own semicolon. Finish the insertion with Esc.',
    make(v) {
      const lines=[`greet("${spirits[v]}")`,`light("${lights[v]}")`,'rest()'], code=lines.join('\n')+'\n\nlisten();';
      return edit(code,0,lines.map(line=>line+';').join('\n')+'\n\nlisten();','Append a semicolon to each of the first three calls.',['Ctrl+v','2','j','$','A','type:;','Esc']);
    },
  },
  {
    id: 'block-change', category: 'Selection', title: 'Check off the midnight chores', command: 'Ctrl+v · c',
    description: 'A block selection can replace the same columns across several lines. c changes the selected rectangle to your new text.',
    tip: 'Select the three-character [ ] markers, then c and [x]. Esc finishes the replacement across the block; the task descriptions stay intact.',
    make(v) {
      const lines=[`[ ] greet the ${spirits[v]}`,`[ ] light the ${lights[v]}`,'[ ] close the attic'], code=lines.join('\n');
      return edit(code,0,lines.map(line=>line.replace('[ ]','[x]')).join('\n'),'Mark all three chores as [x], preserving the text beside them.',['Ctrl+v','2','j','2','l','c','type:[x]','Esc'],'text');
    },
  },
  {
    id: 'visual-html-list', category: 'Selection', title: 'An invitation to the ghost parade', command: 'Block c · Block A',
    description: 'Combine block change and append to turn three list markers into HTML list items. The outer ordered-list tags are ready for you.',
    tip: 'Replace the - markers and spaces with <li>. Return to column one, select the three lines again, use $ and A to append </li>, then Esc.',
    make(v) {
      const items=[`greet the ${spirits[v]}`,`carry a ${lights[v]}`,'follow the moon'], code='<ol>\n'+items.map(item=>'- '+item).join('\n')+'\n</ol>';
      const result='<ol>\n'+items.map(item=>'<li>'+item+'</li>').join('\n')+'\n</ol>';
      return edit(code,code.indexOf('- '),result,'Replace the three - markers with opening <li> tags and append a closing </li> to each item.', ['Ctrl+v','2','j','l','c','type:<li>','Esc','0','Ctrl+v','2','j','$','A','type:</li>','Esc'],'html');
    },
  },
];
