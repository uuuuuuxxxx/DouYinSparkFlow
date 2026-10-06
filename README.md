# 抖音自动续火（迁移版）

本仓库已从旧的“抖音创作者中心”方案迁移到 `https://www.douyin.com/chat` 方案。

核心实现来自 [bling-yshs/douyin-auto-spark](https://github.com/bling-yshs/douyin-auto-spark)，并保留了本仓库原有 `user-data` Environment 中的配置兼容层：

- Cookie：`secrets.COOKIES_CHEN4RL`
- 好友列表：读取 `vars.TASKS[0].targets`
- 消息内容：每天固定发送一个抖音官方 `[猪头]` 小表情。
- 定时：每天 `17:00 UTC`，即北京时间次日 `01:00`；GitHub Actions 可能延迟执行

## 刷新登录凭据并验证

1. 在浏览器打开 `https://www.douyin.com/chat`，完成登录和必要的安全验证，确认可以看到会话和消息编辑器。
2. 导出该站点完整的 Cookie 数组 JSON，保留 Cookie 的域、路径和值。
3. 打开仓库 **Settings → Environments → user-data → Environment secrets**，更新 `COOKIES_CHEN4RL`。不要把 Cookie 提交到代码或打印到日志。
4. 进入 **Actions → 🚀 抖音续火（新版） → Run workflow**，保持默认勾选 `dry_run`。这次只验证登录、好友标题和编辑器，不输入或发送任何消息。
5. 无发送验证通过后，取消勾选 `dry_run` 才会发送猪头小表情。定时任务继续正常发送。

发布工作流修改触发的 `push` 也只做无发送验证，不会因为合并修复而自动发消息。

工作流使用 `SPARK_MESSAGE_MODE=pig-emoji`：每位好友固定发送一个 `[猪头]`，抖音聊天文本渲染器会将其显示为官方小表情。发送前核对当前聊天标题，已有草稿时停止。发送后必须取得本次消息对应的服务器回执；HTTP 200、按下 Enter 都不算成功。拒绝、仅自己可见、异步待处理、不匹配和超时都报错，同一次调用内不自动重发。

日志“抖音发送接口已确认”仅表示服务端确认接受本次发送，不代表对方已读或双方火花已恢复。旧互动大表情模式只保留无发送检查，正式运行请使用 `pig-emoji`。如需文字轮换可使用 `daily`，原模板和一言使用 `default`。

如果页面显示登录弹窗，脚本明确提示当前 Cookie 未通过认证；如果显示安全验证，则先在浏览器完成验证后重新导出 Cookie。单纯的页面加载超时会单独报错，不会自动认定 Cookie 失效。

失败时，工作流会上传页面截图到该次运行的 Artifacts，便于判断是 Cookie、验证码还是页面结构问题。

本地设置 `DRY_RUN=true` 后运行 `pnpm dev`。首次运行回归测试时先执行 `pnpm exec playwright install chromium`（已有本地 Chrome 的 Windows 可直接使用）；`pnpm check` 会运行全部测试、类型、lint 和格式检查。回归测试仅使用本地页面和模拟回执，不访问抖音或发送消息。无发送验证通过不代表真实发送已经验收。

## 许可与来源

本迁移版基于 [bling-yshs/douyin-auto-spark](https://github.com/bling-yshs/douyin-auto-spark) 修改，遵循 GNU GPL v3.0。完整许可见 [LICENSE](LICENSE)。
