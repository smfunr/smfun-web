# sm.fun 设计 Token 与组件规范（v1）

## 1) Design Tokens

> 源文件：`src/styles/tokens.css`

### 颜色（Color）
- `--color-bg`: 页面主背景
- `--color-surface`: 卡片背景
- `--color-surface-soft`: 次级卡片背景
- `--color-text-primary`: 主文本
- `--color-text-secondary`: 次文本
- `--color-brand`: 品牌主色（按钮/强调）
- `--color-success`: 正向增长值
- `--color-border`: 分割线和边框

### 字体（Typography）
- 字体族：`--font-family-base`
- 字号：`--font-size-xs/sm/md/lg/xl`
- 字重：`--font-weight-regular/medium/bold`

### 间距（Spacing）
- 4~40px：`--space-1` 到 `--space-10`
- 页面布局建议以 8px 为基本节奏递增

### 圆角与阴影
- `--radius-sm/md/lg`
- `--shadow-soft`

---

## 2) 组件规范（可替换）

### A. 导航栏（Topbar + NavLink）
- 位置：全站顶部
- 用途：主路由切换
- 状态：默认 / active

### B. Card 卡片
- 类型：基础卡片 `.card`、内嵌卡片 `.card--inner`
- 用途：数据块、方案块、模板块

### C. Button 按钮
- 类型：主按钮 `.btn--primary`、次按钮 `.btn--ghost`
- 用途：主操作（提交/进入）与次操作（查看详情）

### D. SectionHeader
- 结构：标题 + 描述 + 右侧操作（可选）
- 用途：统一内容分区视觉层级

### E. 表单组件
- 输入：`input/select/textarea`
- 当前行为：演示版阻止默认提交，可对接后端接口

### F. 表格组件
- 用途：首页排行榜展示
- 可替换数据源：`src/data/mockData.js` -> API 返回数据

---

## 3) 替换建议
1. 保持 class 名称不变，替换数据即可快速升级
2. 主题切换可在 `:root` 层做 dark/light token 映射
3. 将 `mockData.js` 抽象为 `services` 后可无缝接后端
