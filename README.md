# Universal Theater Player | 影院模式（单手播放器）

`Universal Theater Player` 是一个通用网页视频影院模式小工具，主要提升竖屏看网页视频时的画面面积，并提供便捷的进度跳转、倍速、音量和片段循环控制。

本脚本改自原 `Miss Player | 影院模式（单手播放器）`，在保留单手播放器核心体验的基础上，去掉了脚本名称中的站点品牌，并将适配范围从“匹配所有网站”收窄为指定网站。

原脚本地址：

- [SleazyFork：Miss Player | 影院模式（单手播放器）](https://sleazyfork.org/zh-CN/scripts/453300-miss-player-%E5%BD%B1%E9%99%A2%E6%A8%A1%E5%BC%8F-%E5%8D%95%E6%89%8B%E6%92%AD%E6%94%BE%E5%99%A8)
- [原脚本更新地址](https://update.sleazyfork.org/scripts/453300/Miss%20Player%20%7C%20%E5%BD%B1%E9%99%A2%E6%A8%A1%E5%BC%8F%20%28%E5%8D%95%E6%89%8B%E6%92%AD%E6%94%BE%E5%99%A8%29.user.js)

## 它能干啥？

### 单手播放器

适用于支持站点的大部分网页视频。

- 点击页面底部粉色按钮进入播放器。
- 竖屏单手模式更舒服，特别适合手机单手握持观看。
- 想看哪里就放大哪里：拖动视频下方的小白条即可调整画面位置和大小。
- 快速跳转：支持 5 秒、10 秒、30 秒、1 分钟、5 分钟、10 分钟等快捷跳转。
- 支持循环播放指定片段，适合反复观看某一段内容。
- 支持播放/暂停、进度条、音量、倍速等常用控制。

### 影院模式适配

- 支持普通页面内 video 元素。
- 支持部分跨域 iframe 播放器。
- 自动隐藏部分网站置顶栏，避免导航栏挡住影院模式播放器。
- 退出影院模式时尽量恢复原播放器和页面布局。

### 网站体验优化

原脚本包含部分面向 MissAV 的体验优化，例如广告处理、自动登录、自动切换高画质、自动展开视频详情和列表标题展开等。

本通用版保留原有能力，但脚本运行范围已经收窄到指定站点，不再对所有网站生效。

## 支持网站

脚本仅在以下站点及其子域名启用：

- `jable.tv`
- `missav.ai`
- `missav.ws`
- `missav.live`
- `hanime1.me`
- `hanimeone.me`
- `hanime1.com`
- `javchu.com`
- `91porn.com`
- `hsex.tv`
- `51cg1.com`
- `jav.guru`
- `supjav.com`
- `123av.com`

为支持跨域播放器 iframe，脚本额外适配以下已知播放器域名：

- `supremejav.com`
- `fc2stream.tv`
- `turbovidhls.com`
- `streamtape.com`
- `voe.sx`
- `surrit.store`
- `18av.mm-cg.com`

## 最近调整

### 5.1.10.9

- 修复跨域子播放器关闭后仍保留“已打开”状态，导致再次进入影院模式不重建界面的问题。

### 5.1.10.8

- 修复 `supjav.com` 的 TV 源最终跳转到 `turbovidhls.com` 后，消息链路中断、只能放大原 iframe 的问题。

### 5.1.10.7

- 修复 `supjav.com` 的跨域路由页及其 FST、ST、VOE 播放器未注入脚本，影院模式只能放大原 iframe 的问题。

### 5.1.10.6

- 脚本名称改为 `Universal Theater Player | 影院模式（单手播放器）`。
- 去掉脚本显示名称中的 `Miss` 站点品牌。
- 不再匹配所有网站，改为只匹配明确适配的网站。
- 保留跨域 iframe 播放器适配。
- 增加本说明文档。

### 5.1.10.x

- 修复部分站点没有悬浮按钮的问题。
- 修复跨域 iframe 页面无法获取正在播放视频的问题。
- 修复顶栏遮挡影院模式播放器的问题。
- 修复退出 iframe 影院模式时播放器像刷新一样重新加载的问题。

## ToDo

- 继续兼容更多视频网站。
- 继续优化纵向视频显示。
- 横屏模式与竖屏模式设置分别存储、持久化。
- 针对更多站点做体验优化。

## 怎么安装？

### iOS / iPadOS

推荐方法 1：

使用 [Stay for Safari](https://apps.apple.com/cn/app/stay-for-safari-%E6%B5%8F%E8%A7%88%E5%99%A8%E4%BC%B4%E4%BE%A3/id1591620171)，安装后打开脚本页面，通过 Stay 安装脚本。

推荐方法 2：

使用 [Userscripts](https://apps.apple.com/cn/app/userscripts/id1463298887)。

### Android / Windows / macOS

安装 [Tampermonkey](https://www.tampermonkey.net/) 或其他兼容的用户脚本管理器，然后安装脚本文件：

`outputs/miss-player.debug-fixed.user.js`

## 使用方式

1. 打开支持的网站视频页面。
2. 点击页面底部或右下角的粉色悬浮按钮。
3. 进入影院模式后，通过播放器控制栏进行播放、暂停、跳转、倍速、循环片段等操作。
4. 点击影院模式内的关闭按钮退出。

## 许可证

MIT
