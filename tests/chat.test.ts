import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { after, before, beforeEach, test } from 'node:test'
import { chromium, type Browser, type Page } from 'playwright'
import { readChatPageState, waitForChatPageReady } from '../src/auth'
import { prepareOrSubmitMessage, resolveDryRun } from '../src/message'

let browser: Browser
let page: Page

before(async () => {
  const localChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  const executablePath =
    process.env.PLAYWRIGHT_BROWSER_PATH || (existsSync(localChrome) ? localChrome : undefined)
  browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  })
  page = await browser.newPage()
  // Tests only use local HTML fixtures; block accidental external requests.
  await page.route('**/*', (route) => route.abort())
})

beforeEach(async () => {
  await page.setContent('')
})

after(async () => {
  await browser?.close()
})

test('a visible login popup takes precedence over a search input behind it', async () => {
  await page.setContent(`
    <input class="semi-input" placeholder="搜索">
    <div hidden>登录后免费畅享高清视频</div>
    <div>登录后免费畅享高清视频</div>
  `)
  assert.equal(await readChatPageState(page), 'login-required')
  await assert.rejects(waitForChatPageReady(page, 100), /COOKIES_CHEN4RL.*未发送消息/)
})

test('verification is detected separately from an expired login', async () => {
  await page.setContent('<div class="captcha_verify_container">请完成验证</div>')
  assert.equal(await readChatPageState(page), 'verification-required')
  await assert.rejects(waitForChatPageReady(page, 100), /安全验证.*未发送消息/)
})

test('a hidden login popup does not block an authenticated chat page', async () => {
  await page.setContent('<div hidden>扫码登录</div><input class="semi-input" placeholder="搜索">')
  assert.equal(await readChatPageState(page), 'ready')
  await waitForChatPageReady(page, 100)
})

test('loading waits for the search input to render', async () => {
  await page.evaluate(() => {
    setTimeout(() => {
      document.body.innerHTML = '<input class="semi-input" placeholder="搜索">'
    }, 30)
  })
  await waitForChatPageReady(page, 1000)
  assert.equal(await readChatPageState(page), 'ready')
})

test('a loading timeout is not reported as invalid credentials', async () => {
  await page.setContent('<div>正在加载</div>')
  await assert.rejects(waitForChatPageReady(page, 30), /加载超时，未发现登录或验证弹窗/)
})

async function installEditor(): Promise<void> {
  await page.setContent('<div contenteditable="true" id="editor">原有草稿</div>')
  await page.evaluate(() => {
    document.body.dataset.inputs = '0'
    document.body.dataset.enters = '0'
    document.addEventListener('input', () => {
      document.body.dataset.inputs = String(Number(document.body.dataset.inputs) + 1)
    })
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        document.body.dataset.enters = String(Number(document.body.dataset.enters) + 1)
      }
    })
  })
}

test('dry-run verifies the editor without altering drafts, focusing, or pressing Enter', async () => {
  await installEditor()
  await prepareOrSubmitMessage(page.locator('#editor'), page.keyboard, '[猪头]', true)
  assert.equal(await page.locator('#editor').innerText(), '原有草稿')
  assert.deepEqual(
    await page.evaluate(() => ({
      inputs: document.body.dataset.inputs,
      enters: document.body.dataset.enters,
      focusedEditor: document.activeElement?.id === 'editor',
    })),
    { inputs: '0', enters: '0', focusedEditor: false },
  )
})

test('live mode submits only inside the isolated local editor fixture', async () => {
  await installEditor()
  await prepareOrSubmitMessage(page.locator('#editor'), page.keyboard, '[猪头]', false)
  assert.match(await page.locator('#editor').innerText(), /\[猪头\]/)
  assert.equal(await page.getAttribute('body', 'data-enters'), '1')
})

test('DRY_RUN defaults to existing scheduled behavior and rejects misspellings', () => {
  assert.equal(resolveDryRun(''), false)
  assert.equal(resolveDryRun('false'), false)
  assert.equal(resolveDryRun(' TRUE '), true)
  assert.throws(() => resolveDryRun('treu'), /DRY_RUN/)
})
