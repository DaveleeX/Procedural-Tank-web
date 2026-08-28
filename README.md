# Procedural Image to Model

## 工具介绍

这是一套 **程序化基于图片建模** 的 Agent 技能：把参考照片当成证据，用可编辑的几何体（拉伸、扫描、布尔等）还原对象，而不是生成不可改的网格。

一次完整流程会：

1. 读图、列出可见构件
2. 先搭轮廓和相机，再按模块细化
3. 对着同一视角反复渲染对比
4. 导出 STL / GLB，并写明哪些部分是推断的

适合建筑、产品、车辆等需要「看起来像原图、还能改参数」的重建。不适合直接当摄影测量或 image-to-mesh 来用。

## 使用说明

**需要：** Git、Node.js（LTS）、以及能读文件、跑命令的 Agent（Cursor / Codex / Claude Code 等）。准备好一张或多张原图。

### 1. 克隆仓库

```bash
git clone https://github.com/DaveleeX/Procedural-Tank-web.git
cd Procedural-Tank-web
```

### 2. 安装为技能

把本目录放到 Agent 的 skills 文件夹，或在对话里指向 `SKILL.md`。

然后给出参考图，用一句话启动，例如：

> 根据这些参考图，程序化重建可编辑的 CAD 模型；内部迭代到质量门通过后再交付源码、对比图和导出文件。

不要把第一版粗模当成完成件。Agent 应自己分析、建模、对比、修正，直到过关。

### 3. （可选）安装本地 CAD 工具链

若本机还没有建模/渲染 CLI：

```bash
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh --target ./procedural-cad --skip-run
```

Windows：

```powershell
./scripts/bootstrap.ps1 -Target ./procedural-cad -SkipRun
```

没有主场景文件时必须加 `--skip-run`。需要给指定 Agent 装技能库时，可再加 `--agent codex`（或 `claude` / `opencode`）。

### 4. 看结果是否合格

交付里应有模块化源码、参考视角对比、以及 STL 或 GLB。也可用：

```bash
python3 scripts/readiness_gate.py <项目目录>
```

脚本只检查材料齐不齐；像不像原图，仍要对照片和渲染图。

## 示例：Armour Atlas 各国主战坦克蓝图

`demo/tank-atlas/` 是一个自包含的网页 demo 合集：M1A2、豹 2A7、99A、T-90M、挑战者 2、勒克莱尔、虎 I
七台车由参数化几何体在浏览器里现场构建，隐藏线渲染成可交互的三维蓝图。左侧竖状列表切换车辆，
支持 360° 环绕、六个定位视角、总成隔离、分解视图、外壳透视（看内部结构）、行驶动画和 STL 导出。

第一次克隆（Windows CMD：**一次只贴一条命令**）。旧目录没有 git，请克隆到新文件夹：

```bat
git clone https://github.com/DaveleeX/Procedural-Tank-web.git F:\SynologyDrive\AI\Coding\OPT\Tank-atlas
```

命令行不顺时，浏览器打开 zip 解压后双击 `serve.bat`：
https://github.com/DaveleeX/Procedural-Tank-web/archive/refs/heads/main.zip

| 机器 | 工作副本 |
| --- | --- |
| Windows | `F:\SynologyDrive\AI\Coding\OPT\Tank-atlas` |
| macOS | `/Users/lee/Tank-model-build` |

```bat
cd /d F:\SynologyDrive\AI\Coding\OPT\Tank-atlas
git pull
py -3 serve.py
```

```bash
# macOS
cd /Users/lee/Tank-model-build
git pull
./serve.sh
```

打开 http://127.0.0.1:8123/demo/tank-atlas/ 。不要用 `file://` 打开 `index.html`。

细节与保真度说明见 [`demo/tank-atlas/README.md`](demo/tank-atlas/README.md)。

## 仓库结构

| 路径 | 作用 |
| --- | --- |
| `SKILL.md` | Agent 主指令 |
| `demo/tank-atlas/` | 七国坦克程序化蓝图网页合集 |
| `serve.py` / `serve.sh` / `serve.bat` / `serve.ps1` / `windows-get-atlas.cmd` | 本机静态预览（Windows / macOS 同一套，http://127.0.0.1:8123/demo/tank-atlas/） |
| `references/` | 工作流与质量标准 |
| `assets/templates/` | 证据、迭代、就绪报告模板 |
| `scripts/bootstrap.sh` / `.ps1` | 环境引导 |
| `scripts/readiness_gate.py` | 交付完整性检查 |
