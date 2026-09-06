export type Goal = { kind: 'cursor'; at: number; text?: string } | { kind: 'selection'; from: number; to: number } | { kind: 'document'; text: string; at?: number } | { kind: 'register'; name: string; text: string; linewise: boolean; document: string } | { kind: 'block'; ranges: [number, number][] };
import { motionLessons } from './motionLessons';
import { operatorLessons } from './operatorLessons';
import { visualLessons } from './visualLessons';
import { copyLessons, copyAllLesson } from './copyLessons';

export interface Exercise { code: string; start: number; goal: Goal; task: string; steps: string[]; setup?: string[]; language?: 'javascript' | 'html' | 'text' }
export interface Lesson { id: string; category: string; title: string; command: string; description: string; tip: string; make: (variation: number) => Exercise }
export const categories = ['First steps', 'Movement', 'Selection', 'Editing', 'Search & jumps'];
const names = ['ghost', 'pumpkin', 'lantern', 'spirit'];
const values = ['moon', 'amber', 'candle', 'mist'];
const wrap = (line: string, v: number) => `// ${['The midnight workshop', 'A little autumn magic', 'Notes from the attic', 'One last spell'][v % 4]}\n\nfunction prepare() {\n  ${line}\n  return true;\n}\n\nprepare();`;
const doc = (code: string, start: number, text: string, task: string, steps: string[]): Exercise => ({ code, start, goal: { kind: 'document', text }, task, steps });
const cursor = (code: string, start: number, at: number, task: string, steps: string[]): Exercise => ({ code, start, goal: { kind: 'cursor', at }, task, steps });
const selection = (code: string, start: number, from: number, to: number, task: string, steps: string[]): Exercise => ({ code, start, goal: { kind: 'selection', from, to }, task, steps });
export const lessons: Lesson[] = [
  { id: 'insert', category: 'First steps', title: 'Meet Insert mode', command: 'i · Esc', description: 'Normal mode is for commands. Insert mode is for writing. Switch between them deliberately.', tip: 'Press i to insert before the cursor. Escape brings you back to Normal mode.', make(v) {
    const word = names[v % 4], code = wrap('const name = "";', v), start = code.indexOf('""') + 1;
    return doc(code, start, code.slice(0, start) + word + code.slice(start), `Write “${word}” inside the empty quotes, then return to Normal mode.`, ['i', `type:${word}`, 'Esc']);
  } },
  { id: 'append', category: 'First steps', title: 'A little after', command: 'a', description: 'Append starts writing immediately after the character under your cursor.', tip: 'Use a when the cursor is one character before your insertion point.', make(v) {
    const name = names[v % 4], code = wrap(`const ${name} = 1;`, v), start = code.indexOf(name) + name.length - 1;
    return doc(code, start, code.replace(`const ${name}`, `const ${name}s`), `Make “${name}” plural by appending s. Finish in Normal mode.`, ['a', 'type:s', 'Esc']);
  } },
  { id: 'open-line', category: 'First steps', title: 'Make some room', command: 'o', description: 'Open a new line below the current one and enter Insert mode in a single action.', tip: 'The editor keeps the indentation of your current line.', make(v) {
    const code = wrap(`const ${names[v % 4]} = true;`, v), start = code.indexOf('  const'), lineEnd = code.indexOf('\n', start);
    return doc(code, start, code.slice(0,lineEnd) + '\n  // ready' + code.slice(lineEnd), 'Add a line containing // ready below the const declaration.', ['o', 'type:// ready', 'Esc']);
  } },
  { id: 'undo', category: 'First steps', title: 'Nothing is haunted forever', command: 'u', description: 'Undo brings back the last change. It is your safety net while experimenting.', tip: 'One character has already been deleted for you. Undo that change.', make(v) {
    const code = wrap(`const ${names[v % 4]} = true;`, v), start = code.indexOf(names[v % 4]);
    return { ...doc(code, start, code, 'Restore the missing first letter of the variable with undo.', ['u']), setup: ['x'] };
  } },
  { id: 'redo', category: 'First steps', title: 'On second thought', command: 'Ctrl+r', description: 'Redo reapplies the change you just undid.', tip: 'Hold Control and press r together. This is a chord, not a sequence.', make(v) {
    const code = wrap(`const ${names[v % 4]} = true;`, v), start = code.indexOf(names[v % 4]);
    return { ...doc(code,start,code.slice(0,start)+code.slice(start+1),'Redo the deletion that was just undone.', ['Ctrl+r']), setup:['x','u'] };
  } },
  copyAllLesson,
  { id: 'hjkl', category: 'Movement', title: 'Find your home row', command: 'h j k l', description: 'h goes left, j down, k up, and l right. Counts multiply a movement.', tip: 'Move down two lines, right three columns, up once, then left once.', make(v) {
    const code = `const ${names[v % 4]} = {\n  glow: true,\n  mood: "cozy",\n  light: "soft",\n};`;
    return cursor(code,0,code.indexOf('glow'), 'Use 2j, 3l, k, h to reach the g in glow.', ['2','j','3','l','k','h']);
  } },
  { id: 'word-forward', category: 'Movement', title: 'A word at a time', command: 'w', description: 'Jump to the start of the next word. Let words, rather than individual characters, guide you.', tip: 'Punctuation can form its own word. Here, one w moves from const to the variable.', make(v) {
    const code = wrap(`const ${names[v % 4]} = true;`,v);
    return cursor(code,code.indexOf('const'),code.indexOf(names[v % 4]),`Jump to the start of “${names[v % 4]}”.`,['w']);
  } },
  { id: 'word-back', category: 'Movement', title: 'One word back', command: 'b', description: 'Jump backward to the start of a word.', tip: 'From inside a word, b returns to its beginning.', make(v) {
    const word = names[v % 4], code = wrap(`const ${word} = true;`,v), at=code.indexOf(word);
    return cursor(code,at+word.length-1,at,`Return to the first letter of “${word}”.`,['b']);
  } },
  { id: 'word-end', category: 'Movement', title: 'Finish the word', command: 'e', description: 'Move to the last character of the current word.', tip: 'w targets the next beginning. e targets an ending.', make(v) {
    const word=names[v % 4],code=wrap(`const ${word} = true;`,v),at=code.indexOf(word);
    return cursor(code,at,at+word.length-1,`Land on the last letter of “${word}”.`,['e']);
  } },
  { id: 'line-zero', category: 'Movement', title: 'Back to column one', command: '0', description: 'Zero moves to the very beginning of the line, including indentation.', tip: 'This is the number zero, not the letter o.', make(v) {
    const code=wrap(`const ${names[v % 4]} = true;`,v);
    return cursor(code,code.indexOf('true'),code.indexOf('  const'),'Move to column one of the declaration line.', ['0']);
  } },
  { id: 'line-first', category: 'Movement', title: 'Skip the indentation', command: '^', description: 'Move to the first nonblank character on the line.', tip: 'On a US keyboard, ^ is Shift+6. Unlike 0, it skips leading spaces.', make(v) {
    const code=wrap(`const ${names[v % 4]} = true;`,v);
    return cursor(code,code.indexOf('true'),code.indexOf('const'),'Jump to the c in const, past the indentation.', ['^']);
  } },
  { id: 'line-end', category: 'Movement', title: 'The end of the line', command: '$', description: 'Jump directly to the final character on a line.', tip: 'On a US keyboard, $ is Shift+4.', make(v) {
    const code=wrap(`const ${names[v % 4]} = true;`,v);
    return cursor(code,code.indexOf('const'),code.indexOf(';'),'Jump to the semicolon at the end of the declaration.', ['$']);
  } },
  { id: 'file-top', category: 'Movement', title: 'Back to the beginning', command: 'gg', description: 'Two lowercase g keys take you to the first line of the file.', tip: 'Press g, then g. Do not hold them together.', make(v) {
    const code=wrap(`const ${names[v % 4]} = true;`,v);
    return cursor(code,code.lastIndexOf('prepare'),0,'Jump to the beginning of the file.', ['g','g']);
  } },
  { id: 'file-bottom', category: 'Movement', title: 'Straight to the bottom', command: 'G', description: 'Capital G jumps to the last line of the file.', tip: 'Use Shift+g to type capital G.', make(v) {
    const code=wrap(`const ${names[v % 4]} = true;`,v);
    return cursor(code,0,code.lastIndexOf('prepare'),'Jump to the last line of the file.', ['G']);
  } },
  ...motionLessons.filter(lesson => lesson.category === 'Movement'),
  { id: 'select-word', category: 'Selection', title: 'A word of your own', command: 'viw', description: 'Visual mode makes your selection visible. Combine it with “inside word” to grab a whole word from anywhere inside it.', tip: 'v = Visual mode · i = inside · w = word. The surrounding spaces stay outside the selection.', make(v) {
    const word=names[v % 4],code=wrap(`const ${word} = true;`,v),at=code.indexOf(word);
    return selection(code,at+2,at,at+word.length,`Select the word “${word}”, without the surrounding spaces.`,['v','i','w']);
  } },
  { id: 'select-line', category: 'Selection', title: 'Take the whole line', command: 'V', description: 'Capital V enters linewise Visual mode.', tip: 'Select the entire line, including its indentation and newline.', make(v) {
    const code=wrap(`const ${names[v % 4]} = true;`,v),from=code.indexOf('  const');
    return selection(code,from+8,from,code.indexOf('\n',from)+1,'Select the entire const declaration line.', ['V']);
  } },
  { id: 'select-quotes', category: 'Selection', title: 'Inside the quotation marks', command: 'vi"', description: 'Text objects let you select meaningful pieces of code without counting characters.', tip: 'vi" selects inside double quotes. va" would include the quotes.', make(v) {
    const value=values[v % 4],code=wrap(`const light = "${value}";`,v),at=code.indexOf(`"${value}`)+1;
    return selection(code,at+1,at,at+value.length,`Select “${value}” inside the string, leaving the quotes untouched.`, ['v','i','"']);
  } },
  { id: 'select-braces', category: 'Selection', title: 'Inside the braces', command: 'vi{', description: 'Select a brace-delimited text object from anywhere inside it.', tip: 'The inner object excludes the braces themselves.', make(v) {
    const inside=` ${names[v % 4]}: true `,code=`const settings = {${inside}};\n\nconsole.log(settings);`,from=code.indexOf('{')+1;
    return selection(code,from+3,from,code.indexOf('}'),'Select the contents of the object, excluding its braces.', ['v','i','{']);
  } },
  { id: 'select-block', category: 'Selection', title: 'Think in columns', command: 'Ctrl+v', description: 'Blockwise Visual mode selects a rectangle across several lines.', tip: 'Hold Control and press v, then move down twice and right twice.', make(v) {
    const code=`// ${names[v % 4]}\nlet red = 1;\nlet sun = 2;\nlet fog = 3;`,start=code.indexOf('let'),ranges:[number,number][]=[];
    let pos=start;for(let i=0;i<3;i++){ranges.push([pos,pos+3]);pos=code.indexOf('\n',pos)+1;}
    return {code,start,goal:{kind:'block',ranges},task:'Select the three let keywords as a rectangular block.',steps:['Ctrl+v','j','j','l','l']};
  } },
  ...visualLessons,
  ...copyLessons,
  { id: 'change-word', category: 'Editing', title: 'Give it a new name', command: 'ciw', description: 'Change inside word removes the word and immediately enters Insert mode.', tip: 'c = change · iw = inside word. Finish your replacement with Escape.', make(v) {
    const old=names[v % 4],next=values[v % 4],code=wrap(`const ${old} = true;`,v),at=code.indexOf(old);
    return doc(code,at+1,code.replace(`const ${old}`,`const ${next}`),`Rename “${old}” to “${next}” using ciw.`, ['c','i','w',`type:${next}`,'Esc']);
  } },
  { id: 'delete-line', category: 'Editing', title: 'Clear a whole line', command: 'dd', description: 'Repeating the delete operator acts on the whole current line.', tip: 'Deleted text is also placed in a register, ready for p.', make(v) {
    const code=wrap(`const ${names[v % 4]} = true;`,v),from=code.indexOf('  const'),to=code.indexOf('\n',from)+1;
    return doc(code,from+2,code.slice(0,from)+code.slice(to),'Remove the entire const declaration line.', ['d','d']);
  } },
  { id: 'copy-line', category: 'Editing', title: 'Yank it, then put it', command: 'yy · p', description: 'Yank copies text. Put inserts the copied text after the cursor, or below it for whole lines.', tip: 'yy copies the line. p puts a copy below it.', make(v) {
    const code=wrap(`const ${names[v % 4]} = true;`,v),from=code.indexOf('  const'),to=code.indexOf('\n',from)+1;
    return doc(code,from+2,code.slice(0,to)+code.slice(from,to)+code.slice(to),'Duplicate the const declaration directly below itself.', ['y','y','p']);
  } },
  { id: 'change-string', category: 'Editing', title: 'Change the mood', command: 'ci"', description: 'Change a string’s contents while keeping its quotation marks. Quote text objects can also find the next quoted string on this line.', tip: 'Use ci" from inside the string or before its opening quote. You do not need to move onto the first letter first.', make(v) {
    const old=names[v % 4],next=values[v % 4],code=wrap(`const mood = "${old}";`,v),at=code.indexOf(`"${old}`)+1;
    return doc(code,v%2===0?code.indexOf('const'):at+2,code.replace(`"${old}"`,`"${next}"`),`Replace the string “${old}” with “${next}”.`,['c','i','"',`type:${next}`,'Esc']);
  } },
  { id: 'delete-arguments', category: 'Editing', title: 'Empty the parentheses', command: 'di(', description: 'Delete an inner text object without entering Insert mode.', tip: 'd = delete · i( = inside parentheses. The parentheses stay in place.', make(v) {
    const name=names[v % 4],code=`summon("${name}", true);\n\n// Ready for a fresh start.`,from=code.indexOf('(')+1,to=code.indexOf(')');
    return doc(code,from+3,code.slice(0,from)+code.slice(to),'Remove all arguments inside summon(...).', ['d','i','(']);
  } },
  { id: 'repeat', category: 'Editing', title: 'A dot does a lot', command: '.', description: 'The dot command repeats your last change. Pair it with movement to avoid retyping an edit.', tip: 'Delete the first extra character with x, move down, and repeat with dot.', make(v) {
    const name=names[v % 4],code=`xx${name}\nxx${values[v % 4]}\n// Remove one x from each line.`;
    return doc(code,0,code.replace(`xx${name}`,`x${name}`).replace(`xx${values[v % 4]}`,`x${values[v % 4]}`),'Remove one leading x on each of the first two lines.', ['x','j','.']);
  } },
  ...operatorLessons,
  { id: 'search', category: 'Search & jumps', title: 'Find your way', command: '/', description: 'Search forward for text. Enter confirms the search; Escape cancels an unfinished search.', tip: 'Type /, the search text, then Enter.', make(v) {
    const word=names[v % 4],code=wrap(`const ${word} = true;`,v);
    return cursor(code,0,code.indexOf(word),`Search forward for “${word}”.`, ['/ ',`type:${word}`,'Enter'].map(s=>s.trim()));
  } },
  { id: 'next-match', category: 'Search & jumps', title: 'Follow the matches', command: 'n', description: 'After searching, n follows the search direction to another match. N goes the opposite way.', tip: 'Search for the variable, then press n to reach its second occurrence.', make(v) {
    const word=names[v % 4],code=`// Follow the light\nconst ${word} = true;\nconsole.log(${word});`;
    return cursor(code,0,code.lastIndexOf(word),`Search for “${word}”, then move to its next match.`, ['/',`type:${word}`,'Enter','n']);
  } },
  { id: 'find-character', category: 'Search & jumps', title: 'One character away', command: 'f', description: 'Find a character ahead on the current line and land directly on it.', tip: 'f searches only the current line. Follow it with the character you want.', make(v) {
    const code=wrap(`const ${names[v % 4]} = true;`,v);
    return cursor(code,code.indexOf('const'),code.indexOf('='),'Find the equals sign on the current line.', ['f','=']);
  } },
  { id: 'till-character', category: 'Search & jumps', title: 'Stop just before', command: 't', description: 'Till moves to the character immediately before a target on the same line.', tip: 't; stops one character before the semicolon.', make(v) {
    const code=wrap(`const ${names[v % 4]} = true;`,v);
    return cursor(code,code.indexOf('const'),code.indexOf(';')-1,'Stop just before the semicolon.', ['t',';']);
  } },
  { id: 'match-bracket', category: 'Search & jumps', title: 'Meet your other half', command: '%', description: 'Jump between matching parentheses, brackets, and braces.', tip: 'Place the cursor on a bracket and press %. It works across lines too.', make(v) {
    const code=wrap(`const ${names[v % 4]} = true;`,v);
    return cursor(code,code.indexOf('{'),code.indexOf('}'),'Jump from the opening function brace to its matching closing brace.', ['%']);
  } },
  ...motionLessons.filter(lesson => lesson.category === 'Search & jumps'),
];

export function expandSteps(steps: string[]): string[] { return steps.flatMap(s => s.startsWith('type:') ? [...s.slice(5)] : [s]); }
export const sandboxCode = '// A quiet place to practice. Nothing here can break.\n\nfunction summon(name) {\n  const greeting = `Hello, ${name}`;\n  const supplies = ["pumpkin", "candle", "spellbook"];\n\n  return { greeting, supplies };\n}\n\nconst ghost = summon("Casper");\nconsole.log(ghost.greeting);\n';
