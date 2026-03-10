# 管理系统前端项目文档

## 项目概述

这是一个基于 Vue 3 的管理系统前端项目，采用前后端分离设计，与后端 Spring Boot 项目配合使用。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5.13 | 前端框架，使用 Composition API |
| Vue Router | 4.6.4 | 路由管理 |
| Vite | 4.5.0 | 构建工具 |
| Element Plus | 2.13.0 | UI 组件库 |
| Axios | 1.13.2 | HTTP 请求库 |
| @element-plus/icons-vue | 2.3.2 | Element Plus 图标库 |
| Crypto-js | 4.2.0 | 加密库 |

## 项目结构

```
management-system-web/
├── src/
│   ├── api/                    # API 接口封装
│   │   ├── login.js           # 登录相关接口
│   │   ├── register.js        # 注册相关接口
│   │   └── poker.js           # 德州扑克游戏接口
│   ├── components/            # 页面组件
│   │   ├── Login.vue          # 登录页
│   │   ├── Register.vue       # 注册页
│   │   ├── Home.vue           # 主页
│   │   └── poker/             # 德州扑克游戏组件
│   │       ├── TexasPoker.vue       # 主游戏组件
│   │       ├── PokerCard.vue        # 扑克牌组件
│   │       ├── PlayerSeat.vue       # 玩家座位组件
│   │       └── ActionPanel.vue      # 操作面板组件
│   ├── router/                # 路由配置
│   │   └── index.js          # 路由定义
│   ├── utils/                 # 工具函数
│   │   ├── crypto.js         # 加密工具
│   │   └── request.js        # HTTP 请求封装
│   ├── App.vue               # 根组件
│   ├── main.js               # 入口文件
│   └── style.css             # 全局样式
├── index.html
├── package.json
└── vite.config.js            # Vite 配置
```

## 路由配置

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | - | 重定向到 `/login` |
| `/login` | Login.vue | 登录页面 |
| `/register` | Register.vue | 注册页面 |
| `/home` | Home.vue | 系统首页 |
| `/poker` | TexasPoker.vue | 德州扑克游戏 |

## API 接口封装

### 请求拦截器
- 自动添加 JWT Token 到请求头
- 设置请求 Content-Type 为 `application/json`

### 响应拦截器
- 统一处理响应数据格式
- 自动显示错误消息
- Token 失效自动跳转登录

### 使用示例
```javascript
import { login } from '@/api/login';

const handleLogin = async () => {
  try {
    const response = await login(loginForm);
    // 处理响应
  } catch (error) {
    // 错误已在拦截器中处理
  }
};
```

## 德州扑克游戏模块

### 游戏入口
- 首页快捷入口卡片，点击进入游戏

### 游戏流程
1. **创建游戏**：选择AI玩家数量（1-5）、初始筹码、盲注金额
2. **开始游戏**：系统发牌，自动下盲注
3. **玩家操作**：
   - 弃牌：放弃当前手牌
   - 过牌：不加注，将行动权交给下一位
   - 跟注：跟随当前的最大下注额
   - 加注：增加下注额
   - 全押：押上所有筹码
4. **AI自动操作**：AI玩家自动决策
5. **游戏阶段**：翻牌前 → 翻牌 → 转牌 → 河牌 → 摊牌
6. **结算**：比较牌型大小，分配底池筹码

### 牌型大小（从大到小）
1. 皇家同花顺
2. 同花顺
3. 四条
4. 葫芦
5. 同花
6. 顺子
7. 三条
8. 两对
9. 一对
10. 高牌

### 组件说明

#### TexasPoker.vue
主游戏组件，管理游戏状态和流程控制。

#### PokerCard.vue
扑克牌显示组件，支持牌面和牌背两种状态。

#### PlayerSeat.vue
玩家座位组件，显示玩家信息、筹码、手牌等。

#### ActionPanel.vue
操作面板组件，提供弃牌、过牌、跟注、加注、全押等操作按钮。

## 开发指南

### 环境要求
- Node.js 16+
- npm 或 pnpm

### 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问地址
http://localhost:5173
```

### 构建生产版本

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

### 代理配置
开发环境下，Vite 会将 `/api` 开头的请求代理到后端服务器。

## 代码规范

### 组件命名
- 使用 PascalCase 命名组件文件
- 组件内部使用 camelCase 命名变量和方法

### API 定义
- API 接口统一放在 `src/api/` 目录下
- 每个模块一个文件
- 使用 `request` 工具封装 HTTP 请求

### 样式规范
- 使用 scoped 样式避免污染
- 全局样式定义在 `src/style.css`
- 使用 CSS 变量定义主题色

### 数字格式化
所有金额显示使用 `formatNumber` 函数处理：
```javascript
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  const n = Number(num);
  if (isNaN(n)) return '0';
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
};
```

## 常见问题

### Q1: 如何添加新的页面？
A: 在 `src/components/` 下创建组件文件，然后在 `src/router/index.js` 中添加路由配置。

### Q2: 如何调用后端 API？
A: 在 `src/api/` 下创建对应的 API 文件，使用 `request` 工具发起请求。

### Q3: 如何处理登录状态？
A: 登录成功后将 Token 存储到 localStorage，请求拦截器会自动添加 Token 到请求头。

### Q4: 如何添加新的游戏功能？
A: 参考德州扑克模块的实现方式，在 `src/components/poker/` 下创建相应组件。
