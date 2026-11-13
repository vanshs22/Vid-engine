import {chromium} from 'playwright-core';
import {execFileSync} from 'node:child_process';
import {mkdir, readFile, readdir, rm} from 'node:fs/promises';
import {resolve} from 'node:path';

type Action = {type: 'click' | 'fill' | 'press' | 'wait'; selector?: string; value?: string; key?: string; milliseconds?: number};
const url = process.argv[2];
const output = resolve(process.argv[3] ?? 'public/captured-screen.mp4');
const actionsPath = process.argv[4];
if (!url) throw new Error('Usage: tsx scripts/capture-screen.ts <url> [output.mp4] [actions.json]');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROME || '/usr/bin/chromium';
const tempDir = resolve('.tmp/screen-capture');
await mkdir(tempDir, {recursive: true});
const browser = await chromium.launch({headless: true, executablePath});
const context = await browser.newContext({viewport: {width: 1080, height: 1920}, deviceScaleFactor: 1, recordVideo: {dir: tempDir, size: {width: 1080, height: 1920}}});
const page = await context.newPage();
await page.goto(url, {waitUntil: 'networkidle'});
if (actionsPath) {
  const actions = JSON.parse(await readFile(resolve(actionsPath), 'utf8')) as Action[];
  for (const action of actions) {
    if (action.type === 'click' && action.selector) await page.locator(action.selector).click();
    if (action.type === 'fill' && action.selector) await page.locator(action.selector).fill(action.value ?? '');
    if (action.type === 'press' && action.selector) await page.locator(action.selector).press(action.key ?? 'Enter');
    if (action.type === 'wait') await page.waitForTimeout(action.milliseconds ?? 500);
  }
}
await page.waitForTimeout(500);
const video = page.video();
await context.close();
await browser.close();
const files = await readdir(tempDir);
const source = files.find((file) => file.endsWith('.webm'));
if (!source || !video) throw new Error('No browser video was captured');
await mkdir(resolve(output, '..'), {recursive: true});
const ffmpeg = process.env.FFMPEG || resolve('node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg');
execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', resolve(tempDir, source), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', output]);
await rm(tempDir, {recursive: true, force: true});
console.log(`WROTE: ${output}`);
