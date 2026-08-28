# Armour Atlas · 各国主战坦克程序化蓝图

一个自包含的网页合集：七个国家的标志性坦克，左侧竖状列表切换，360° 自由环绕，
分解视图与外壳透视用来看内部结构。

整车不是导入的网格模型，而是在浏览器里由参数化几何体现场构建的；渲染走"隐藏线"路线——
面用接近背景色的实体填充遮挡后方，棱线单独描边，得到一张活的三维蓝图。

参考交互与呈现风格：[@yadong_xie 的 web 场景交互演示](https://x.com/yadong_xie/status/2092623470630973826)。

## 收录车辆

| | 车辆 | 结构识别点 | 内部差异 |
| --- | --- | --- | --- |
| 🇺🇸 | **M1A2 Abrams** | 低矮流线型底盘、巨大棱角炮塔、修长 120 mm 滑膛炮、防火箭弹铁丝网 | AGT-1500 燃气轮机、隔舱化尾舱弹药架 |
| 🇩🇪 | **Leopard 2A7** | 箭镞状楔形附加装甲、AMAP 侧模块、PERI R17 车长全景镜 | MTU 动力包、车体左侧弹药舱 |
| 🇨🇳 | **ZTZ-99A** | V 型正面模块化反应装甲、车顶 JD-3 激光压制装置、锋利重装甲板 | 转盘式自动装弹机（22 发） |
| 🇷🇺 | **T-90M** | 低矮穹顶炮塔、鱼鳞状「化石」反应装甲、炮塔后部格栅装甲 | 转盘式自动装弹机、最小的车体 |
| 🇬🇧 | **Challenger 2** | 笨重魁梧轮廓、220 mm 乔巴姆侧裙、带隔热套的线膛炮 | 油气弹簧悬挂、装甲发射药舱（药筒分离存放） |
| 🇫🇷 | **Leclerc XLR** | 超紧凑炮塔、光滑模块化装甲板、GALIX 自卫发射器 | 尾舱式自动装弹机（22 发） |
| 🇩🇪 | **Tiger I**（1943） | 交错式负重轮、悬垂侧裙、阶梯式车头 | 前置变速箱与穿过战斗室的传动轴、5 名乘员 |

三种装填方式（人工装填 / 转盘自动装弹 / 尾舱自动装弹）与两种悬挂（扭杆 / 油气弹簧）
在分解和透视视图里可以直接对照，这也是这个合集最值得看的地方。

## 运行（Windows / macOS 同一套命令）

不需要构建，不需要联网（three.js 已随仓库分发在 `vendor/`）。
**不要**双击 `index.html`：`file://` 会被浏览器的 ES module 策略拦住。

两台机器用 **git 同步**（目录可以不同，分支必须相同）：

| 机器 | 工作副本 |
| --- | --- |
| Windows | `F:\SynologyDrive\AI\Coding\OPT\Tank-atlas` |
| macOS | `/Users/lee/Tank-model-build` |

分支：`cursor/tiger-tank-web-preview-demo-1c20`。换机前在当前机器 `git push`，换机后 `git pull`。

### 第一次（Windows）：不要一次粘贴多行

CMD 会把多行粘成一行。**一次只复制下面的一条，回车，等出现新的 `>` 再复制下一条。**

如果命令行一直失败，改用浏览器下载 zip（见下一小节）。

旧目录 `Tank-web-preview-demo` 里没有 `.git`，不要在那里 `git pull`。克隆到新文件夹 `Tank-atlas`：

第 1 条：

```bat
git clone https://github.com/DaveleeX/Procedural-Tank-web.git F:\SynologyDrive\AI\Coding\OPT\Tank-atlas
```

第 2 条（克隆结束后）：

```bat
cd /d F:\SynologyDrive\AI\Coding\OPT\Tank-atlas
```

第 3 条：

```bat
py -3 serve.py
```

也可以把仓库里的 `windows-get-atlas.cmd` 下载到桌面后双击，它会自动克隆并启动。

### 浏览器下载 zip（不用敲命令）

1. 用 Edge / Chrome 打开：https://github.com/DaveleeX/Procedural-Tank-web/archive/refs/heads/main.zip
2. 解压到 `F:\SynologyDrive\AI\Coding\OPT\`
3. 进入解压出来的文件夹（能看到 `serve.bat`、`serve.py`）
4. 双击 `serve.bat`

### macOS（Terminal）

```bash
mkdir -p /Users/lee/Tank-model-build
git clone https://github.com/DaveleeX/Procedural-Tank-web.git \
  /Users/lee/Tank-model-build
```

### 之后：更新并预览

共用入口是仓库根目录的 `serve.py`（需要 Python 3）。地址一律是：

http://127.0.0.1:8123/demo/tank-atlas/

Windows：

```bat
cd /d F:\SynologyDrive\AI\Coding\OPT\Tank-atlas
git fetch origin
git checkout cursor/tiger-tank-web-preview-demo-1c20
git pull
py -3 serve.py
```

`py -3` 比 `python` 更稳（Windows 常把 `python` 做成空别名，跑了没输出）。没有 `py` 再用 `python serve.py`。也可以双击 `serve.bat`。

CMD 里换盘必须用 `cd /d F:\...`，只写 `cd F:\...` 不会离开 C:。

macOS：

```bash
cd /Users/lee/Tank-model-build
git fetch origin
git checkout cursor/tiger-tank-web-preview-demo-1c20
git pull
./serve.sh
```

或 `python3 serve.py`。端口被占用时：`python3 serve.py --port 8124`。

操作预览（七国切换 · 分解 · 透视，约 68 秒）：[`preview.mp4`](preview.mp4)（1280×800，约 8.5 MB）。

## 交互

| 操作 | 说明 |
| --- | --- |
| 左侧 VEHICLE INDEX | 切换车辆（首次点击时才编译该车几何，之后缓存） |
| 拖拽 / 滚轮 / Shift+拖拽 | 环绕、推拉、平移；静止 2.4 秒后自动巡航 |
| CAMERA VIEW | 3/4 R · 3/4 L · SIDE · FRONT · REAR · PLAN，取景按车辆包围盒自动计算 |
| **EXPLODE 分解** | 按层分解，滑块连续控制 0–100%，镜头自动后退取景 |
| **CUTAWAY 透视** | 外壳只留棱线、内部构件高亮，不用分解就能看内部布置 |
| SYSTEM INDEX | 隔离某个总成（其余变暗，外壳自动透明）并切到对应视角 |
| ANIMATE | 履带滚动、负重轮转动、炮塔回转、火炮俯仰 |
| 点击构件 | 右上角显示图号、中英文名称、技术参数与证据等级 |
| EXPORT STL | 把当前车辆（含每一块履带板）烘焙导出为二进制 STL |
| 键盘 | `1–6` 视角 · `E` 分解 · `C` 透视 · `A` 动画 · `S` 静止 · `↑↓` 换车 · `L` 引线 · `G` 网格 · `H` 隐藏面板 |

## 结构

```text
demo/tank-atlas/
  index.html            面板与图纸框
  styles.css            蓝图配色与排版（国别墨色由 JS 注入 CSS 变量）
  src/registry.js       车辆元数据、规格表、设计描述词、懒加载入口
  src/kit.js            通用建模工具：车体轮廓、棱台炮塔、楔形/反应/格栅装甲、
                        行走装置、火炮、甲板附件
  src/internals.js      内部结构：动力包、传动、自动装弹机、弹药架、炮闩、
                        乘员、扭杆/油气悬挂
  src/vehicle.js        车辆构建器、总成分类、履带装配
  src/blueprint.js      Part（面+棱线）、LinkBelt（实例化履带）、透视模式、国别调色
  src/geo.js            几何工具：轮廓拉伸、棱台、镜像、合并、履带包络（圆的凸包）
  src/camera-rig.js     球坐标环绕 + 包围盒精确取景
  src/callouts.js       引线标注（投影 + 防重叠）
  src/main.js           装配、切换、拾取、遥测、导出、主循环
  src/vehicles/*.js     七台车，各自一个模块
  vendor/               three.js r185（MIT）与 STLExporter / BufferGeometryUtils
```

每台车的模块顶部都有一张 `P` 参数表（车体长宽高、炮塔环位置、炮管长度、负重轮数量与间距……），
改一个数值整车连带履带包络一起重算。视角距离不是手调的，`camera-rig.js` 会按包围盒在
屏幕上的投影精确解算，所以换车、隔离总成、分解时都能自动取景。

## 尺寸与保真度

以公开数据为基准，几何用浏览器控制台的 `__ATLAS__.bounds()` 实测（毫米）：

| 车辆 | 全宽（实车 / 模型） | 全长含炮（实车 / 模型） | 全高（实车 / 模型，不含天线） |
| --- | --- | --- | --- |
| M1A2 | 3660 / 3745 | 9830 / 9840 | 2440 / 2480 |
| Leopard 2A7 | 3760 / 3760 | 10970 / 10995 | 3030 / 3033 |
| ZTZ-99A | 3500 / 3580 | 11000 / 11240 | 2370 / 2460 |
| T-90M | 3780 / 3760 | 9530 / 9990 | 2230 / 2330 |
| Challenger 2 | 4200 / 4260 | 11550 / 11817 | 2490 / 2610 |
| Leclerc | 3710 / 3640 | 9870 / 10050 | 2530 / 2540 |
| Tiger I | 3705 / 3725 | 8450 / 8450 | 3000 / 2945 |

差异主要来自外挂件：模型把挡泥板、格栅装甲、尾部工具箱、排气口这些实车公布尺寸里
通常不计的附件也算进了包围盒；天线一律缩短到 0.6 m，否则会主导包围盒并浪费取景空间。

**证据等级**（点击构件可在右上角看到）：

- **confirmed** — 车体、炮塔、火炮、行走装置、履带、动力舱的主要形体与尺寸有公开数据支撑。
- **probable** — 附加装甲与工具箱的具体布置：各批次差异很大，此处按常见照片布置。
- **inferred** — 内部构件的具体形状。位置、体积和相互关系按公开剖视图布置，但**外形是示意的**：
  发动机不是按真实缸体建模，弹药架不是按真实卡具建模。

**已知限制，不要当成工程图纸用：**

- 内部只做到"体积与布局"级别，不是真实零件；装甲是实体块而不是分层板件，不能做防护计算。
- 迷彩、涂装、环境（沙尘、泥浆、雪地、雨雾）无法在隐藏线蓝图里表现，只在面板里以文字记录。
- 导出的 STL 可用于可视化，**未**做壁厚、流形性、最小特征尺寸检查，不能直接当 3D 打印件。
- 各车均取一个具体构型（M1A2 SEPv3 带 TUSK、豹 2A7、99A、T-90M、挑战者 2 基本型、
  勒克莱尔 XLR、虎 I 1943 年中期），不同批次的差异未逐一区分。
