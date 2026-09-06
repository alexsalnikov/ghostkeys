import { expect, type Page } from '@playwright/test';
import { test } from './fixture';
import { emptyProgress, emptyResult, storageKey } from '../src/progress';
import { lessons, expandSteps } from '../src/lessons';

async function choose(page: Page, id: string) {
  const data=emptyProgress();data.current=id;data.lessons[id]=emptyResult();
  await page.addInitScript(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),{key:storageKey,data});
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByRole('textbox',{name:'Vim practice editor'})).toBeFocused();
}
async function press(page: Page, keys: string[]) {
  for(const key of keys)await page.keyboard.press(key==='Esc'?'Escape':key===' '?'Space':key);
}
const buffer=(page: Page)=>page.locator('.cm-content .cm-line').allTextContents().then(lines=>lines.join('\n'));

test('cw replaces only the word tail and waits for Escape before success',async({page})=>{
  await choose(page,'change-word-tail');
  await press(page,['c','w']);
  await expect(page.getByTestId('vim-mode')).toHaveText('INSERT');
  expect(await buffer(page)).toContain('night ghost');
  await page.keyboard.type('candle');
  expect(await buffer(page)).toContain('nightcandle ghost');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('success')).toBeVisible();
});

test('dt preserves the delimiter while df includes it',async({page})=>{
  await choose(page,'delete-till');
  await press(page,['d','f',';']);
  expect(await buffer(page)).not.toContain(';');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.getByRole('button',{name:'Reset exercise'}).click();
  await press(page,['d','t',';']);
  expect(await buffer(page)).toContain('const light = "candle";');
  await expect(page.getByTestId('success')).toBeVisible();
});

test('around-word removes the extra gap that inner-word leaves',async({page})=>{
  await choose(page,'delete-around-word');
  await press(page,['d','i','w']);
  expect(await buffer(page)).toContain('A  ghost');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.getByRole('button',{name:'Reset exercise'}).click();
  await press(page,['d','a','w']);
  expect(await buffer(page)).toContain('A ghost');
  await expect(page.getByTestId('success')).toBeVisible();
});

test('inner quotes keep the jar, around quotes remove it',async({page})=>{
  await choose(page,'delete-around-quotes');
  await press(page,['d','i','"']);
  expect(await buffer(page)).toContain('summon("");');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.keyboard.press('u');
  expect(await buffer(page)).toContain('summon("ghost");');
  await press(page,['d','a','"']);
  expect(await buffer(page)).toContain('summon();');
  await expect(page.getByTestId('success')).toBeVisible();
});

test('HTML text objects preserve the containing tags and their attributes',async({page})=>{
  await choose(page,'change-tag');
  await expect(page.locator('.file-bar')).toContainText('midnight.html');
  await expect(page.locator('.editor-status')).toContainText('HTML');
  await press(page,['c','i','t']);
  expect(await buffer(page)).toContain('<span class="visitor"></span>');
  await page.keyboard.type('calm');await page.keyboard.press('Escape');
  await expect(page.getByTestId('success')).toBeVisible();
  expect(await buffer(page)).toBe('<section>\n  <span class="visitor">calm</span>\n</section>');
});

test('yank leaves the document unchanged until put',async({page})=>{
  await choose(page,'yank-word');
  const original=await buffer(page);
  await press(page,['y','i','w']);
  expect(await buffer(page)).toBe(original);
  await expect(page.getByTestId('success')).toHaveCount(0);
  await press(page,['f','"','p']);
  expect(await buffer(page)).toContain('const ghost = "ghost";');
  await expect(page.getByTestId('success')).toBeVisible();
});

test('search confirms an operator edit without skipping its completion',async({page})=>{
  await choose(page,'delete-to-search');
  await press(page,['d','/']);await page.keyboard.type('ghost');
  await page.keyboard.press('Escape');
  expect(await buffer(page)).toContain('dust cobweb ghost');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await press(page,expandSteps(lessons.find(l=>l.id==='delete-to-search')!.make(0).steps));
  await expect(page.getByTestId('success')).toBeVisible();
  await expect(page.getByText('Repetition 1 of 4',{exact:true})).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Repetition 2 of 4',{exact:true})).toBeVisible();
});

test('search and dot demonstration makes both changes without scoring',async({page})=>{
  await choose(page,'search-repeat-change');
  await page.getByRole('button',{name:'Watch it first'}).click();
  await expect(page.getByRole('button',{name:'Now you try'})).toBeVisible({timeout:15000});
  expect(await buffer(page)).toContain('visit("calm ghost");\nvisit("calm candle");');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.getByRole('button',{name:'Now you try'}).click();
  await press(page,expandSteps(lessons.find(l=>l.id==='search-repeat-change')!.make(0).steps));
  await expect(page.getByTestId('success')).toBeVisible();
});
