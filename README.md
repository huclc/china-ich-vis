# 中国国家级非物质文化遗产时空分布可视分析

## 快速查看（无需安装）

直接双击打开 `dist/index.html` 即可在浏览器中查看完整可视化大屏。

## 部署运行（从源代码）

### 环境要求

- Node.js 18+（推荐 20 LTS）
- npm 9+

### 安装与启动

```bash
# 1. 进入项目目录
cd ich-3d-datav

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:3001` 即可查看。

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录，双击 `dist/index.html` 即可直接打开（已配置相对路径）。

## 项目结构

```
ich-3d-datav/
├── index.html                    # 入口 HTML
├── package.json                  # 依赖配置
├── vite.config.ts                # 构建配置
├── tsconfig.json                 # TypeScript 配置
├── public/                       # 静态资源（数据 JSON、图片、字体）
│   ├── chart1_category_trend.json
│   ├── chart2_province_rank.json
│   ├── chart3_category_rank.json
│   ├── chart4_multiloc.json
│   ├── chart5_region_heatmap.json
│   ├── chart6_batch_type.json
│   ├── dashboard_stats.json
│   ├── ich_heatmap.json
│   ├── ich_province_list.json
│   ├── province_year_data.json
│   ├── weibo_wordfreq.json
│   ├── weibo_analysis_deepseek.json
│   └── ...
├── src/
│   ├── main.tsx                  # 应用入口
│   ├── App.tsx
│   ├── pages/Demo0/
│   │   ├── demo.tsx              # 大屏主页面
│   │   ├── map/                  # 3D 地图模块
│   │   │   ├── index.tsx         # 地图容器（投影 + 入场动画）
│   │   │   ├── baseMap.tsx       # 省份地形 + 3D 柱 + 热力图 + 标签
│   │   │   ├── IchHeatmap.tsx    # 热力云
│   │   │   ├── flyLine.tsx       # 金色飞线
│   │   │   └── ProvinceTooltip.tsx
│   │   ├── panel/                # 面板图表
│   │   │   ├── index.tsx         # 面板布局（SVG 标题 + 统计卡片 + 图表网格）
│   │   │   ├── chart1.tsx        # 类别结构变迁（折线图）
│   │   │   ├── chart2.tsx        # 省份排名 TOP15（柱状图）
│   │   │   ├── chart3.tsx        # 十大类别排名（横向柱状图）
│   │   │   ├── chart4.tsx        # 跨地域非遗 TOP12
│   │   │   ├── chart5.tsx        # 区域 × 类别热力图
│   │   │   ├── chart6.tsx        # 批次新增 vs 扩展（堆叠柱状图）
│   │   │   ├── chart7.tsx        # 微博舆论词云
│   │   │   └── chart8.tsx        # 网络情绪分析（饼图）
│   │   └── ProvinceDetailPanel.tsx  # 省份详情悬浮面板
│   ├── components/               # 通用组件（图表封装、数字动画）
│   ├── hooks/                    # 自定义 Hook
│   ├── stores/                   # zustand 状态管理
│   ├── types/                    # TypeScript 类型定义
│   └── assets/                   # GeoJSON 地图数据、卫星纹理
└── dist/                         # 构建产物（可直接打开）
```

## 数据来源

- 主数据：郭宇等. 中国五批 3610 个国家级非物质文化遗产空间分布数据集. DOI: 10.3974/geodb.2021.12.01.V1
- 微博舆情：1000 条博文 + DeepSeek 情感分析
- UNESCO：42 项人类非物质文化遗产（截至 2021 年）

## 技术栈

- React 19 + TypeScript
- Three.js（React Three Fiber）+ GSAP（3D 地图动效）
- ECharts 5（面板图表）
- Zustand（状态管理）
- Vite（构建工具）
- d3-geo（地图投影）
