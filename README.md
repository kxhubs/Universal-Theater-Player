# Universal Theater Player

> 通用影院模式播放器。点一下按钮，把网页里的视频搬到一个更干净、更顺手的播放界面里。

Universal Theater Player 是一个用户脚本，主要用来给一些视频网站补一个好用的影院模式。

它改自 [Miss Player｜影院模式（单手播放器）](https://sleazyfork.org/zh-CN/scripts/453300-miss-player-%E5%BD%B1%E9%99%A2%E6%A8%A1%E5%BC%8F-%E5%8D%95%E6%89%8B%E6%92%AD%E6%94%BE%E5%99%A8)。原脚本的手感很好，这个版本在它的基础上改成了更通用的名字，并针对当前支持的网站做了一些整理和修复。

## 这个脚本能做什么

- 一键把网页视频切到影院模式。
- 视频会出现在一个独立的黑色播放界面里，页面上的杂乱内容不会挡住观看。
- 支持播放、暂停、进度条、音量、倍速、快进、快退。
- 支持设置一小段视频循环播放。
- 手机上也能单手操作，竖屏看视频时更顺手。
- 退出影院模式后，会回到原来的网页。
- 对一些“点了影院模式只是把原播放器放大”的网站做了适配，比如 Supjav。

## 支持的网站

目前脚本主要在这些网站上启用：

| 网站 | 网站 |
| --- | --- |
| `jable.tv` | `missav.ai` |
| `missav.ws` | `missav.live` |
| `hanime1.me` | `hanimeone.me` |
| `hanime1.com` | `javchu.com` |
| `91porn.com` | `hsex.tv` |
| `51cg1.com` | `jav.guru` |
| `supjav.com` | `123av.com` |

如果某个网站改版后按钮不显示、进不了影院模式，或者只是在原页面里放大播放器，一般就是网站播放器结构变了，需要重新适配。

## 安装方法

### Android、Windows、macOS

1. 先安装 [Tampermonkey](https://www.tampermonkey.net/) 或其他用户脚本管理器。
2. 安装本项目里的 [universal-theater-player_greasyfork.user.js](./universal-theater-player_greasyfork.user.js)。
3. 回到视频网站，刷新页面。

### iPhone、iPad

可以用下面这些 Safari 用户脚本扩展：

- [Stay for Safari](https://apps.apple.com/cn/app/stay-for-safari-%E6%B5%8F%E8%A7%88%E5%99%A8%E4%BC%B4%E4%BE%A3/id1591620171)
- [Userscripts](https://apps.apple.com/cn/app/userscripts/id1463298887)

装好扩展后，把本项目的 `.user.js` 文件导入进去即可。

## 使用方法

1. 打开支持的网站，进入视频详情页。
2. 等播放器加载出来。
3. 点击页面上的粉色悬浮按钮。
4. 进入影院模式后，就可以用脚本自带的控制栏看视频。
5. 点关闭按钮，可以回到原网页。

如果你用的是 Tampermonkey，并且遇到 Supjav 这类网站无法正常进入影院模式，可以检查一下脚本设置里的“仅在顶层页面（框架）运行”。这个选项建议设为“否”，否则有些网页里的播放器脚本进不去。

## 更新记录

### 5.1.10.9

- 修复 Supjav 关闭影院模式后，再次点击按钮可能打不开的问题。

### 5.1.10.8

- 修复 Supjav 点击影院模式时，只是放大原网站播放器的问题。

### 5.1.10.7

- 改进 Supjav 多种播放源的兼容性。

### 5.1.10.6

- 脚本更名为 Universal Theater Player。
- 整理脚本支持的网站范围。

## 后续计划

- 继续修复网站改版带来的兼容问题。
- 继续优化手机竖屏观看体验。
- 适配更多常见播放器和视频网站。

## 许可证

MIT
