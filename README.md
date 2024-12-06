# GitHub Proxy Deno

这是一个 GitHub Release 和 Archive 等的加速项目，可部署于 [Deno Playground](https://deno.dev) 上。项目的源代码来自 [hunshcn/gh-proxy](https://github.com/hunshcn/gh-proxy)。

> [!Warning]
>
> **严正声明**
>
> 请勿将本项目用于任何违法用途，否则引起的任何后果与本项目及项目作者无关！

## 为什么用 Deno？

不为什么。我对 Deno 没什么了解和兴趣，只是想用用 Cloudflare Workers 之外的服务部署这个项目，又恰好想起来有这么个东西而已。

## 部署方法

- 使用 GitHub 登录 [Deno Dev](https://deno.dev) 平台。
- 点击 New Playground（**注意不是 New Project**）按钮，创建一个新的 Playground。
- 将本项目的 `main.ts` 复制下来，粘贴到 Playground 编辑器中，点击部署即可。

## FAQ

**Q：有示例站点吗？**

A：有，看侧边栏。不过我还是建议自己部署一个，也不费劲。而且我的免费计划就那么点额度，也没什么薅羊毛的价值。

**Q：UI 和原项目为什么不一样？**

A：这个原型是我用 v0 搓的，然后自己改了很多样式。源码在[这里](https://github.com/chlorine3545/gh-proxy-frontend)。

## Acknowledgments

- 感谢 Deno Dev 提供的免费额度。
- 感谢 Hunshcn 的原始项目。
- 感谢 GitHub Copilot 提供的大力支持。

## License

MIT。
