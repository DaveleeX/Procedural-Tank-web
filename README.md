# 微缩坦克博物馆

基于 React、Three.js 和 Vinext 的交互式 3D 博物馆，包含五个主题展区、总览与展区视角、步行与自动导览、昼夜切换、动态游客和按需加载的高清贴图。

## 本地运行

需要 Node.js 22.13 或更新版本，以及 npm。推荐使用 Node.js 24。

```bash
npm ci
npm run dev
```

打开终端输出的本地地址。运行时无需 Blender、外部模型目录、API 密钥或原 Sites 项目。

## 检查与构建

```bash
npm run typecheck
npm test
npm run build
npm start
```

`npm start` 使用 Wrangler 在本地预览 `dist/server/wrangler.json` 定义的生产构建，需先执行构建。当前采用 Cloudflare Worker 构建方式，不能直接作为静态 GitHub Pages 目录发布。GitHub Actions 会执行安装、类型检查、资源与逻辑验证、构建。

## 目录

```text
app/                    页面、布局和样式
components/ui/button.tsx 页面实际使用的按钮
lib/                    三维引擎、灯光、材质、游客与工具函数
public/museum/          预览图、相机与最终模型资源
scripts/                资源、昼夜、材质与游客验证
.github/workflows/       GitHub 自动检查
```

`public/museum/model-hybrid/` 中的 glTF、分片 BIN、WebP 和 `lighting.json` 必须一起保留。普通与高清贴图分别用于总览和进入展区后的加载；日间和夜间贴图用于光照混合，并非重复文件。

## 精简范围

此目录仅保留可独立安装、运行、构建和验证的网页工程。已排除 Blender 工程及备份、建模与烘焙脚本、历史导出、压缩包、渲染对比图、验证报告、安装依赖、构建产物、缓存、旧 Git 历史、原 Sites 项目绑定，以及未使用的模板组件与依赖。

最终网页所需的导出资源已经包含在仓库中。此版本不包含重新建模或重新烘焙的制作工程。原文件保留在上级目录的原工程中。

## 本次验证

类型检查、四项资源与逻辑验证、生产构建均通过。本机磁盘空间不足，完整 `npm ci` 未完成；本次临时复用原工程已安装依赖进行验证，临时链接和构建产物已移除。精简后的锁文件已由 npm 重新生成，干净安装将在 GitHub Actions 中再次检查。

## 上传到 GitHub

本目录已初始化独立 Git 仓库，尚未创建提交或配置远程。创建空的 GitHub 仓库后，在本目录执行：

```bash
git add .
git commit -m "Initial tank museum project"
git remote add origin <你的 GitHub 仓库地址>
git push -u origin main
```

仓库未指定开源许可证；如需授权他人复用，请自行选择并添加适用的 LICENSE。
