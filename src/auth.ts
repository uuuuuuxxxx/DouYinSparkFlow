import type { Page } from 'playwright'

export const CHAT_SEARCH_SELECTOR = 'input.semi-input[placeholder="搜索"]'

export type ChatPageState = 'ready' | 'login-required' | 'verification-required' | 'loading'

/** Classify the page before trying to search contacts or submit messages. */
export async function readChatPageState(page: Page): Promise<ChatPageState> {
  const [searchVisible, loginVisible, verificationVisible] = await Promise.all([
    page.locator(CHAT_SEARCH_SELECTOR).first().isVisible(),
    page
      .getByText(/^(登录后免费畅享高清视频|扫码登录|验证码登录)$/)
      .filter({ visible: true })
      .first()
      .isVisible(),
    page
      .locator(
        '[class*="captcha"]:visible, iframe[src*="captcha"]:visible, iframe[src*="verify"]:visible',
      )
      .first()
      .isVisible(),
  ])

  if (verificationVisible) {
    return 'verification-required'
  }

  if (loginVisible) {
    return 'login-required'
  }

  return searchVisible ? 'ready' : 'loading'
}

/** Stop explicitly on login or verification; a loading timeout is not proof of an expired Cookie. */
export async function waitForChatPageReady(page: Page, timeout = 30000): Promise<void> {
  const deadline = Date.now() + timeout

  while (true) {
    const state = await readChatPageState(page)

    if (state === 'verification-required') {
      throw new Error('抖音要求安全验证，请在浏览器中完成验证后重新导出 Cookie；本次未发送消息')
    }

    if (state === 'login-required') {
      throw new Error(
        '抖音显示登录弹窗，当前 Cookie 未通过认证。请登录 www.douyin.com/chat 后刷新 user-data 中的 COOKIES_CHEN4RL；本次未发送消息',
      )
    }

    if (state === 'ready') {
      return
    }

    if (Date.now() >= deadline) {
      throw new Error('聊天页加载超时，未发现登录或验证弹窗；请查看失败截图排查网络或页面变化')
    }

    await page.waitForTimeout(Math.min(500, Math.max(0, deadline - Date.now())))
  }
}
