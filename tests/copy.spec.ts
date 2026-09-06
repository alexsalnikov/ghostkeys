import { expect, type Page } from '@playwright/test';
import { test } from './fixture';
import { emptyProgress, emptyResult, storageKey } from '../src/progress';
import { lessons, expandSteps } from '../src/lessons';

async function choose(page:Page,id:string,stage=0){
  const data=emptyProgress();data.current=id;data.lessons[id]={...emptyResult(),stage};
  await page.addInitScript(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),{key:storageKey,data});
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByRole('textbox',{name:'Vim practice editor'})).toBeFocused();
}
async function press(page:Page,keys:string[]){
  for(const key of keys)await page.keyboard.press(key==='Esc'?'Escape':key===' '?'Space':key.startsWith('Ctrl+')?'Control+'+key.slice(5):key);
}
const buffer=(page:Page)=>page.locator('.cm-content .cm-line').allTextContents().then(lines=>lines.join('\n'));
async function free(page:Page,code:string){
  await page.addInitScript(code=>localStorage.setItem('ghostkeys.sandbox.v1',code),code);
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('button',{name:'Free practice',exact:true}).click();
}

test('whole-file copy checks the register and complete last line, not only keys',async({page})=>{
  await choose(page,'copy-all');
  const original=await buffer(page);
  await press(page,['g','g','v','G','y']);
  await expect(page.getByTestId('success')).toHaveCount(0);
  expect(await buffer(page)).toBe(original);
  await press(page,['g','g','V','G']);
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.keyboard.press('y');
  await expect(page.getByTestId('success')).toBeVisible();
  expect(await buffer(page)).toBe(original);
  await page.keyboard.press('Enter');
  await expect(page.getByText('Repetition 2 of 4',{exact:true})).toBeVisible();
});

test('copying one line cannot pass whole-file recall',async({page})=>{
  await choose(page,'copy-all',3);
  await press(page,['y','y']);
  await expect(page.getByTestId('success')).toHaveCount(0);
  await press(page,['g','g','y','G']);
  await expect(page.getByTestId('success')).toBeVisible();
});

test('essentials explains capital V and links directly to the full-file drill',async({page})=>{
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('navigation',{name:'Introduction topics'}).getByRole('button',{name:'5 Copy all'}).click();
  await expect(page.getByText(/Capital V selects complete lines/)).toBeVisible();
  await page.getByRole('button',{name:'Practice copying the whole file'}).click();
  await expect(page.getByRole('heading',{name:'Keep the whole spellbook.'})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Vim practice editor'})).toBeFocused();
});

test('register 0 recovers the yank after the unnamed register becomes a deleted line',async({page})=>{
  await choose(page,'yank-register');
  await press(page,['y','i','w','j','d','d','G','0','p']);
  expect(await buffer(page)).toBe('ghost\n""\ndust');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.getByRole('button',{name:'Reset exercise'}).click();
  await press(page,expandSteps(lessons.find(l=>l.id==='yank-register')!.make(0).steps));
  expect(await buffer(page)).toBe('ghost\n"ghost"');
  await expect(page.getByTestId('success')).toBeVisible();
});

test('register inspection shows the named copy without finishing or advancing the exercise',async({page})=>{
  await choose(page,'inspect-register');
  await press(page,['"','a','y','i','w',':',...'reg a','Enter']);
  await expect(page.locator('.cm-vim-message')).toContainText('"a    ghost');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await expect(page.getByText('Repetition 1 of 4',{exact:true})).toBeVisible();
  await press(page,['Esc','G','0','"','a','p']);
  await expect(page.getByTestId('success')).toBeVisible();
});

test('gP preserves linewise put, dot repeat, and a single undo per insertion',async({page})=>{
  await free(page,'ghost\nbridge\nhome');
  await press(page,['y','y','j','g','P']);
  expect(await buffer(page)).toBe('ghost\nghost\nbridge\nhome');
  await expect(page.locator('.editor-status')).toContainText('Ln 3, Col 1');
  await page.keyboard.press('.');
  expect(await buffer(page)).toBe('ghost\nghost\nghost\nbridge\nhome');
  await expect(page.locator('.editor-status')).toContainText('Ln 4, Col 1');
  await page.keyboard.press('u');
  expect(await buffer(page)).toBe('ghost\nghost\nbridge\nhome');
  await page.keyboard.press('u');
  expect(await buffer(page)).toBe('ghost\nbridge\nhome');
});

test('gp supports a named register and a count without losing the landing position',async({page})=>{
  await free(page,'ghost | end');
  await press(page,['"','a','y','i','w','f','|','"','a','2','g','p']);
  expect(await buffer(page)).toBe('ghost |ghostghost end');
  await expect(page.locator('.editor-status')).toContainText('Ln 1, Col 18');
});

test('gp lands after the last row of a block and repeats columns with a count',async({page})=>{
  await free(page,'XYabc\nZZdef\n12345\n67890');
  await press(page,['Ctrl+v','j','l','y','G','k','0','2','g','p']);
  expect(await buffer(page)).toBe('XYabc\nZZdef\n1XYXY2345\n6ZZZZ7890');
  await expect(page.locator('.editor-status')).toContainText('Ln 4, Col 6');
});

test('Insert-mode register paste waits for Escape before success',async({page})=>{
  await choose(page,'insert-register');
  await press(page,['y','i','w','G','f','"','a','Ctrl+r','0']);
  expect(await buffer(page)).toBe('// ghost\nconst guest = "ghost";');
  await expect(page.getByTestId('vim-mode')).toHaveText('INSERT');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('success')).toBeVisible();
});

for(const id of ['copy-all','insert-register','inspect-register','cursor-gp']){
  test(`${id}: demonstration performs the copy operation without awarding progress`,async({page})=>{
    await choose(page,id);
    const exercise=lessons.find(l=>l.id===id)!.make(0);
    await page.getByRole('button',{name:'Watch it first'}).click();
    await expect(page.getByRole('button',{name:'Now you try'})).toBeVisible({timeout:18000});
    expect(await buffer(page)).toBe(exercise.goal.kind==='document'?exercise.goal.text:exercise.code);
    await expect(page.getByTestId('success')).toHaveCount(0);
    expect(await page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)!).lessons[id].wins,{key:storageKey,id})).toBe(0);
    await page.getByRole('button',{name:'Now you try'}).click();
    await press(page,expandSteps(exercise.steps));
    await expect(page.getByTestId('success')).toBeVisible();
  });
}
