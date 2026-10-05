import type { Keyboard, Locator } from 'playwright'

export function resolveDryRun(value = process.env.DRY_RUN): boolean {
  const normalized = value?.trim().toLowerCase()

  if (!normalized || normalized === 'false') {
    return false
  }

  if (normalized === 'true') {
    return true
  }

  throw new Error('DRY_RUN 只能配置为 true 或 false')
}

/** In dry-run mode, verify that the editor exists without entering or submitting text. */
export async function prepareOrSubmitMessage(
  editor: Locator,
  keyboard: Keyboard,
  message: string,
  dryRun: boolean,
): Promise<void> {
  await editor.waitFor({ state: 'visible', timeout: 10000 })

  if (dryRun) {
    return
  }

  await editor.click()
  await keyboard.insertText(message)
  await keyboard.press('Enter')
}
