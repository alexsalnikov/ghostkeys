import { expect, type Page } from '@playwright/test';
import { test } from './fixture';
import { expandTmux, tmuxLessons } from '../src/tmuxLessons';
import { activeWindow, makeState, tmuxKey } from '../src/tmuxModel';
import { emptyProgress, emptyResult, storageKey } from '../src/progress';
const tmuxKeyName='ghostkeys.tmux.v1';
async function choose(page:Page,id:string,stage=0){
  await page.addInitScript(({id,stage,key})=>{
    localStorage.setItem('ghostkeys.path.v1','tmux');
    localStorage.setItem(key,JSON.stringify({version:1,current:id,overview:false,lessons:{[id]:{stage,wins:0,hints:0,attempts:0,last:'',mastered:false}}}));
  },{id,stage,key:tmuxKeyName});
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByRole('textbox',{name:'Simulated tmux terminal'})).toBeFocused();
}
async function press(page:Page,keys:string[]){for(const key of keys)await page.keyboard.press(key==='Esc'?'Escape':key===' '?'Space':key.startsWith('Ctrl+')?'Control+'+key.slice(5):key);}
for(const lesson of tmuxLessons){
  test(`tmux ${lesson.id}: all four keyboard exercises`,async({page})=>{
    await choose(page,lesson.id);
    for(let stage=0;stage<4;stage++){
      if(stage===3)await expect(page.getByRole('button',{name:'Show hint',exact:true})).toBeVisible();
      await expect(page.getByRole('textbox',{name:'Simulated tmux terminal'})).toBeFocused();
      await press(page,expandTmux(lesson.make(stage).steps));
      await expect(page.getByTestId('tmux-success')).toBeVisible();
      if(stage<3)await page.keyboard.press('Enter');
    }
    const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),tmuxKeyName);
    expect(saved.lessons[lesson.id]).toMatchObject({wins:4,mastered:true,stage:3});
  });
}

test('tmux model distinguishes prefix release, detach, and closing programs',()=>{
  const start=makeState('ghost');start.sessions[0].windows[0].panes[0].program='watch · running';
  const typo=tmuxKey(start,'d');expect(typo.attached).toBe('ghost');expect(typo.input).toBe('d');
  const held=tmuxKey(tmuxKey(start,'Ctrl+b'),'Ctrl+d');expect(held.attached).toBe('ghost');
  const detached=tmuxKey(tmuxKey(start,'Ctrl+b'),'d');expect(detached.attached).toBeNull();expect(detached.sessions).toEqual(start.sessions);
  const back=expandTmux(['type:tmux attach -t ghost','Enter']).reduce(tmuxKey,detached);
  expect(back.attached).toBe('ghost');expect(back.sessions).toEqual(start.sessions);
  const closed=['Ctrl+b','x','y'].reduce(tmuxKey,back);expect(closed.sessions).toEqual([]);expect(closed.attached).toBeNull();
  expect(start.attached).toBe('ghost');expect(start.events).toEqual([]);
});

test('tmux refuses missing attach targets and protects existing named sessions',()=>{
  const start=makeState('ghost',false);
  const missing=expandTmux(['type:tmux attach -t pumpkin','Enter']).reduce(tmuxKey,start);
  expect(missing.attached).toBeNull();expect(missing.sessions).toEqual(start.sessions);
  const duplicate=expandTmux(['type:tmux new -s ghost','Enter']).reduce(tmuxKey,start);
  expect(duplicate.attached).toBeNull();expect(duplicate.sessions.length).toBe(1);
  const reused=expandTmux(['type:tmux new -A -s ghost','Enter']).reduce(tmuxKey,start);
  expect(reused.attached).toBe('ghost');expect(reused.sessions).toEqual(start.sessions);
  for(const command of ['tmux attach -t','tmux new -s ghost extra','tmux new -s']){
    const invalid=expandTmux(['type:'+command,'Enter']).reduce(tmuxKey,start);
    expect(invalid.attached).toBeNull();expect(invalid.sessions).toEqual(start.sessions);
  }
});

test('tmux split direction, zoom, and close cancellation preserve the right panes',()=>{
  const start=makeState('ghost');
  const right=['Ctrl+b','%'].reduce(tmuxKey,start);expect(activeWindow(right)?.layout).toEqual({direction:'row',first:{pane:0},second:{pane:1}});
  const down=['Ctrl+b','"'].reduce(tmuxKey,right);expect(activeWindow(down)?.layout).toEqual({direction:'row',first:{pane:0},second:{direction:'column',first:{pane:1},second:{pane:2}}});
  const zoom=['Ctrl+b','z'].reduce(tmuxKey,down);expect(activeWindow(zoom)?.zoom).toBe(true);expect(activeWindow(zoom)?.panes).toEqual(activeWindow(down)?.panes);
  const cancel=['Ctrl+b','x','n'].reduce(tmuxKey,down);expect(cancel.sessions).toEqual(down.sessions);
  const closed=['Ctrl+b','x','y'].reduce(tmuxKey,down);expect(activeWindow(closed)?.panes.map(p=>p.id)).toEqual([0,1]);
});

