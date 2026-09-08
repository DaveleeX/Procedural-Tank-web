# 微缩坦克博物馆

基于 React、Three.js 和 Vite 的交互式 3D 博物馆，包含五个主题展区、总览与展区视角、步行与自动导览、昼夜切换、动态游客和按需加载的高清贴图。

同步自 `tank_museum_web` 的最新网页源码与最终资源，包括游客运动和动画时间步长修复。GitHub 版本采用纯静态 Vite 入口，无需 Blender、后端服务、API 密钥或 Cloudflare 运行时。

## 在线预览

- 网站：[https://procedural-tank-web-git-tank-museum-live-daveleexs-projects.vercel.app](https://procedural-tank-web-git-tank-museum-live-daveleexs-projects.vercel.app)
- 源码：[https://github.com/DaveleeX/tank-museum](https://github.com/DaveleeX/tank-museum)

![Vercel 部署效果](docs/vercel-preview.png)

## 本地运行

需要 Node.js 22.13 或更新版本，推荐 Node.js 24。

```bash
npm ci
npm run dev
```

打开终端输出的本地地址，浏览器需要支持 WebGL2。

## 检查与构建

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

构建产物在 `dist/`。`npm run preview`（或 `npm start`）在本地预览生产构建。GitHub Actions 自动执行安装、类型检查、四项资源与逻辑验证、构建。

## GitHub + Vercel 部署

1. 将本目录内容提交到 GitHub 仓库。
2. 在 Vercel 新建项目并导入该仓库。
3. 若仓库根目录直接包含本 README，Root Directory 保持默认；若上传了整个文件夹，则选择 `tank-museum-github`。
4. 使用 Node.js 24，Framework Preset 为 **Vite**。`vercel.json` 已设置安装命令 `npm ci`、构建命令 `npm run build` 和输出目录 `dist`。
5. 点击 Deploy。部署成功后通过 Vercel 提供的网址参观博物馆；后续推送由 Vercel 自动构建更新。

无需环境变量。此目录包含部署配置，但尚未实际上传或部署到 Vercel。

## 目录

```text
index.html               页面文档、标题与入口
main.tsx                 React 挂载入口
app/                     博物馆页面与样式
components/ui/button.tsx 页面使用的按钮
lib/                     三维引擎、灯光、材质、游客与工具函数
public/museum/           预览图、相机与最终模型资源
scripts/                 资源、昼夜、材质与游客验证
.github/workflows/       GitHub 自动检查
vercel.json              Vercel 静态部署配置
```

`public/museum/model-hybrid/` 中的 glTF、分片 BIN、WebP 和 `lighting.json` 必须一起保留。普通与高清贴图分别服务总览与近景；日间和夜间贴图用于光照混合，并非冗余副本。

## 本次验证

独立 `npm ci` 安装、TypeScript 检查、四项资源与逻辑验证、Vite 生产构建均已通过。已核对导出资源与最新原工程一致，以及构建输出中入口和静态资源完整；未进行线上部署或浏览器交互实测。

## 精简范围

已排除 Blender 工程及备份、建模与烘焙脚本、历史导出、压缩包、对比图、验证报告、node_modules、构建产物、缓存、原 Sites 项目绑定及未使用的模板组件与依赖。原始制作工程未修改。

## 上传到 GitHub

本目录已初始化独立 Git 仓库。创建空的 GitHub 仓库后执行：

```bash
git add .
git commit -m "Update tank museum for Vercel"
git remote add origin <你的 GitHub 仓库地址>
git push -u origin main
```

如果已配置远程地址，无需再次执行 `git remote add`。本项目未指定开源许可证；如需授权他人复用，请选择并添加适用的 LICENSE。
