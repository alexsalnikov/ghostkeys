import { expect } from '@playwright/test';
import { test } from './fixture';
import { emptyProgress, storageKey } from '../src/progress';
import { lessons, expandSteps } from '../src/lessons';

test('new learners complete the modes chapter and safely quit with the keyboard', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByRole('heading', { name: 'Normal mode is home.' })).toBeVisible();
  for (const title of ['Insert mode is for writing.', 'Visual mode selects text.', 'Command-line mode gives instructions.']) {
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  }
  const prompt = page.getByRole('textbox', { name: 'Safe Vim file practice' });
  await expect(prompt).toBeFocused();
  await page.keyboard.type(':w');await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Next topic' })).toBeDisabled();
  await page.keyboard.press('Escape');await page.keyboard.type(':nope');await page.keyboard.press('Enter');
  await expect(prompt).toContainText('This task asks for :w');
  await page.keyboard.press('Escape');await page.keyboard.type(':w');await page.keyboard.press('Enter');
  await expect(prompt).toContainText('Saved successfully');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'Copy the whole spellbook.'})).toBeVisible();
  await page.keyboard.press('Enter');
  for(const [command,title] of [['q','Never get stuck in Vim.'],['wq','Save your spell and leave.'],['q!','Leave an unwanted spell behind.']]) {
    await expect(page.getByRole('heading',{name:title})).toBeVisible();
    await expect(prompt).toBeFocused();
    await page.keyboard.press('Escape');
    if(command!=='q'){
      await page.keyboard.type(':q');await page.keyboard.press('Enter');
      await expect(prompt).toContainText('Unsaved changes');
    }
    await page.keyboard.type(':'+command);await page.keyboard.press('Enter');
    await expect(prompt).toContainText('Quit successful');
    await expect(prompt).toContainText(command==='q!'?'SAVED: old glow':command==='wq'?'SAVED: new glow':'SAVED: warm glow');
    await page.keyboard.press('Enter');
  }
  await expect(page.getByRole('textbox', { name: 'Vim practice editor' })).toBeFocused();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).introductionComplete, storageKey)).toBe(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Meet Insert mode.' })).toBeVisible();
  await page.getByRole('button', { name: /Vim essentials/ }).click();
  await expect(page.getByRole('heading', { name: 'Normal mode is home.' })).toBeVisible();
});

test('existing learners keep their current lesson and can revisit the introduction', async ({ page }) => {
  const data = emptyProgress();data.current = 'search';data.lessons.search = { wins: 2, attempts: 3, hints: 1, last: '', mastered: false, stage: 2 };
  await page.addInitScript(({key,data}) => localStorage.setItem(key, JSON.stringify(data)), {key:storageKey,data});
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByText('Repetition 3 of 4', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Vim essentials/ }).click();
  await page.getByRole('button', { name: 'Continue learning' }).click();
  await expect(page.getByText('Repetition 3 of 4', { exact: true })).toBeVisible();
});

test('training controls fit short desktop windows in guidance, feedback, and success states', async ({ page }) => {
  test.setTimeout(60000);
  const data = emptyProgress();data.introductionComplete = true;
  await page.addInitScript(({key,data}) => localStorage.setItem(key, JSON.stringify(data)), {key:storageKey,data});
  await page.goto('http://127.0.0.1:5173');
  for (const size of [{width:880,height:650}, {width:900,height:720}, {width:1366,height:768}, {width:1320,height:900}]) {
    await page.setViewportSize(size);
    await page.reload();
    for (const lesson of lessons) {
      // Exercise the full course, including long descriptions and key sequences.
      await expect(page.getByRole('heading', {name:lesson.title+'.',exact:true})).toBeVisible();
      const fits = await page.evaluate(() => {
        const main = document.querySelector('.main-content')!;
        const workspace = document.querySelector('.training-workspace')!;
        const editor = document.querySelector('.editor-region')!;
        return { main:main.scrollHeight <= main.clientHeight + 1, width:document.documentElement.scrollWidth <= innerWidth, bottom:workspace.getBoundingClientRect().bottom <= innerHeight + 1, editor:editor.clientHeight };
      });
      expect(fits, `${lesson.id} at ${size.width}×${size.height}`).toMatchObject({main:true,width:true,bottom:true});
      expect(fits.editor).toBeGreaterThan(75);
      expect(await page.locator('.course-toggle').evaluateAll(elements => elements.every(el => {
        const box=el.getBoundingClientRect(), list=el.closest('.course-list')!.getBoundingClientRect();
        return box.top>=list.top-1 && box.bottom<=list.bottom+1;
      })), 'All chapter headings stay in view').toBe(true);
      if (lesson !== lessons.at(-1)) await page.getByRole('button',{name:'Explore next lesson'}).click();
    }
    await page.getByRole('button',{name:/First steps/}).click();
    await page.getByTestId('lesson-insert').click();
    await page.keyboard.type('xxxx');
    await expect(page.locator('.pressed-keys')).toBeVisible();
    expect(await page.evaluate(()=>{const el=document.querySelector('.main-content')!;return el.scrollHeight<=el.clientHeight+1;})).toBe(true);
    await page.getByRole('button',{name:'Reset exercise'}).click();
    for (const key of expandSteps(lessons[0].make(0).steps)) await page.keyboard.press(key==='Esc'?'Escape':key);
    await expect(page.getByTestId('success')).toBeVisible();
    expect(await page.evaluate(()=>{const el=document.querySelector('.main-content')!;return el.scrollHeight<=el.clientHeight+1;})).toBe(true);
    await page.getByRole('button',{name:'Reset exercise'}).click();
  }
  await page.setViewportSize({width:1366,height:768});
  await page.screenshot({path:'test-results/compact-training.png'});
});

test('every introduction topic fits the minimum desktop window', async ({ page }) => {
  await page.setViewportSize({width:880,height:650});
  await page.goto('http://127.0.0.1:5173');
  for (let step=0;step<8;step++) {
    await page.getByRole('navigation',{name:'Introduction topics'}).getByRole('button').nth(step).click();
    expect(await page.evaluate(()=>{const el=document.querySelector('.main-content')!;return el.scrollHeight<=el.clientHeight+1;}), `topic ${step+1}`).toBe(true);
    if([3,5,6,7].includes(step)){
      await page.getByRole('textbox',{name:'Safe Vim file practice'}).focus();
      await page.keyboard.press('Escape');await page.keyboard.type(':nope');await page.keyboard.press('Enter');
      expect(await page.evaluate(()=>{const el=document.querySelector('.main-content')!;return el.scrollHeight<=el.clientHeight+1;})).toBe(true);
    }
  }
  await page.screenshot({path:'test-results/vim-essentials.png'});
});