test('tmux input is simulated; shell metacharacters cannot run real commands',()=>{
  const state=expandTmux(['type:touch /tmp/ghostkeys-must-not-exist; tmux new -s boo','Enter']).reduce(tmuxKey,makeState('ghost',false));
  expect(state.attached).toBeNull();expect(state.sessions.map(s=>s.name)).toEqual(['ghost']);expect(state.events).toEqual(['unsupported']);
});

test('paths keep progress separate and restore the last selected path on reload',async({page})=>{
  const vim=emptyProgress();vim.introductionComplete=true;vim.current='search';vim.lessons.search={...emptyResult(),wins:2,stage:2};
  await page.addInitScript(({key,vim})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(vim));},{key:storageKey,vim});
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByText('Repetition 3 of 4',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'tmux path',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Keep your terminal haunt alive.'})).toBeVisible();
  await page.getByRole('button',{name:'Start tmux practice'}).click();
  await press(page,expandTmux(tmuxLessons[0].make(0).steps));
  await expect(page.getByTestId('tmux-success')).toBeVisible();
  await page.keyboard.press('Enter');await page.reload();
  await expect(page.getByText('Repetition 2 of 4',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Vim path',exact:true}).click();
  await expect(page.getByText('Repetition 3 of 4',{exact:true})).toBeVisible();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),storageKey)).toEqual(vim);
  await page.getByRole('button',{name:'tmux path',exact:true}).click();
  await expect(page.getByText('Repetition 2 of 4',{exact:true})).toBeVisible();
});

test('tmux guided prefix drill rejects ordinary typing and reset restores focus',async({page})=>{
  await choose(page,'detach');await page.keyboard.press('d');
  await expect(page.getByTestId('tmux-success')).toHaveCount(0);
  await expect(page.getByTestId('tmux-attachment')).toContainText('ATTACHED');
  await page.getByRole('button',{name:'Reset tmux exercise'}).click();
  await expect(page.getByRole('textbox',{name:'Simulated tmux terminal'})).toBeFocused();
  await press(page,['Ctrl+b','d']);await expect(page.getByTestId('tmux-success')).toBeVisible();
});

test('tmux hinted recall is not mastered and Enter retries the same lesson',async({page})=>{
  await choose(page,'detach',3);await page.getByRole('button',{name:'Show hint'}).click();
  await press(page,['Ctrl+b','d']);await expect(page.getByTestId('tmux-success')).toBeVisible();
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),tmuxKeyName);expect(stored.lessons.detach.mastered).toBe(false);expect(stored.lessons.detach.hints).toBe(1);
  await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Step outside; leave the light on.'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Show hint'})).toBeVisible();
});

test('tmux Enter confirms a command once and held Enter cannot skip the success',async({page})=>{
  await choose(page,'new-session');await press(page,[...'tmux new -s ghost']);
  await page.keyboard.down('Enter');await expect(page.getByTestId('tmux-success')).toBeVisible();
  await page.keyboard.down('Enter');await expect(page.getByTestId('tmux-success')).toBeVisible();
  await page.keyboard.up('Enter');await page.keyboard.press('Enter');
  await expect(page.getByText('Repetition 2 of 4',{exact:true})).toBeVisible();
});

test('tmux detach and attach demonstration restores panes without scoring',async({page})=>{
  await choose(page,'reattach-cycle');await page.getByRole('button',{name:'Watch it first'}).click();
  await expect(page.getByRole('button',{name:'Now you try'})).toBeVisible({timeout:18000});
  await expect(page.getByTestId('tmux-attachment')).toHaveText('ATTACHED · ghost');
  await expect(page.locator('.tmux-pane')).toHaveCount(2);
  await expect(page.getByTestId('tmux-success')).toHaveCount(0);
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),tmuxKeyName);expect(stored.lessons['reattach-cycle'].wins).toBe(0);
  await page.getByRole('button',{name:'Now you try'}).click();
  await press(page,expandTmux(tmuxLessons.find(l=>l.id==='reattach-cycle')!.make(0).steps));
  await expect(page.getByTestId('tmux-success')).toBeVisible();
});

test('tmux overview and all exercises fit the compact desktop',async({page})=>{
  test.setTimeout(60000);
  await choose(page,'new-session');
  for(const size of [{width:880,height:650},{width:1366,height:768}]){
    await page.setViewportSize(size);
    await page.getByRole('button',{name:'Why tmux?',exact:true}).click();
    const fits=()=>page.evaluate(()=>{const el=document.querySelector('.main-content')!;return {height:el.scrollHeight<=el.clientHeight+1,width:document.documentElement.scrollWidth<=innerWidth};});
    expect(await fits(),'overview').toEqual({height:true,width:true});
    await page.getByRole('button',{name:'Start tmux practice'}).click();
    for(const lesson of tmuxLessons){
      if(lesson.id!=='new-session')await page.getByRole('button',{name:'Explore next tmux lesson'}).click();
      await expect(page.getByRole('heading',{name:lesson.title+'.',exact:true})).toBeVisible();
      expect(await fits(),`${lesson.id} at ${size.width}`).toEqual({height:true,width:true});
      expect(await page.locator('.tmux-screen').evaluate(el=>el.clientHeight)).toBeGreaterThan(45);
    }
    await page.getByRole('button',{name:/Sessions/}).click();
    await page.getByTestId('tmux-lesson-new-session').click();
  }
  await page.screenshot({path:'test-results/tmux-training.png'});
});
