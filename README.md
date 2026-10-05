# 抖音自动续火（迁移版）

本仓库已从旧的“抖音创作者中心”方案迁移到 `https://www.douyin.com/chat` 方案。

核心实现来自 [bling-yshs/douyin-auto-spark](https://github.com/bling-yshs/douyin-auto-spark)，并保留了本仓库原有 `user-data` Environment 中的配置兼容层：

- Cookie：`secrets.COOKIES_CHEN4RL`
- 好友列表：读取 `vars.TASKS[0].targets`
- 消息内容：从 `assets/spark-messages.json` 的 30 条简短打卡消息中按北京时间每日轮换。
- 定时：每天 `17:00 UTC`，即北京时间次日 `01:00`；GitHub Actions 可能延迟执行

## 刷新登录凭据并验证

1. 在浏览器打开 `https://www.douyin.com/chat`，完成登录和必要的安全验证，确认可以看到会话和消息编辑器。
2. 导出该站点完整的 Cookie 数组 JSON，保留 Cookie 的域、路径和值。
3. 打开仓库 **Settings → Environments → user-data → Environment secrets**，更新 `COOKIES_CHEN4RL`。不要把 Cookie 提交到代码或打印到日志。
4. 进入 **Actions → 🚀 抖音续火（新版） → Run workflow**，保持默认勾选 `dry_run`。这次只验证登录、好友和消息编辑器，不输入或发送任何消息。
5. 无发送验证通过后，取消勾选 `dry_run` 才会提交当天的轮换消息。定时任务继续正常发送。

发布工作流修改触发的 `push` 也只做无发送验证，不会因为合并修复而自动发消息。

工作流使用 `SPARK_MESSAGE_MODE=daily`：每天北京时间零点切换内容，同一天补跑使用同一条，连续两天内容不同，30 天后循环。可直接编辑 `assets/spark-messages.json` 添加或替换消息，至少保留两条不同的非空内容。未设置该模式或设置为 `default` 时，仍使用原有模板或一言；`daily` 模式会覆盖固定的 `[猪头]` 模板。

如果页面显示登录弹窗，脚本明确提示当前 Cookie 未通过认证；如果显示安全验证，则先在浏览器完成验证后重新导出 Cookie。单纯的页面加载超时会单独报错，不会自动认定 Cookie 失效。

失败时，工作流会上传页面截图到该次运行的 Artifacts，便于判断是 Cookie、验证码还是页面结构问题。

本地设置 `DRY_RUN=true` 后运行 `pnpm dev`。首次运行回归测试时先执行 `pnpm exec playwright install chromium`（已有本地 Chrome 的 Windows 可直接使用）；`pnpm check` 会运行全部测试、类型、lint 和格式检查。回归测试只加载本地 HTML，不访问抖音或发送消息。实际提交消息的日志不代表已验证收件人成功收到消息。

## 许可与来源

本迁移版基于 [bling-yshs/douyin-auto-spark](https://github.com/bling-yshs/douyin-auto-spark) 修改，遵循 GNU GPL v3.0。完整许可见 [LICENSE](LICENSE)。
