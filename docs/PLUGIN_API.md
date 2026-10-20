# 插件 API 文档（v1）

反诈守门人的功能以插件形式组装。游戏对外暴露一个极小的注册接口 `FZ.use()`，插件通过生命周期钩子参与游戏流程。

## 最小示例

```js
FZ.use({
  id: 'hello',          // 必填，全局唯一
  name: '我的插件',
  ver: '1.0.0',
  icon: '你',           // 插件中心里显示的单字图标
  desc: '一句话说明它做什么',
  onJudge(ev) {
    if (ev.combo === 3) FZ.toast('连击 x3！');
  }
});
```

把这段代码粘贴到游戏内「插件中心 → 安装自定义插件」即可运行。

## 生命周期钩子

| 钩子 | 触发时机 | 参数 |
|------|----------|------|
| `onCardShow` | 一张消息卡片滑入时 | `{ card, el }` — card 为题目数据（含 `scam`、`body`、`who`、`why` 等），el 为卡片 DOM |
| `onTick` | 判定倒计时的每一帧 | `{ left, el }` — left 为剩余时间比例（1 → 0） |
| `onJudge` | 玩家判定（拦截/放行/超时）之后 | `{ card, good, dir, delta, combo, mult }` |
| `onSettle` | 一局结束、结算页显示前 | `{ win, score, lost, mode, blocked, falseAlarm, maxCombo, played }` |
| `onTheme` | 关卡换肤时，**可改写**关卡颜色字段 | 关卡配置对象（`accent`、`accent2`、`glow1`、`glow2`） |
| `onEnable` / `onDisable` | 插件开关时 | 无 — 用于挂载/清理自己的 DOM |

> 注意：`onCardShow` 里的卡片会被复用渲染，如需修改 DOM 请只操作本次传入的 `el`；`onTick` 每帧触发，避免在其中做重活。

## FZ 对象

| 方法 | 说明 |
|------|------|
| `FZ.use(def)` | 注册插件（自定义代码必须调用它才算安装成功） |
| `FZ.toast(title, sub)` | 弹出全局提示条（约 2.6 秒） |
| `FZ.storage.get(key, fallback)` | 读取插件的持久化数据（自动 JSON 序列化） |
| `FZ.storage.set(key, value)` | 写入插件的持久化数据 |
| `FZ.fx.setDensity(0~1.6)` | 调整特效粒子密度 |

## 分享格式：`.fzplugin`

`.fzplugin` 就是一个带元信息的 JSON：

```json
{
  "fzplugin": 1,
  "name": "连击音效增强",
  "ver": "1.0.0",
  "desc": "示例插件：连击达到 3 / 5 时弹提示",
  "icon": "⚡",
  "code": "FZ.use({ ... });"
}
```

在插件中心对自定义插件点「导出 .fzplugin」即可生成；导入时游戏会自动解包 `code` 字段执行安装。

## 插件状态持久化

- 开关状态：游戏自动保存在 `localStorage['fz2_plug']`，刷新后恢复
- 自定义插件代码：完整保存在 `fz2_plug.custom`，页面加载时按保存的状态自动重装并启用
- 插件私有数据：经 `FZ.storage` 存取，命名空间为 `fz2_plugst_<key>`

## 安全须知

插件代码在页面上下文中运行，**与游戏本体享有同等权限**——这是一个"友好的扩展机制"，不是安全边界。请只安装你看得懂的、或来自可信来源的插件代码。游戏内安装界面已明示这一点。

## 官方插件实现参考

官方 7 个插件全部基于同一套公开 API 实现（无任何私有通道），源码位于 `index.html` 内 `/* ---- 内置插件 ---- */` 段落，是最好的学习样本：

- `fonts` — 用 `onEnable` 注入 `<style>` + 面板 chips
- `radar` — 用 `onCardShow` 做 DOM 文本标记
- `timerx` — 用 `onTick` 驱动全局进度条
- `coach` — 用 `onJudge` 弹拆解讲解
- `particles` — 用 `setOpt` + `FZ.fx.setDensity`
- `achv` — 用 `onJudge` / `onSettle` 做里程碑统计
- `cb` — 纯开关型插件，桥接既有功能
