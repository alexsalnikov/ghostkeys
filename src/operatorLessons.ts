import type { Exercise, Lesson } from './lessons';

const spirits = ['ghost', 'wisp', 'phantom', 'specter'];
const lights = ['candle', 'lantern', 'moonbeam', 'starlight'];
const moods = ['calm', 'kind', 'cozy', 'warm'];
function edit(code: string, start: number, text: string, task: string, steps: string[], language: Exercise['language'] = 'javascript'): Exercise {
  return { code, start, goal: { kind: 'document', text }, task, steps, language };
}

export const operatorLessons: Lesson[] = [
  {
    id: 'operator-count', category: 'Editing', title: 'Build a little editing spell', command: 'd2w',
    description: 'An operator says what to do; a motion says how far. In d2w, d deletes, 2 counts, and w moves by words.',
    tip: 'd2w removes two words from here, including the spaces before the next word. If an edit goes astray, u undoes it; Ctrl+r redoes it.',
    make(v) {
      const line = `sleepy dusty ${spirits[v]} welcomes you`, code = `// Sweep away two dusty words\n// ${line}`;
      return edit(code, code.indexOf('sleepy'), code.replace('sleepy dusty ', ''), 'Remove sleepy and dusty, leaving the spirit’s greeting.', ['d', '2', 'w']);
    },
  },
  {
    id: 'search-delete-word', category: 'Editing', title: 'An echo in the welcome sign', command: '/ · dw',
    description: 'Use a search to reach an unwanted word, then dw to remove it. Navigation and editing become one small repair.',
    tip: 'Find the first repeated welcome, confirm with Enter, then delete one word. The remaining welcome and its spacing stay intact.',
    make(v) {
      const code = `// A sign for the ${spirits[v]}\nconst sign = "welcome welcome home";`;
      return edit(code, 0, code.replace('welcome welcome', 'welcome'), 'Remove the duplicated welcome from the sign.', ['/', 'type:welcome', 'Enter', 'd', 'w']);
    },
  },
  {
    id: 'delete-counted-lines', category: 'Editing', title: 'Sweep the dusty staircase', command: '3dd',
    description: 'Doubling d targets a whole line. A count before dd removes that many complete lines, including their line breaks.',
    tip: 'Three lines need clearing, so use 3dd. Unlike d3j, this removes three lines total, not the current line plus three more.',
    make(v) {
      const dust = `dust("${spirits[v]}");\ndust("${lights[v]}");\ndust("stairs");\n`, code = `// Keep the light burning\n${dust}light();`;
      return edit(code, code.indexOf('dust('), code.replace(dust, ''), 'Remove the three dust calls and keep light().', ['3', 'd', 'd']);
    },
  },
  {
    id: 'delete-tail', category: 'Editing', title: 'A quieter guestbook', command: 'D',
    description: 'Capital D deletes from the cursor to the end of the line. It is shorthand for d$, and it leaves the line break in place.',
    tip: 'The cursor starts on the space before the extra note. D removes that space and the rest of the note in one action.',
    make(v) {
      const note = ' // dusty old note', code = `// A quieter guestbook\nwelcome("${spirits[v]}");${note}\nlight();`;
      return edit(code, code.indexOf(note), code.replace(note, ''), 'Remove the trailing note and its leading space; keep the welcome call.', ['D']);
    },
  },
  {
    id: 'delete-till', category: 'Editing', title: 'Keep the silver boundary', command: 'dt;',
    description: 'Combine d with t to delete up to a character without deleting that character. The same motion now describes an edit.',
    tip: 'dt; leaves the semicolon. df; would include it. Delimiter choice determines what survives the spell.',
    make(v) {
      const extra = ` + "dusty ${spirits[v]}"`, code = `// Preserve the semicolon\nconst light = "${lights[v]}"${extra};`;
      return edit(code, code.indexOf(extra), code.replace(extra, ''), 'Remove the extra string addition but leave the semicolon.', ['d', 't', ';']);
    },
  },
  {
    id: 'delete-to-search', category: 'Editing', title: 'Clear a path to the lantern', command: 'd/ · Enter',
    description: 'A search can be the motion after an operator. d/pattern deletes up to the match when you confirm with Enter.',
    tip: 'The search match marks where deletion stops. The spirit’s name and its surrounding quotes remain; Enter confirms the edit.',
    make(v) {
      const code = `// Clear the dust from this path\nconst path = "dust cobweb ${spirits[v]}";\nrest();`;
      return edit(code, code.indexOf('dust cobweb'), code.replace('dust cobweb ', ''), `Delete from dust up to ${spirits[v]}, leaving the name and quotes intact.`, ['d', '/', `type:${spirits[v]}`, 'Enter']);
    },
  },
  {
    id: 'change-word-tail', category: 'Editing', title: 'Mend the end of a name', command: 'cw',
    description: 'Inside a word, cw changes from the cursor through that word’s ending. ciw would replace the entire word instead.',
    tip: 'The cursor is after the prefix night. cw changes only the suffix and leaves the following space. Finish with Esc.',
    make(v) {
      const code = `// A new name for our visitor\n// nightshade ${spirits[v]}`, next = lights[v];
      return edit(code, code.indexOf('shade'), code.replace('nightshade', `night${next}`), `Keep night and replace shade with ${next}.`, ['c', 'w', `type:${next}`, 'Esc']);
    },
  },
  {
    id: 'change-till', category: 'Editing', title: 'A gentler glow', command: 'ct;',
    description: 'c deletes the motion’s range and enters Insert mode. ct; replaces an expression while preserving its semicolon.',
    tip: 'c = change, t; = until the semicolon. The replacement and its deletion form one change that dot can repeat.',
    make(v) {
      const code = `// Dial down the glow\nconst ${spirits[v]} = oldGlow + 9;`, replacement = String(v + 1);
      return edit(code, code.indexOf('oldGlow'), code.replace('oldGlow + 9', replacement), `Replace oldGlow + 9 with ${replacement}, keeping the semicolon.`, ['c', 't', ';', `type:${replacement}`, 'Esc']);
    },
  },
  {
    id: 'change-whole-line', category: 'Editing', title: 'Rewrite a line in the spellbook', command: 'cc',
    description: 'cc replaces a whole line and enters Insert mode. In this editor, the line’s existing indentation is preserved.',
    tip: 'Type cc, write the new call, and press Esc. You can begin anywhere on the old line.',
    make(v) {
      const old = '  rattle();', replacement = `welcome("${spirits[v]}");`, code = `function visit() {\n${old}\n}`;
      return edit(code, code.indexOf('rattle') + 2, code.replace(old, `  ${replacement}`), `Replace rattle() with ${replacement}, keeping the indentation.`, ['c', 'c', `type:${replacement}`, 'Esc']);
    },
  },
  {
    id: 'change-tail', category: 'Editing', title: 'Finish the invitation', command: 'C',
    description: 'Capital C changes from the cursor to the end of the line. It is c$ in one key; unlike D, it enters Insert mode.',
    tip: 'C also removes the existing semicolon. Include a new semicolon when you type the replacement, then press Esc.',
    make(v) {
      const code = `// Leave a kind invitation\nconst mood = "gloomy ${spirits[v]}";`, replacement = `"${moods[v]}";`;
      return edit(code, code.indexOf('"'), code.slice(0, code.indexOf('"')) + replacement, `Replace the quoted value with "${moods[v]}" and finish the statement.`, ['C', `type:${replacement}`, 'Esc']);
    },
  },
  {
    id: 'repeat-word-change', category: 'Editing', title: 'Teach two ghosts the same trick', command: 'ciw · j · .',
    description: 'A change made with ciw includes the replacement text. Dot repeats that whole change on the next word, even from inside it.',
    tip: 'Change the first word, press Esc, move down with j, and press dot. ciw works from inside either word; cw would only change its tail.',
    make(v) {
      const word = spirits[v], replacement = lights[v], code = `${word}\n${word}\n// Both visitors carry a light now.`;
      return edit(code, 2, code.replaceAll(word, replacement), `Replace both ${word} words with ${replacement}, using dot for the second.`, ['c', 'i', 'w', `type:${replacement}`, 'Esc', 'j', '.']);
    },
  },
  {
    id: 'search-repeat-change', category: 'Editing', title: 'A trail of kinder spirits', command: '/ · ciw · n.',
    description: 'Pair two repeaters: n finds the next search match and dot repeats your last edit. Make one good change, then reuse it.',
    tip: 'Search for the old mood, change its whole word, and press Esc. n and dot repair the second sighting without retyping the replacement.',
    make(v) {
      const old = ['gloomy', 'grumpy', 'dreary', 'chilly'][v], next = moods[v];
      const code = `// Two sightings to brighten\nvisit("${old} ${spirits[v]}");\nvisit("${old} ${lights[v]}");`;
      return edit(code, 0, code.replaceAll(old, next), `Replace both ${old} words with ${next}; repeat the second edit with n and dot.`, ['/', `type:${old}`, 'Enter', 'c', 'i', 'w', `type:${next}`, 'Esc', 'n', '.']);
    },
  },
  {
    id: 'delete-around-word', category: 'Editing', title: 'No gap in the ghost story', command: 'daw',
    description: 'iw targets the word itself. aw includes adjacent whitespace, so deleting an unwanted word can leave tidy spacing.',
    tip: 'Here daw removes dusty and its following space, even from the middle of the word. diw would leave both surrounding spaces.',
    make(v) {
      const code = `// A dusty ${spirits[v]} carries a ${lights[v]}.`;
      return edit(code, code.indexOf('dusty') + 2, code.replace('dusty ', ''), 'Remove dusty and one adjacent space, keeping the sentence neatly spaced.', ['d', 'a', 'w']);
    },
  },
  {
    id: 'delete-around-quotes', category: 'Editing', title: 'Lift the whole glass jar', command: 'da"',
    description: 'i" means the contents inside quotes. a" includes the quotation marks themselves, so the entire string can be removed.',
    tip: 'da" removes the string and its quotes here. di" would leave empty quotes; the surrounding parentheses are a separate object.',
    make(v) {
      const quoted = `"${spirits[v]}"`, code = `// Open the jar\nsummon(${quoted});`;
      return edit(code, code.indexOf(spirits[v]) + 1, code.replace(quoted, ''), 'Remove the quoted argument entirely, leaving summon().', ['d', 'a', '"']);
    },
  },
  {
    id: 'change-array', category: 'Editing', title: 'Pack one comforting thing', command: 'ci[',
    description: 'Text objects describe a structure rather than a cursor distance. ci[ replaces an array’s contents while keeping its brackets.',
    tip: 'Start anywhere inside the array. ci[ removes its contents and enters Insert mode; include quotes around the new item.',
    make(v) {
      const inside = '"cobweb", "dust", "old bell"', code = `// A lighter bag for the ${spirits[v]}\nconst bag = [${inside}];`;
      return edit(code, code.indexOf('dust') + 1, code.replace(inside, `"${lights[v]}"`), `Replace the bag’s contents with just "${lights[v]}".`, ['c', 'i', '[', `type:"${lights[v]}"`, 'Esc']);
    },
  },
  {
    id: 'delete-paragraph', category: 'Editing', title: 'Retire an old haunting', command: 'dap',
    description: 'ap selects a paragraph together with adjacent blank lines. dap removes a whole note without counting its lines.',
    tip: 'The cursor is inside the old note. dap clears its paragraph and the following blank line; dip would leave the blank separator.',
    make(v) {
      const old = `Old notes for the ${spirits[v]}\nRattle every window.\nHide every ${lights[v]}.\n\n`;
      const keep = 'New notes\nWelcome every visitor.', code = old + keep;
      return edit(code, code.indexOf('Rattle'), keep, 'Remove the old paragraph and its blank separator, preserving the new notes.', ['d', 'a', 'p'], 'text');
    },
  },
  {
    id: 'change-tag', category: 'Editing', title: 'A new name on the door', command: 'cit',
    description: 'it targets the contents inside a matching HTML tag pair. cit rewrites that content while keeping the tags and their attributes.',
    tip: 'The cursor is in the label. cit preserves both span tags; cat would include the surrounding tags as well.',
    make(v) {
      const code = `<section>\n  <span class="visitor">${spirits[v]}</span>\n</section>`;
      return edit(code, code.indexOf(spirits[v]) + 1, code.replace(spirits[v], moods[v]), `Replace the visitor label with ${moods[v]}, keeping the span and its class.`, ['c', 'i', 't', `type:${moods[v]}`, 'Esc'], 'html');
    },
  },
  {
    id: 'yank-word', category: 'Editing', title: 'A name worth keeping', command: 'yiw · p',
    description: 'y copies without deleting. Pair it with iw to copy a whole word, then use p to put the copied text after the cursor.',
    tip: 'yiw copies the variable into a Vim register. f" reaches the opening quote; p fills the empty string. This is not the system clipboard.',
    make(v) {
      const word = spirits[v], code = `// Give the spirit its own name\nconst ${word} = "";`;
      return edit(code, code.indexOf(`const ${word}`) + 8, code.replace('""', `"${word}"`), 'Copy the variable name into the empty string without retyping it.', ['y', 'i', 'w', 'f', '"', 'p']);
    },
  },
  {
    id: 'case-word', category: 'Editing', title: 'Whispers and announcements', command: 'guiw · gUiw',
    description: 'gu lowercases a range; gU uppercases it. Combine either operator with iw to change a whole word from anywhere inside it.',
    tip: 'g, u, i, w makes a word lowercase. Use capital U for uppercase. Neither command enters Insert mode.',
    make(v) {
      const upper = v % 2 === 1, word = upper ? spirits[v] : spirits[v].toUpperCase(), next = upper ? word.toUpperCase() : word.toLowerCase();
      const code = `// Set the volume of this name\nconst label = "${word}";`;
      return edit(code, code.indexOf(word) + 1, code.replace(word, next), `Make the quoted name ${upper ? 'UPPERCASE' : 'lowercase'}.`, ['g', upper ? 'U' : 'u', 'i', 'w']);
    },
  },
  {
    id: 'shift-indentation', category: 'Editing', title: 'Make room in the hallway', command: '>> · <<',
    description: '>> shifts a line one indentation level to the right. << shifts it left. Doubling these operators targets a whole line.',
    tip: 'This practice space uses two spaces per indentation level. The task tells you which direction this line needs.',
    make(v) {
      const right = v % 2 === 0, call = `welcome("${spirits[v]}");`, line = `${right ? '' : '    '}${call}`;
      const code = `function visit() {\n${line}\n}`;
      return edit(code, code.indexOf(call), code.replace(line, `  ${call}`), `Shift the welcome line ${right ? 'right' : 'left'} by one level so it has two leading spaces.`, right ? ['>', '>'] : ['<', '<']);
    },
  },
  {
    id: 'reindent-line', category: 'Editing', title: 'Straighten the crooked candle', command: '==',
    description: 'The = operator reindents code using the editor’s indentation rules. == applies it to the current line.',
    tip: 'Reindent this line within its function. = adjusts indentation; it is not a general formatter that rewrites the whole statement.',
    make(v) {
      const call = `light("${lights[v]}");`, line = `${' '.repeat(v + 5)}${call}`, code = `function prepare() {\n${line}\n}`;
      return edit(code, code.indexOf(call), code.replace(line, `  ${call}`), 'Reindent the light call to match its function body.', ['=', '=']);
    },
  },
  {
    id: 'replace-character', category: 'Editing', title: 'One letter of moonlight', command: 'r',
    description: 'r replaces the character under the cursor with the next character you type. You stay in Normal mode throughout.',
    tip: 'Type r, then the correct letter. Unlike s, r does not open an Insert session.',
    make(v) {
      const word = spirits[v], wrong = word.slice(0, 1) + 'z' + word.slice(2), code = `// Repair the guest list\nconst name = "${wrong}";`;
      return edit(code, code.indexOf(wrong) + 1, code.replace(wrong, word), `Replace the z with ${word[1]} to spell ${word}.`, ['r', word[1]]);
    },
  },
  {
    id: 'swap-characters', category: 'Editing', title: 'Untangle two tiny footprints', command: 'xp',
    description: 'x deletes the character under the cursor into a register. p puts it after the next character, swapping this adjacent pair.',
    tip: 'Start on the first misplaced letter. x removes it; p puts it back one character later. Deleted text is available in Vim’s register.',
    make(v) {
      const word = spirits[v], wrong = word[1] + word[0] + word.slice(2), code = `// Two footprints crossed\nconst name = "${wrong}";`;
      return edit(code, code.indexOf(wrong), code.replace(wrong, word), `Swap the first two letters to spell ${word}.`, ['x', 'p']);
    },
  },
  {
    id: 'substitute-character', category: 'Editing', title: 'A spark becomes a glow', command: 's',
    description: 's removes the character under the cursor and enters Insert mode. Replace that one character with as much text as you need.',
    tip: 's acts like cl, changing the character under the cursor. Type the new name and press Esc to finish.',
    make(v) {
      const code = '// A small spark, a bigger welcome\nconst name = "?";';
      return edit(code, code.indexOf('?'), code.replace('?', spirits[v]), `Replace the question mark with ${spirits[v]}.`, ['s', `type:${spirits[v]}`, 'Esc']);
    },
  },
  {
    id: 'toggle-character-case', category: 'Editing', title: 'Lower your ghostly voice', command: '~',
    description: 'In Normal mode, ~ toggles the case of the character under the cursor and advances. Use it for a tiny capitalization fix.',
    tip: 'On a US keyboard, ~ is Shift+backtick. For a whole word, use guiw or gUiw instead.',
    make(v) {
      const word = spirits[v], wrong = word[0].toUpperCase() + word.slice(1), code = `// A quieter label\nconst name = "${wrong}";`;
      return edit(code, code.indexOf(wrong), code.replace(wrong, word), `Toggle the first letter so the label reads ${word} in lowercase.`, ['~']);
    },
  },
];
