# 架构说明

## 总体形态

整个游戏是**一个 HTML 文件**（`index.html`），内联全部 CSS 与 JS，无构建、无依赖、无网络请求。这个形态是有意为之：

- 反诈宣传场景经常需要"扫码打开就用"，不能假设用户会安装任何东西
- 单文件可以整体离线（PWA service worker 直接缓存一个 URL）
- 教学场景可以直接读源码

## 模块划分（同一文件内的段落顺序）

```
POOLS / LEVELS / HELL     题库与关卡配置（56 诈骗 + 47 真实消息）
Game IIFE
 ├─ 状态                   钱包、得分、连击、队列、计时
 ├─ 音效                   WebAudio 合成，无音频文件
 ├─ applyTheme             关卡换肤（onTheme 钩子点）
 ├─ makeCard / renderDeck  卡片渲染（onCardShow 钩子点）
 ├─ startTimer             rAF 倒计时（onTick 钩子点）
 ├─ bindDrag               指针拖拽 + 键盘 + 底部按钮三通道输入
 ├─ resolve                判定核心（onJudge 钩子点）
 ├─ FX                     Canvas 2D 特效引擎（粒子/钞票雨/扫描线，密度可调）
 ├─ 关卡流程                startRun / beginLevel / clearLevel / finishRun（onSettle 钩子点）
 ├─ 结算衍生                反诈画像 / 战绩趋势 / 止损指引 / 反诈笔记 / 战绩海报
 ├─ 独立玩法                今日一题 / 骗子视角 / 长辈版 / 速查表 / 好友挑战码
 ├─ PLUG                   插件引擎 + 7 个官方插件
 └─ 启动                   恢复存档 → 注册内置插件 → boot → 首页渲染
```

## 插件引擎

```
PLUG
 ├─ use(def)        注册（官方/自定义共用同一入口）
 ├─ enable/disable  挂载/摘除钩子，触发 onEnable/onDisable
 ├─ fire(name,arg)  逐个调用钩子，单个插件出错不影响游戏
 ├─ boot()          启动时恢复存档：重装自定义插件代码 → 恢复开关状态
 └─ plugRunCode()   自定义插件装载：new Function('FZ', code)，
                    只提供白名单 API（use/toast/storage/fx）
```

设计取舍：

- **钩子带 try/catch**：任何插件崩溃都不能拖垮主流程
- **this 绑定**：钩子入列时 `fn.bind(def)`，插件作者不需要关心调用方式
- **onTheme 可改写参数**：换肤前触发，插件可以直接改 `accent` 等字段实现主题覆写
- **不隔离运行环境**：见 PLUGIN_API.md 的安全须知——面向教学的诚实取舍，UI 已明示

## 数据与存档

全部状态在 `localStorage`（键名前缀 `fz2_`）：最高分、地狱解锁、静音、历史战绩、打卡、色觉设置、插件状态。清除浏览器数据即重置。

## 测试

jsdom + mock 2D context 做全量回归（关卡平衡性、全部玩法、插件系统 40 项），另有 CSS 静态一致性检查（类名/ID/keyframes/变量/导出 API 对应）。
