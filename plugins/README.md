# plugins/

本目录收容社区插件。每个插件是一个 `.fzplugin` 文件（JSON，含 `code` 字段），在游戏内「插件中心 → 安装自定义插件 → 从文件导入」即可装载。

## 目录

- [examples/combo-sound.fzplugin](examples/combo-sound.fzplugin) — 入门示例：监听 `onJudge`，连击里程碑弹提示
- [examples/green-theme.fzplugin](examples/green-theme.fzplugin) — 主题示例：监听 `onTheme`，把全部关卡覆写为青绿色系

## 投稿

1. 按 [docs/PLUGIN_API.md](../docs/PLUGIN_API.md) 编写插件
2. 在游戏内导出 `.fzplugin`，或手写 JSON（`code` 字段放完整插件代码）
3. 提交 PR 到 `plugins/<分类>/<你的插件id>.fzplugin`

要求：`id` 全局唯一且描述性命名（如 `author-name-feature`）、不收集任何用户数据、不修改游戏计分逻辑（那些属于作弊插件，不会被合并）。
