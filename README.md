# 抖音自动续火（迁移版）

本仓库已从旧的“抖音创作者中心”方案迁移到 `https://www.douyin.com/chat` 方案。

核心实现来自 [bling-yshs/douyin-auto-spark](https://github.com/bling-yshs/douyin-auto-spark)，并保留了本仓库原有 `user-data` Environment 中的配置兼容层：

- Cookie：`secrets.COOKIES_CHEN4RL`
- 好友列表：读取 `vars.TASKS[0].targets`
- 消息内容：`vars.MESSAGE_TEMPLATE`
- 定时：每天 `17:00 UTC`，即北京时间次日 `01:00`；GitHub Actions 可能延迟执行

## 使用方法

进入仓库的 **Actions → 🚀 抖音续火（新版） → Run workflow**，可手动验证一次。

如果日志提示“聊天页搜索框未出现，Cookie 可能已经失效”，需要重新从 `https://www.douyin.com/chat` 导出 Cookie，并更新 `user-data` Environment 中的 `COOKIES_CHEN4RL`。

失败时，工作流会上传页面截图到该次运行的 Artifacts，便于判断是 Cookie、验证码还是页面结构问题。

## 许可与来源

本迁移版基于 [bling-yshs/douyin-auto-spark](https://github.com/bling-yshs/douyin-auto-spark) 修改，遵循 GNU GPL v3.0。完整许可见 [LICENSE](LICENSE)。
