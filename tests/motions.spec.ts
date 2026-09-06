import { expect, type Page } from '@playwright/test';
import { test } from './fixture';
import { emptyProgress, emptyResult, storageKey } from '../src/progress';
import { lessons } from '../src/lessons';

async function choose(page: Page, id: string, stage = 0) {
  const data = emptyProgress(); data.current = id;
  data.lessons[id] = { ...emptyResult(), stage };
  await page.addInitScript(({key,data}) => localStorage.setItem(key, JSON.stringify(data)), {key:storageKey,data});
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByRole('textbox', {name:'Vim practice editor'})).toBeFocused();
}

for (const [id, smaller, larger, target] of [
  ['WORD-forward', 'w', 'W', '.'],
  ['WORD-end', 'e', 'E', 't'],
  ['previous-WORD-end', 'ge', 'gE', '.'],
] as const) {
  test(`${id} teaches a real punctuation contrast`, async ({page}) => {
    await choose(page, id);
    for (const key of smaller) await page.keyboard.press(key);
    const code = lessons.find(l=>l.id===id)!.make(0).code;
    const line = code.split('\n')[1];
    const column = id==='previous-WORD-end' ? line.lastIndexOf('.')+1 : id==='WORD-end' ? 5 : line.indexOf('.')+1;
    expect(line[column-1]).toBe(target);
    await expect(page.locator('.editor-status')).toContainText(`Ln 2, Col ${column}`);
    await expect(page.getByTestId('success')).toHaveCount(0);
    await page.getByRole('button',{name:'Reset exercise'}).click();
    for (const key of larger) await page.keyboard.press(key);
    await expect(page.getByTestId('success')).toBeVisible();
  });
}

test('semicolon repeats forward and comma retraces the character search', async ({page}) => {
  await choose(page, 'repeat-find');
  const line=lessons.find(l=>l.id==='repeat-find')!.make(0).code.split('\n')[1];
  const positions=[...line.matchAll(/,/g)].map(m=>m.index!+1);
  await page.keyboard.press('f');await page.keyboard.press(',');
  await expect(page.locator('.editor-status')).toContainText(`Ln 2, Col ${positions[0]}`);
  await page.keyboard.press(';');
  await expect(page.locator('.editor-status')).toContainText(`Ln 2, Col ${positions[1]}`);
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.keyboard.press(';');
  await expect(page.locator('.editor-status')).toContainText(`Ln 2, Col ${positions[2]}`);
  await page.keyboard.press(',');
  await expect(page.locator('.editor-status')).toContainText(`Ln 2, Col ${positions[1]}`);
  await expect(page.getByTestId('success')).toBeVisible();
});

test('N reverses a backward search and Enter still advances afterward', async ({page}) => {
  await choose(page, 'reverse-match');
  await page.keyboard.type('?ghost');await page.keyboard.press('Enter');
  await expect(page.locator('.editor-status')).toContainText('Ln 3, Col 6');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.keyboard.press('N');
  await expect(page.locator('.editor-status')).toContainText('Ln 4, Col 6');
  await expect(page.getByTestId('success')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Repetition 2 of 4',{exact:true})).toBeVisible();
});

test('the mixed challenge demonstration reaches its destination without awarding progress', async ({page}) => {
  await choose(page, 'ghost-circuit');
  await page.getByRole('button',{name:'Watch it first'}).click();
  await expect(page.getByRole('button',{name:'Now you try'})).toBeVisible();
  await expect(page.locator('.editor-status')).toContainText('Ln 3, Col 16');
  await expect(page.getByTestId('success')).toHaveCount(0);
});

test('g_ skips trailing blanks, supports counts, selections, and deletion', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('ghostkeys.sandbox.v1', '  ghost;   \n  lantern;\t \n   \n'));
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('button',{name:'Free practice',exact:true}).click();
  for (const key of ['g','_']) await page.keyboard.press(key);
  await expect(page.locator('.editor-status')).toContainText('Ln 1, Col 8');
  // A vertical move keeps the actual column, unlike the sticky end-of-line $.
  await page.keyboard.press('j');
  await expect(page.locator('.editor-status')).toContainText('Ln 2, Col 8');
  for (const key of ['g','g','2','g','_']) await page.keyboard.press(key);
  await expect(page.locator('.editor-status')).toContainText('Ln 2, Col 10');
  for (const key of ['0','v','g','_','y']) await page.keyboard.press(key);
  // Pasting the selected text proves trailing whitespace was excluded.
  for (const key of ['G','p']) await page.keyboard.press(key);
  await expect(page.locator('.cm-content')).toHaveText('  ghost;     lantern;\t      lantern;');
  for (const key of ['g','g','0','d','g','_']) await page.keyboard.press(key);
  await expect(page.locator('.cm-content .cm-line').first()).toHaveText('   ');
  await page.keyboard.press('g');await page.keyboard.press('_');
  await expect(page.locator('.editor-status')).toContainText('Ln 1, Col 1');
});
