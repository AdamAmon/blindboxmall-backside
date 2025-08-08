# 盲盒抽奖商城系统

## 项目简介

这是一个基于 **MidwayJS + React + SQLite** 的盲盒抽奖商城系统，实现了类似微信小程序泡泡玛特的盲盒抽奖功能。系统采用前后端一体化架构，支持多用户注册登录、盲盒管理、抽奖、订单管理、玩家秀等完整功能。

## 功能特性

### ✅ 基础功能（8项核心功能）

1. **多用户注册、登录** - 支持用户注册、登录、JWT认证
2. **盲盒管理** - 商家可创建、编辑、上下架盲盒
3. **盲盒抽取** - 基于概率算法的抽奖系统
4. **盲盒订单管理** - 完整的订单创建、支付、开盒流程
5. **盲盒列表查看** - 支持分页、筛选、搜索功能
6. **盲盒详情查看** - 详细的盲盒信息和商品展示
7. **玩家秀** - 用户分享抽奖成果的社区功能
8. **盲盒搜索** - 支持关键词、价格、稀有度等多维度搜索

### 🎯 附加功能

- **支付宝支付集成** - 支持沙盒环境
- **地址管理** - 收货地址的增删改查
- **优惠券系统** - 优惠券发放和使用
- **Docker容器化部署** - 一键部署脚本

## 技术栈

### 后端技术
- **框架**: MidwayJS 3.x (Node.js + TypeScript)
- **数据库**: SQLite (轻量级、零配置)
- **ORM**: TypeORM
- **认证**: JWT
- **API文档**: Swagger UI
- **文件上传**: @midwayjs/busboy
- **跨域支持**: @midwayjs/cross-domain
- **代码规范**: ESLint + Prettier
- **测试**: Jest + Supertest

### 前端技术
- **框架**: React 18 + Vite
- **样式**: TailwindCSS
- **路由**: React Router
- **HTTP客户端**: Axios
- **构建工具**: Vite
- **代码规范**: ESLint

### 部署技术
- **容器化**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **平台支持**: Windows, Linux, macOS

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │    │   后端 (Midway)  │    │   数据库 (SQLite) │
│                 │    │                 │    │                 │
│ • 用户界面      │◄──►│ • RESTful API   │◄──►│ • 用户数据      │
│ • 组件化设计    │    │ • 业务逻辑      │    │ • 盲盒数据      │
│ • 响应式布局    │    │ • 数据验证      │    │ • 订单数据      │
│ • 状态管理      │    │ • 认证授权      │    │ • 社区数据      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- Docker Desktop (可选，用于容器化部署)

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/AdamAmon/blindboxmall-backside.git
cd blindboxmall-backside
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问应用**
- 主应用: http://localhost:7001
- API文档: http://localhost:7001/swagger-ui/index.html
- 健康检查: http://localhost:7001/api/health

### Docker部署

#### Windows系统
```cmd
# 构建并启动
docker-deploy.bat build
docker-deploy.bat start

# 查看日志
docker-deploy.bat logs

# 停止服务
docker-deploy.bat stop
```

#### Linux/Mac系统
```bash
# 给脚本添加执行权限
chmod +x docker-deploy.sh

# 构建并启动
./docker-deploy.sh build
./docker-deploy.sh start

# 查看日志
./docker-deploy.sh logs

# 停止服务
./docker-deploy.sh stop
```

## 项目结构

```
blindboxmall-backside/
├── src/                    # 源代码
│   ├── controller/        # 控制器层
│   │   ├── auth/         # 认证相关
│   │   ├── blindbox/     # 盲盒管理
│   │   ├── community/    # 社区功能
│   │   ├── pay/          # 支付相关
│   │   └── user/         # 用户管理
│   ├── service/          # 服务层
│   ├── entity/           # 数据实体
│   ├── dto/              # 数据传输对象
│   ├── middleware/       # 中间件
│   └── filter/           # 过滤器
├── test/                 # 测试文件
├── public/               # 静态文件
├── docs/                 # 文档
├── .github/              # GitHub Actions
├── docker-compose.yml    # Docker编排
├── Dockerfile           # Docker镜像
└── package.json         # 项目配置
```

## API接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 盲盒相关
- `GET /api/blindbox` - 获取盲盒列表
- `GET /api/blindbox/:id` - 获取盲盒详情
- `POST /api/blindbox` - 创建盲盒
- `POST /api/blindbox/draw` - 抽奖
- `GET /api/blindbox/:id/items` - 获取盲盒商品

### 订单相关
- `POST /api/pay/order/create` - 创建订单
- `POST /api/pay/order/open` - 开盒
- `GET /api/pay/order/list` - 获取订单列表

### 社区相关
- `POST /api/community/show/create` - 创建玩家秀
- `GET /api/community/show/list` - 获取玩家秀列表
- `POST /api/community/show/like` - 点赞

## 测试

### 运行测试
```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run cov

# 代码规范检查
npm run lint
```

### 测试覆盖率
项目包含完整的单元测试和集成测试，测试覆盖率超过80%。

## 部署说明

### 生产环境部署
1. 配置环境变量（参考 `环境变量配置说明.md`）
2. 构建项目：`npm run build`
3. 启动服务：`npm start`

### Docker部署
详细说明请参考 `Docker部署说明.md`

## 开发规范

### 代码规范
- 使用ESLint进行代码检查
- 遵循TypeScript严格模式
- 使用Prettier进行代码格式化

### Git提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- 项目地址: https://github.com/AdamAmon/blindboxmall-backside
- 前端地址: https://github.com/AdamAmon/blindboxmall-fronted

## 更新日志

### v1.0.0 (2024-12-19)
- ✅ 完成基础8项功能
- ✅ 实现支付宝支付集成
- ✅ 完成Docker容器化部署
- ✅ 配置GitHub Actions CI/CD
- ✅ 完成完整的测试覆盖
- ✅ 实现玩家秀社区功能
- ✅ 支持多平台部署

---

**注意**: 本项目为Web开发大作业，实现了完整的盲盒抽奖商城功能，支持开发环境部署。
