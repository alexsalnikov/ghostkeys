import type { Exercise, Lesson } from './lessons';

const spirits = ['ghost', 'wisp', 'phantom', 'specter'];
const places = ['attic', 'crypt', 'tower', 'cellar'];
function cursor(code: string, start: number, at: number, task: string, steps: string[]): Exercise {
  return { code, start, goal: { kind: 'cursor', at }, task, steps };
}
const call = (v: number) => `${spirits[v]}.haunt(${places[v]});`;

// Original scenes pair a contrast with a concrete destination.
export const motionLessons: Lesson[] = [
  {
    id: 'WORD-forward', category: 'Movement', title: 'Float past the punctuation', command: 'W',
    description: 'A lowercase w stops at punctuation boundaries. Capital W skips a whole chunk of nonblank text: a Vim WORD.',
    tip: 'From the spirit’s name, w lands on the dot. W crosses the entire call to return, the next whitespace-separated chunk.',
    make(v) {
      const code = `// Cross the haunted hallway\n${call(v)} return lantern;\n// Punctuation lives inside this WORD.`;
      return cursor(code, code.indexOf(call(v)), code.indexOf('return'), 'Skip the whole haunted call and land on return.', ['W']);
    },
  },
  {
    id: 'WORD-back', category: 'Movement', title: 'Drift back through the doorway', command: 'B',
    description: 'Capital B goes to the beginning of a WORD. Dots, parentheses, and semicolons do not split a WORD; whitespace does.',
    tip: 'b would stop within the call at punctuation. B returns to the beginning of the entire chunk.',
    make(v) {
      const code = `// Return to your friendly spirit\n${call(v)} return lantern;`;
      return cursor(code, code.indexOf('return'), code.indexOf(call(v)), 'Jump back from return to the spirit at the start of the call.', ['B']);
    },
  },
  {
    id: 'WORD-end', category: 'Movement', title: 'Reach the far side of a spell', command: 'E',
    description: 'e targets the end of a small word. Capital E reaches the end of a WORD, including its attached punctuation.',
    tip: 'e stops at the end of the spirit’s name. E lands on the semicolon. Use Shift+e for capital E.',
    make(v) {
      const code = `// One spell, one WORD\n${call(v)} return lantern;`;
      return cursor(code, code.indexOf(call(v)), code.indexOf(';'), 'Reach the semicolon attached to the haunted call.', ['E']);
    },
  },
  {
    id: 'previous-word-end', category: 'Movement', title: 'Catch the previous whisper', command: 'ge',
    description: 'b goes to a word’s beginning. ge goes backward to a word’s ending—handy when you want to append to it.',
    tip: 'Press g, then e. From the beginning of lantern, land on the last letter of the spirit’s name.',
    make(v) {
      const phrase = `${spirits[v]} lantern moonlight`, code = `// Listen for the last letter\n// ${phrase}`;
      return cursor(code, code.indexOf('lantern'), code.indexOf(phrase) + spirits[v].length - 1, 'Land on the last letter of the word before lantern.', ['g', 'e']);
    },
  },
  {
    id: 'previous-WORD-end', category: 'Movement', title: 'The tail of the last spell', command: 'gE',
    description: 'gE moves backward to a WORD’s ending. It is the backward partner of E, just as ge is the partner of e.',
    tip: 'From inside lantern, ge lands on the preceding dot. gE skips that boundary and reaches the previous WORD’s semicolon.',
    make(v) {
      const code = `// Look behind the current WORD\n${call(v)} return.lantern;`;
      return cursor(code, code.indexOf('lantern') + 2, code.indexOf(';'), 'Jump backward to the semicolon ending the haunted call.', ['g', 'E']);
    },
  },
  {
    id: 'counted-words', category: 'Movement', title: 'Count your footsteps', command: '3w',
    description: 'Put a count before a motion to repeat it. Three words ahead becomes 3w instead of w, w, w.',
    tip: 'The number is typed first, not held with w. Counts also work with j, k, and many other motions.',
    make(v) {
      const count = [3, 2, 4, 3][v], words = [spirits[v], 'candle', 'moon', 'lantern', 'doorway'];
      const code = `// Leave quiet footprints\n// ${words.join(' ')}`;
      return cursor(code, code.indexOf(words[0]), code.indexOf(words[count]), `Move ${count} words ahead to ${words[count]} with a count.`, [String(count), 'w']);
    },
  },
  {
    id: 'line-last-nonblank', category: 'Movement', title: 'Leave the empty shadows behind', command: 'g_',
    description: '$ reaches the very end of a line, including trailing spaces. g_ stops on its last nonblank character.',
    tip: 'There are spaces after this semicolon. Press g, then underscore (Shift+- on a US keyboard) to stop before them.',
    make(v) {
      const code = `// This spell has trailing spaces\n  ${call(v)}${' '.repeat(v + 3)}\n// The semicolon is the last visible character.`;
      return cursor(code, code.indexOf(call(v)), code.indexOf(';'), 'Reach the semicolon while ignoring the trailing spaces.', ['g', '_']);
    },
  },
  {
    id: 'paragraphs', category: 'Movement', title: 'Slip between haunted rooms', command: '} · {',
    description: 'Blank lines divide these rooms into paragraphs. } moves forward to a paragraph boundary; { moves backward.',
    tip: 'These motions follow paragraph boundaries, not matching code braces. In these scenes, the boundary is an empty line.',
    make(v) {
      const code = `// ${spirits[v]} lights a candle\nlight("${places[v]}");\n\n// A quiet landing\nlisten();\n\n// A hidden room\nunlock();`;
      const backward = v % 2 === 1, start = backward ? code.indexOf('unlock') : 0;
      const at = backward ? code.indexOf('\n\n', code.indexOf('listen')) + 1 : code.indexOf('\n\n') + 1;
      return cursor(code, start, at, `Move ${backward ? 'backward' : 'forward'} to the nearest blank-line boundary.`, [backward ? '{' : '}']);
    },
  },
  {
    id: 'numbered-line', category: 'Movement', title: 'An address in the attic', command: '5gg',
    description: 'gg goes to the first line. A line number before gg takes you straight to that line’s first nonblank character.',
    tip: 'Use the line numbers at the left: 5gg means line 5, not five lines down. The destination skips indentation.',
    make(v) {
      const lines = ['// The attic directory', 'function explore() {', `  greet("${spirits[v]}");`, '  light();', '  listen();', '  unlock();', '}', 'explore();'];
      const line = [5, 4, 6, 3][v], code = lines.join('\n'), at = lines.slice(0, line - 1).join('\n').length + 3;
      return cursor(code, code.lastIndexOf('explore'), at, `Go directly to the first nonblank character of line ${line}.`, [String(line), 'g', 'g']);
    },
  },
  {
    id: 'backward-find', category: 'Search & jumps', title: 'Find what lurks behind you', command: 'F',
    description: 'f looks ahead on the current line. Capital F finds a character behind the cursor and lands directly on it.',
    tip: 'F( finds the previous opening parenthesis. It cannot reach a parenthesis on a different line.',
    make(v) {
      const code = `// Retrace the summoning circle\n${call(v)}`;
      return cursor(code, code.lastIndexOf(';'), code.indexOf('('), 'Find the opening parenthesis behind you on this line.', ['F', '(']);
    },
  },
  {
    id: 'backward-till', category: 'Search & jumps', title: 'Stay just inside the doorway', command: 'T',
    description: 'Capital T is the backward version of t. It stops just to the right of a target character on the same line.',
    tip: 'F( lands on the parenthesis. T( lands one character to its right: the start of the room name.',
    make(v) {
      const code = `// Stop inside the circle\n${call(v)}`;
      return cursor(code, code.lastIndexOf(';'), code.indexOf('(') + 1, 'Move backward and stop just inside the opening parenthesis.', ['T', '(']);
    },
  },
  {
    id: 'repeat-find', category: 'Search & jumps', title: 'Follow the lantern trail', command: '; · ,',
    description: '; repeats your last f, F, t, or T motion in its original direction. Comma repeats it in the opposite direction.',
    tip: 'Find the first comma, repeat twice, then retrace once. These repeats stay on this line; n and N repeat a / or ? search.',
    make(v) {
      const code = `// Retrace one lantern on the trail\npack(${spirits[v]},candle,lantern,key);`;
      const first = code.indexOf(','), second = code.indexOf(',', first + 1);
      return cursor(code, code.indexOf('pack'), second, 'Find the first comma, visit the next two, then return to the second.', ['f', ',', ';', ';', ',']);
    },
  },
  {
    id: 'counted-find', category: 'Search & jumps', title: 'Choose a summoning circle', command: '3f[',
    description: 'Counts work with character searches too. 3f[ goes directly to the third opening bracket ahead on this line.',
    tip: 'Type the number, then f, then [. This counts matching characters—not words or nesting levels.',
    make(v) {
      const count = [3, 2, 4, 3][v], code = `// Choose a circle by number\nconst ${spirits[v]} = [[1], [2], [3]];`;
      const targets = [...code.matchAll(/\[/g)].map(match => match.index!);
      return cursor(code, code.indexOf('const'), targets[count - 1], `Find opening bracket number ${count} on the declaration line.`, [String(count), 'f', '[']);
    },
  },
  {
    id: 'backward-search', category: 'Search & jumps', title: 'Hear a whisper behind you', command: '?',
    description: '/ searches forward through the file. ? searches backward. A short, distinctive fragment is often enough to find your target.',
    tip: 'Type ?, the first three letters of the spirit’s name, then Enter. Esc cancels an unfinished search.',
    make(v) {
      const code = `// A whisper in the rafters\nconst ${spirits[v]} = true;\n\nlight("${places[v]}");\n// You are here`;
      return cursor(code, code.lastIndexOf('//'), code.indexOf(spirits[v]), `Search backward for ${spirits[v]} using just “${spirits[v].slice(0, 3)}”.`, ['?', `type:${spirits[v].slice(0, 3)}`, 'Enter']);
    },
  },
  {
    id: 'reverse-match', category: 'Search & jumps', title: 'Turn the haunting around', command: 'N',
    description: 'n follows the direction of your last search. N goes the opposite way, so after a ? search, N moves forward.',
    tip: 'Search backward from the bottom line to the middle spirit, then use N to reach the bottom spirit. N does not always mean up.',
    make(v) {
      const word = spirits[v], code = `// Three sightings\nsee("${word}");\nsee("${word}");\nsee("${word}");`;
      return cursor(code, code.lastIndexOf('see'), code.lastIndexOf(word), 'Search backward to the middle sighting, then use N to reach the bottom one.', ['?', `type:${word}`, 'Enter', 'N']);
    },
  },
  {
    id: 'ghost-circuit', category: 'Search & jumps', title: 'The midnight delivery', command: 'f[ · % · j · $',
    description: 'Put familiar motions together: find a bracket, cross to its partner, then move down and finish the delivery line.',
    tip: 'f[ reaches the opening bracket; % reaches its partner. j moves down one line, and $ lands on its final semicolon.',
    make(v) {
      const code = `// Deliver a parcel to the ${spirits[v]}\nconst parcel = ["candle", "${places[v]}"];\ndeliver(parcel);\n\n// A little practice lights the way.`;
      return cursor(code, code.indexOf('const'), code.indexOf(';', code.indexOf('deliver(parcel)')), 'Cross the parcel’s brackets, then land on the semicolon of deliver(parcel).', ['f', '[', '%', 'j', '$']);
    },
  },
];
