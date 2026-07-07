# 🃏 Card Collection Manager — 卡牌收藏管理器

一个基于 **Tauri + React + Rust + SQLite** 构建的本地桌面应用，用于管理扑克牌收藏状态。

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 🃏 **52张扑克牌 + 大小王 + 牌盒** | 完整标准扑克牌收藏管理 |
| ✅ **收藏切换** | 点击卡牌即可标记已收集 / 未收集 |
| 🔍 **搜索** | 支持按名称、花色、点数搜索（支持中文花色名） |
| 📂 **多种视图** | 按花色分类 / 按收藏状态分类 |
| ✅ **批量操作** | 多选、全选、反选、批量标记收集/取消、重置收藏 |
| ⚠️ **危险操作保护** | 清空收藏需二次确认弹窗 |
| 🎞️ **动画交互** | 基于 Framer Motion 的流畅动画 |
| 💾 **本地数据持久化** | SQLite 本地存储，无需网络 |

## 🖼️ 截图

<!-- TODO: 添加截图 -->

## 🚀 开始使用

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/) 工具链
- [Tauri CLI](https://v2.tauri.app/)

### 安装 & 运行

```bash
# 安装前端依赖
npm install

# 开发模式（自动启动 Vite + Tauri）
npm run tauri dev

# 构建生产版本
npm run tauri build
```

### 脚本说明

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | TypeScript 编译 + Vite 构建 |
| `npm run preview` | 预览构建产物 |
| `npm run tauri` | 运行 Tauri CLI |

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| **桌面框架** | [Tauri v2](https://v2.tauri.app/) |
| **后端语言** | Rust + rusqlite |
| **数据库** | SQLite（存储在系统临时目录） |
| **前端框架** | React 19 + TypeScript |
| **构建工具** | Vite 6 |
| **状态管理** | Zustand 5 |
| **动画** | Framer Motion 11 |
| **打包** | NSIS（Windows 安装包） |

## 📁 项目结构

```
card-collection-manager/
├── src/                      # React 前端
│   ├── components/           # 组件
│   │   ├── Card/             # 卡牌组件
│   │   ├── CardGrid/         # 卡牌网格布局
│   │   ├── ConfirmModal/     # 确认弹窗
│   │   ├── SearchBar/        # 搜索栏
│   │   ├── Toolbar/          # 工具栏
│   │   └── ViewSwitcher/     # 视图切换器
│   ├── pages/                # 页面
│   │   └── HomePage.tsx      # 主页面
│   ├── services/             # API 调用
│   │   └── api.ts            # Tauri invoke 封装
│   ├── store/                # 状态管理
│   │   └── cardStore.ts      # Zustand store
│   ├── types/                # 类型定义
│   │   └── card.ts
│   ├── main.tsx              # 入口
│   └── App.tsx
├── src-tauri/                # Rust 后端
│   ├── src/
│   │   ├── lib.rs            # Tauri commands & 数据库逻辑
│   │   └── main.rs           # 程序入口
│   ├── cards.db              # SQLite 数据库（自动生成）
│   └── tauri.conf.json       # Tauri 配置
├── dist/                     # 构建输出
├── package.json
└── vite.config.ts
```

## 🗃️ 数据库

应用使用 SQLite 本地数据库，存储在系统临时目录：

```
Windows: %TEMP%/card-collection-manager/cards.db
macOS:   /tmp/card-collection-manager/cards.db
Linux:   /tmp/card-collection-manager/cards.db
```

### 表结构

```sql
CREATE TABLE cards (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    suit      TEXT NOT NULL CHECK(suit IN ('spade','heart','club','diamond','box')),
    rank      TEXT NOT NULL,
    type      TEXT NOT NULL DEFAULT 'card' CHECK(type IN ('card','box')),
    collected INTEGER NOT NULL DEFAULT 0,
    note      TEXT DEFAULT ''
);
```

初始数据包含：
- ♠ 黑桃 A~K（13张）
- ♥ 红桃 A~K（13张）
- ♣ 梅花 A~K（13张）
- ♦ 方片 A~K（13张）
- 🃏 大王、小王
- 📦 牌盒

## 🔧 API 命令

后端通过 Tauri 命令暴露以下接口：

| 命令 | 参数 | 说明 |
|------|------|------|
| `get_cards` | 无 | 获取所有卡牌 |
| `search_cards` | `keyword` | 搜索卡牌 |
| `toggle_collect` | `cardId` | 切换收藏状态 |
| `batch_update` | `ids`, `collected` | 批量更新收藏状态 |
| `reset_collection` | 无 | 重置所有收藏状态 |

## 🧪 开发

```bash
# 安装依赖
npm install

# 启动开发环境
npm run tauri dev

# TypeScript 类型检查
npx tsc --noEmit
```

## 📦 打包

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`，默认生成 NSIS 安装包。

## 📄 许可

[MIT](LICENSE)
