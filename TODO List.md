---
# 🃏 Card Collection Manager（Tauri + Rust + SQLite + React）TODO List

## 🎯 项目目标

构建一个本地桌面应用，用于管理：

* 52张扑克牌 + Jokers（可选）
* 牌盒（box）
* 收藏状态（已收集 / 未收集）
* 支持搜索、多选、反选、批量操作
* 支持两种视图模式：

* 按花色分类
* 按收藏状态分类
* 支持动画交互（Framer Motion）
---

# 🧱 Phase 0：项目初始化

## TODO

- [ ] 初始化 Tauri 项目（Rust + Vite + React）
- [ ] 配置 SQLite 本地数据库
- [ ] 集成 rusqlite
- [ ] 配置前端 React + TypeScript
- [ ] 安装 Framer Motion（动画）
- [ ] 安装 Zustand（状态管理）

---

# 🗃️ Phase 1：数据库设计与初始化

## TODO

- [ ] 创建 SQLite 数据库文件 `cards.db`
- [ ] 创建表 `cards`

字段：

- id (INTEGER PK)
- name (TEXT)
- suit (TEXT: spade/heart/club/diamond/box)
- rank (TEXT: A,2-10,J,Q,K,BOX)
- type (TEXT: card/box)
- collected (BOOLEAN / INTEGER 0-1)
- note (TEXT)

---

## 初始化数据（非常重要）

- [ ] 插入 52 张标准扑克牌
- [ ] 插入 Joker（可选）
- [ ] 插入牌盒（type=box）

---

# 🦀 Phase 2：Rust 后端逻辑（Tauri Commands）

## TODO

### 基础 API

- [ ] get_all_cards()
- [ ] toggle_collect(card_id)
- [ ] batch_toggle_collect(ids, value)
- [ ] reset_all_collections()
- [ ] init_cards()

---

### 查询 API

- [ ] search_cards(keyword)
- [ ] get_cards_by_suit()
- [ ] get_cards_by_status(collected/uncollected)

---

### 数据操作

- [ ] SQLite 连接封装模块 (db.rs)
- [ ] 初始化数据库函数
- [ ] 防重复初始化逻辑（避免重复插入54张牌）

---

# 🌐 Phase 3：前端基础结构

## TODO

### 页面结构

- [ ] Home Page（主界面）
- [ ] Toolbar（顶部工具栏）
- [ ] Card Grid（卡牌展示区域）
- [ ] Filter Panel（筛选栏）

---

### 状态管理（Zustand）

- [ ] cards 全局状态
- [ ] selectedCards 多选状态
- [ ] viewMode（suit / status）
- [ ] searchKeyword

---

# 🃏 Phase 4：核心UI功能

## 卡牌展示

- [ ] 卡牌组件 Card.tsx
- [ ] 卡牌点击切换 collected 状态
- [ ] 收藏状态视觉反馈（颜色/边框变化）
- [ ] hover 动画（scale + shadow）

---

## 多选功能

- [ ] 点击进入“多选模式”
- [ ] shift/ctrl 多选支持
- [ ] 框选（可选进阶）
- [ ] selectedCards 状态管理

---

## 批量操作

- [ ] 批量收藏
- [ ] 批量取消收藏
- [ ] 反选功能
- [ ] 清空收藏（必须二次确认 modal）

---

# 🧭 Phase 5：两种展示模式（核心功能）

## TODO

### 模式1：按花色分类

- [ ] ♠ Spades 分组展示
- [ ] ♥ Hearts 分组展示
- [ ] ♣ Clubs 分组展示
- [ ] ♦ Diamonds 分组展示
- [ ] box 单独分组

---

### 模式2：按状态分类

- [ ] 已收藏分组
- [ ] 未收藏分组

---

### 动画切换

- [ ] 切换 viewMode 使用 fade/slide 动画
- [ ] 分组展开/折叠动画

---

# 🔍 Phase 6：搜索功能

## TODO

- [ ] 搜索框组件
- [ ] 支持 name 搜索
- [ ] 支持 suit 搜索
- [ ] 支持 rank 搜索
- [ ] 防抖（300ms debounce）
- [ ] 搜索结果高亮显示

---

# 🎨 Phase 7：动画系统（Framer Motion）

## TODO

### 卡牌动画

- [ ] 卡牌出现动画（fade + scale）
- [ ] 收藏状态切换动画（scale + glow）
- [ ] hover 动画（lift effect）

---

### 批量选择动画

- [ ] selected 状态抖动/边框闪烁
- [ ] 批量操作时卡牌“弹跳反馈”

---

### 页面切换动画

- [ ] viewMode 切换动画（slide/fade）

---

# ⚠️ Phase 8：危险操作保护

## TODO

- [ ] 清空收藏确认弹窗（必须二次确认）
- [ ] 防误触设计（长按或二次点击）
- [ ] undo（可选）

---

# 🧠 Phase 9：性能优化

## TODO

- [ ] 卡牌列表虚拟化（react-window）
- [ ] SQLite 查询优化（索引 suit / collected）
- [ ] 前端 memo 优化卡牌组件
- [ ] 避免全量 rerender

---

# 📦 Phase 10：打包与发布

## TODO

- [ ] Tauri build 配置
- [ ] Windows/macOS 打包测试
- [ ] SQLite 文件随应用打包
- [ ] 图标 + 应用名称设置

---

# 🚀 Bonus（可选扩展）

如果 Claude Code 做得快，可以加：

- [ ] 卡牌翻转动画（flip effect）
- [ ] 收藏完成度统计（进度条）
- [ ] 成就系统（收集100%）
- [ ] 卡牌拖拽整理
- [ ] 导入/导出收藏数据 JSON
