import { expect, type Page } from '@playwright/test';
import { test } from './fixture';
import { emptyProgress, emptyResult, storageKey } from '../src/progress';
import { lessons, expandSteps } from '../src/lessons';

async function choose(page: Page, id: string, stage = 0) {
  const data=emptyProgress();data.current=id;data.lessons[id]={...emptyResult(),stage};
  await page.addInitScript(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),{key:storageKey,data});
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByRole('textbox',{name:'Vim practice editor'})).toBeFocused();
}
async function press(page: Page, keys: string[]) {
  for(const key of keys)await page.keyboard.press(key==='Esc'?'Escape':key===' '?'Space':key.startsWith('Ctrl+')?'Control+'+key.slice(5):key);
}
const buffer=(page: Page)=>page.locator('.cm-content .cm-line').allTextContents().then(lines=>lines.join('\n'));

test('Visual selection leaves text intact until an operator is applied',async({page})=>{
  await choose(page,'visual-delete');
  const original=await buffer(page);
  await press(page,['v','a','w']);
  await expect(page.getByTestId('vim-mode')).toHaveText('VISUAL');
  expect(await buffer(page)).toBe(original);
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.keyboard.press('d');
  expect(await buffer(page)).toBe('// A ghost carries a candle.');
  await expect(page.getByTestId('success')).toBeVisible();
});

test('Normal-mode equivalent is accepted in Visual deletion recall',async({page})=>{
  await choose(page,'visual-delete',3);
  await press(page,['d','a','w']);
  expect(await buffer(page)).toBe('// A specter carries a starlight.');
  await expect(page.getByTestId('success')).toBeVisible();
});

test('Escape cancels the selection and requires the original text',async({page})=>{
  await choose(page,'visual-cancel');
  const original=await buffer(page);
  // A same-length edit keeps the target position but must not satisfy cancellation.
  await press(page,['r','X','v','e','Esc']);
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.getByRole('button',{name:'Reset exercise'}).click();
  await press(page,['v','e']);
  expect(await buffer(page)).toBe(original);
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('vim-mode')).toHaveText('NORMAL');
  expect(await buffer(page)).toBe(original);
  await expect(page.getByTestId('success')).toBeVisible();
});

test('block prepend completes only after Escape and preserves outside lines',async({page})=>{
  await choose(page,'block-prepend');
  await press(page,['Ctrl+v','2','j']);
  await expect(page.getByTestId('vim-mode')).toHaveText('VISUAL BLOCK');
  await press(page,['I','/','/',' ']);
  await expect(page.getByTestId('vim-mode')).toHaveText('INSERT');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.keyboard.press('Escape');
  expect(await buffer(page)).toBe('// greet("ghost");\n// light("candle");\n// rest();\n\nlisten();');
  await expect(page.getByTestId('success')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Repetition 2 of 4',{exact:true})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Vim practice editor'})).toBeFocused();
});

test('HTML block change inserts only opening tags before block append',async({page})=>{
  await choose(page,'visual-html-list');
  await press(page,['Ctrl+v','2','j','l','c','<','l','i','>','Esc']);
  expect(await buffer(page)).toBe('<ol>\n<li>greet the ghost\n<li>carry a candle\n<li>follow the moon\n</ol>');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await press(page,['0','Ctrl+v','2','j','$','A','<','/','l','i','>']);
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.keyboard.press('Escape');
  expect(await buffer(page)).toBe('<ol>\n<li>greet the ghost</li>\n<li>carry a candle</li>\n<li>follow the moon</li>\n</ol>');
  await expect(page.getByTestId('success')).toBeVisible();
});

for(const id of ['block-prepend','block-append','block-change','visual-html-list']) {
  test(`${id}: block demonstration matches real keyboard input without scoring`,async({page})=>{
    await choose(page,id);
    const exercise=lessons.find(lesson=>lesson.id===id)!.make(0);
    await page.getByRole('button',{name:'Watch it first'}).click();
    await expect(page.getByRole('button',{name:'Now you try'})).toBeVisible({timeout:20000});
    expect(await buffer(page)).toBe(exercise.goal.kind==='document'?exercise.goal.text:'');
    await expect(page.getByTestId('vim-mode')).toHaveText('NORMAL');
    await expect(page.getByTestId('success')).toHaveCount(0);
    expect(await page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)!).lessons[id].wins,{key:storageKey,id})).toBe(0);
    await page.getByRole('button',{name:'Now you try'}).click();
    expect(await buffer(page)).toBe(exercise.code);
    await press(page,expandSteps(exercise.steps));
    await expect(page.getByTestId('success')).toBeVisible();
  });
}
