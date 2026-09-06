import { expect, type Page } from '@playwright/test';
import { test } from './fixture';
import { lessons, expandSteps } from '../src/lessons';
import { emptyProgress, storageKey } from '../src/progress';
async function choose(page:Page,id:string,stage=0){
  const p=emptyProgress();p.current=id;p.lessons[id]={wins:stage,attempts:stage,hints:0,last:'',mastered:false,stage};
  await page.addInitScript(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),{key:storageKey,data:p});
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByRole('textbox',{name:'Vim practice editor'})).toBeVisible();
}
async function press(page:Page,keys:string[]){
  for(const key of keys){
    if(key==='Esc')await page.keyboard.press('Escape');
    else if(key==='Enter')await page.keyboard.press('Enter');
    else if(key.startsWith('Ctrl+'))await page.keyboard.press('Control+'+key.slice(5));
    else await page.keyboard.press(key===' '?'Space':key);
  }
}
for(const lesson of lessons){
  test(`${lesson.id}: four real Vim exercises`,async({page})=>{
    await choose(page,lesson.id);
    for(let stage=0;stage<4;stage++){
      await expect(page.getByText(`Repetition ${stage+1} of 4`,{exact:true})).toBeVisible();
      if(stage===3)await expect(page.getByRole('button',{name:'Show hint',exact:true})).toBeVisible();
      await page.getByRole('textbox',{name:'Vim practice editor'}).focus();
      await press(page,expandSteps(lesson.make(stage).steps));
      await expect(page.getByTestId('success')).toBeVisible();
      if(stage<3)await page.getByRole('button',{name:'Next repetition'}).click();
    }
    const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),storageKey);
    expect(stored.lessons[lesson.id].mastered).toBe(true);
    expect(stored.lessons[lesson.id].wins).toBe(4);
  });
}
test('incorrect input does not pass, reset restores the drill',async({page})=>{
  await choose(page,'select-word');
  await page.keyboard.press('l');await expect(page.getByTestId('success')).toHaveCount(0);
  await page.getByRole('button',{name:'Reset exercise'}).click();
  await press(page,['v','i','w']);await expect(page.getByTestId('success')).toBeVisible();
});
test('demonstration never awards progress',async({page})=>{
  await choose(page,'change-word');
  await page.getByRole('button',{name:'Watch it first'}).click();
  await expect(page.getByRole('button',{name:'Now you try'})).toBeVisible({timeout:12000});
  await expect(page.locator('.cm-content')).toContainText('const moon = true;');
  await expect(page.getByTestId('success')).toHaveCount(0);
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).lessons['change-word'].wins,storageKey)).toBe(0);
  await page.getByRole('button',{name:'Now you try'}).click();
  await press(page,expandSteps(lessons.find(l=>l.id==='change-word')!.make(0).steps));
  await expect(page.getByTestId('success')).toBeVisible();
});
test('recall with a hint does not mark a skill learned',async({page})=>{
  await choose(page,'select-word',3);
  await page.getByRole('button',{name:'Show hint',exact:true}).click();
  await press(page,['v','i','w']);await expect(page.getByTestId('success')).toBeVisible();
  const p=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),storageKey);
  expect(p.lessons['select-word'].mastered).toBe(false);expect(p.lessons['select-word'].hints).toBe(1);
  await expect(page.getByRole('button',{name:'Try from memory'})).toBeVisible();
});
test('free practice persists and does not award wins',async({page})=>{
  await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'Free practice',exact:true}).click();
  await press(page,['i','b','o','o','Esc']);
  await page.getByRole('button',{name:'Continue learning'}).click();
  await page.getByRole('button',{name:'Free practice',exact:true}).click();
  await expect(page.locator('.cm-content')).toContainText('boo// A quiet');
  await page.reload();await page.getByRole('button',{name:'Free practice',exact:true}).click();
  await expect(page.locator('.cm-content')).toContainText('boo// A quiet');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).days,storageKey)).toEqual({});
});
test('progress and current lesson survive reload',async({page})=>{
  await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'Continue learning'}).click();await page.getByRole('textbox',{name:'Vim practice editor'}).focus();await press(page,expandSteps(lessons[0].make(0).steps));await expect(page.getByTestId('success')).toBeVisible();
  await page.reload();await expect(page.getByText('Repetition 2 of 4',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'My progress',exact:true}).click();await expect(page.getByText('1/4 steps',{exact:true})).toBeVisible();
});
test('daily review can be finished and is saved',async({page})=>{
  await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:/Daily practice/}).click();
  const p=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),storageKey);
  for(const id of p.daily.ids){
    const lesson=lessons.find(l=>l.id===id)!,variant=(new Date().getDate()+lessons.indexOf(lesson))%4;
    await page.getByRole('textbox',{name:'Vim practice editor'}).focus();await press(page,expandSteps(lesson.make(variant).steps));
    if(id!==p.daily.ids.at(-1)){await expect(page.getByTestId('success')).toBeVisible();await page.keyboard.press('Enter');await expect(page.getByRole('textbox',{name:'Vim practice editor'})).toBeFocused();}
  }
  await expect(page.getByRole('heading',{name:'Your daily practice is done.'})).toBeVisible();
  await page.reload();await page.getByRole('button',{name:/Daily practice/}).click();
  await expect(page.getByRole('heading',{name:'Your daily practice is done.'})).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox',{name:'Vim practice editor'})).toBeFocused();
});
test('capture polished desktop layout',async({page})=>{
  await page.setViewportSize({width:1360,height:980});await choose(page,'select-word');
  await page.screenshot({path:'test-results/ghostkeys-desktop.png',fullPage:true});
  await page.setViewportSize({width:900,height:720});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('search demonstration submits the search without scoring',async({page})=>{
  await choose(page,'next-match');
  await page.getByRole('button',{name:'Watch it first'}).click();
  await expect(page.getByRole('button',{name:'Now you try'})).toBeVisible({timeout:12000});
  await expect(page.locator('.editor-status')).toContainText('Ln 3, Col 13');
  await expect(page.getByTestId('success')).toHaveCount(0);
});

test('Enter advances every repetition and the next lesson with editor focus',async({page})=>{
  await choose(page,'select-word');
  for(let stage=0;stage<4;stage++){
    await expect(page.getByText(`Repetition ${stage+1} of 4`,{exact:true})).toBeVisible();
    await expect(page.getByRole('textbox',{name:'Vim practice editor'})).toBeFocused();
    await press(page,['v','i','w']);
    await expect(page.getByTestId('success')).toBeVisible();
    await expect(page.getByText('Press Enter to continue',{exact:true})).toBeVisible();
    await page.keyboard.press('Enter');
  }
  await expect(page.getByRole('heading',{name:'Take the whole line.'})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Vim practice editor'})).toBeFocused();
  await expect(page.getByTestId('vim-mode')).toHaveText('NORMAL');
});

test('search confirmation and held Enter do not skip success',async({page})=>{
  await choose(page,'search');
  await press(page,['/','g','h','o','s','t']);
  await page.keyboard.down('Enter');
  await expect(page.getByTestId('success')).toBeVisible();
  await expect(page.getByText('Repetition 1 of 4',{exact:true})).toBeVisible();
  await page.keyboard.down('Enter'); // auto-repeat while still held
  await expect(page.getByTestId('success')).toBeVisible();
  await expect(page.getByText('Repetition 1 of 4',{exact:true})).toBeVisible();
  await page.keyboard.up('Enter');await page.keyboard.press('Enter');
  await expect(page.getByText('Repetition 2 of 4',{exact:true})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Vim practice editor'})).toBeFocused();
});

test('Enter keeps normal editor and focused navigation behavior',async({page})=>{
  await choose(page,'insert');
  await press(page,['i','Enter']);
  await expect(page.getByTestId('vim-mode')).toHaveText('INSERT');
  await expect(page.getByTestId('success')).toHaveCount(0);
  await expect(page.getByText('Repetition 1 of 4',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Reset exercise'}).click();
  await press(page,expandSteps(lessons[0].make(0).steps));await expect(page.getByTestId('success')).toBeVisible();
  await page.getByRole('button',{name:'My progress',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'Look how far you’ve come.'})).toBeVisible();
});
