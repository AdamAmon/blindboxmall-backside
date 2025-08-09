# 盲盒抽奖商城系统 - 后端服务

## 项目简介

这是一个基于 **MidwayJS + TypeScript + SQLite** 的盲盒抽奖商城后端系统，实现了类似微信小程序泡泡玛特的盲盒抽奖功能。系统采用分层架构设计，支持多用户注册登录、盲盒管理、抽奖、订单管理、玩家秀等完整功能。

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

- **支付宝支付集成** - 支持沙盒环境和Docker环境模拟支付
- **地址管理** - 收货地址的增删改查
- **优惠券系统** - 优惠券发放、领取、使用和管理
- **购物车功能** - 商品加入购物车、数量修改、清空
- **充值系统** - 用户余额充值和管理
- **评论系统** - 盲盒评论、点赞、回复功能
- **Docker容器化部署** - 一键部署脚本
- **Swagger API文档** - 完整的API接口文档

## 技术栈

### 后端技术
- **框架**: MidwayJS 3.x (Node.js + TypeScript)
- **数据库**: SQLite (轻量级、零配置)
- **ORM**: TypeORM
- **认证**: JWT (@midwayjs/jwt)
- **API文档**: Swagger UI (@midwayjs/swagger)
- **文件上传**: @midwayjs/busboy@3
- **跨域支持**: @midwayjs/cross-domain
- **数据验证**: class-validator + class-transformer
- **支付集成**: alipay-sdk
- **密码加密**: bcryptjs
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

## 项目结构

```
blindboxmall-backside/
├── src/                    # 源代码
│   ├── controller/        # 控制器层
│   │   ├── auth/         # 认证相关
│   │   ├── blindbox/     # 盲盒管理
│   │   ├── community/    # 社区功能
│   │   ├── pay/          # 支付相关
│   │   ├── user/         # 用户管理
│   │   ├── address/      # 地址管理
│   │   ├── coupon/       # 优惠券管理
│   │   ├── home/         # 首页
│   │   └── api/          # API接口
│   ├── service/          # 服务层
│   │   ├── auth/         # 认证服务
│   │   ├── blindbox/     # 盲盒服务
│   │   ├── community/    # 社区服务
│   │   ├── pay/          # 支付服务
│   │   ├── user/         # 用户服务
│   │   ├── address/      # 地址服务
│   │   └── coupon/       # 优惠券服务
│   ├── entity/           # 数据实体
│   │   ├── user/         # 用户实体
│   │   ├── blindbox/     # 盲盒实体
│   │   ├── pay/          # 支付实体
│   │   ├── community/    # 社区实体
│   │   ├── address/      # 地址实体
│   │   └── coupon/       # 优惠券实体
│   ├── dto/              # 数据传输对象
│   ├── middleware/       # 中间件
│   ├── filter/           # 过滤器
│   ├── config/           # 配置文件
│   └── interface.ts      # 接口定义
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
- `GET /api/blindbox` - 获取盲盒列表（支持筛选、排序、分页）
- `GET /api/blindbox/:id` - 获取盲盒详情
- `POST /api/blindbox` - 创建盲盒
- `PUT /api/blindbox/:id` - 更新盲盒
- `DELETE /api/blindbox/:id` - 删除盲盒
- `POST /api/blindbox/draw` - 抽奖
- `GET /api/blindbox/:id/items` - 获取盲盒商品
- `GET /api/blindbox/categories` - 获取分类统计
- `GET /api/blindbox/hot-keywords` - 获取热门关键词

### 盲盒评论
- `POST /api/blindbox/comment` - 创建评论
- `GET /api/blindbox/comment/list` - 获取评论列表
- `POST /api/blindbox/comment/like` - 点赞评论
- `DELETE /api/blindbox/comment/:id` - 删除评论

### 订单相关
- `POST /api/pay/order/create` - 创建订单
- `GET /api/pay/order/list` - 获取订单列表
- `POST /api/pay/order/pay` - 订单支付
- `POST /api/pay/order/open` - 开盒
- `GET /api/pay/order/completed` - 获取已完成订单

### 购物车
- `POST /api/cart/add` - 加入购物车
- `GET /api/cart/list` - 获取购物车列表
- `POST /api/cart/update` - 更新购物车商品
- `POST /api/cart/delete` - 删除购物车商品
- `POST /api/cart/clear` - 清空购物车

### 充值相关
- `POST /api/pay/recharge` - 创建充值订单
- `GET /api/pay/records` - 获取充值记录
- `POST /api/pay/notify` - 支付宝回调

### 社区相关
- `POST /api/community/show/create` - 创建玩家秀
- `GET /api/community/show/list` - 获取玩家秀列表
- `GET /api/community/show/detail` - 获取玩家秀详情
- `POST /api/community/show/comment` - 创建评论
- `GET /api/community/show/comments` - 获取评论列表
- `POST /api/community/show/like` - 点赞玩家秀
- `POST /api/community/show/comment/like` - 点赞评论

### 地址管理
- `POST /api/address/create` - 创建地址
- `POST /api/address/update` - 更新地址
- `POST /api/address/delete` - 删除地址
- `GET /api/address/list` - 获取地址列表
- `GET /api/address/detail` - 获取地址详情
- `POST /api/address/set_default` - 设置默认地址

### 优惠券相关
- `POST /api/coupon` - 创建优惠券
- `GET /api/coupon` - 获取优惠券列表
- `PUT /api/coupon` - 更新优惠券
- `DELETE /api/coupon` - 删除优惠券
- `POST /api/user-coupon/receive` - 领取优惠券
- `GET /api/user-coupon/list` - 获取用户优惠券
- `GET /api/user-coupon/available` - 获取可用优惠券
- `POST /api/user-coupon/use` - 使用优惠券

### 用户相关
- `GET /api/user/get` - 获取用户信息
- `POST /api/user/update` - 更新用户信息
- `GET /api/user/prizes` - 获取用户奖品

### 系统相关
- `GET /api/health` - 健康检查
- `GET /` - 首页重定向

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
项目包含完整的单元测试和集成测试

执行摘要:
```text
Test Suites: 26 passed, 26 total
Tests:       1106 passed, 1106 total
Snapshots:   0 total
Time:        30.562 s
Ran all test suites.
```

覆盖率报告:
```text
-------------------------------------|---------|----------|---------|---------|-------------------------------------------------
File                                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------------------------|---------|----------|---------|---------|-------------------------------------------------
All files                            |   89.82 |    70.45 |   93.39 |   89.14 |                                                 
 src                                 |     100 |      100 |     100 |     100 |                                                 
  configuration.ts                   |     100 |      100 |     100 |     100 |                                                 
 src/controller/address              |    73.8 |    72.72 |     100 |   73.17 |                                                 
  address.controller.ts              |    73.8 |    72.72 |     100 |   73.17 | ...8-59,66,69,82,85,88-89,93-94,100,103,112,120 
 src/controller/api                  |     100 |      100 |     100 |     100 |                                                 
  api.controller.ts                  |     100 |      100 |     100 |     100 |                                                 
 src/controller/auth                 |     100 |      100 |     100 |     100 |                                                 
  auth.controller.ts                 |     100 |      100 |     100 |     100 |                                                 
 src/controller/blindbox             |   81.62 |       50 |     100 |   81.21 |                                                 
  blindbox-comment.controller.ts     |   82.81 |    41.17 |     100 |   82.25 | 27-28,69,87-88,123-124,173,197,221,245          
  blindbox.controller.ts             |   80.99 |    53.84 |     100 |   80.67 | ...7-88,207,210-235,309,368,381,437,461,490-491 
 src/controller/community            |   83.63 |    66.66 |     100 |      82 |                                                 
  player-show.controller.ts          |   83.63 |    66.66 |     100 |      82 | 14,26,37,45,58,67,78-79,98                      
 src/controller/coupon               |     100 |    33.33 |     100 |     100 |                                                 
  coupon.controller.ts               |     100 |    33.33 |     100 |     100 | 17                                               
  user-coupon.controller.ts          |     100 |      100 |     100 |     100 |                                                 
 src/controller/home                 |     100 |      100 |     100 |     100 |                                                 
  home.controller.ts                 |     100 |      100 |     100 |     100 |                                                 
 src/controller/pay                  |    82.4 |    74.07 |   78.94 |   81.51 |                                                 
  cart.controller.ts                 |     100 |      100 |     100 |     100 |                                                 
  order.controller.ts                |   76.36 |       75 |      70 |   75.47 | 86-87,94-98,105-125                              
  recharge.controller.ts             |   79.54 |    73.68 |      75 |   78.57 | 16,35,68-88                                      
 src/controller/user                 |     100 |      100 |     100 |     100 |                                                 
  user.controller.ts                 |     100 |      100 |     100 |     100 |                                                 
 src/dto/address                     |     100 |      100 |     100 |     100 |                                                 
  address.dto.ts                     |     100 |      100 |     100 |     100 |                                                 
 src/dto/blindbox                    |     100 |      100 |     100 |     100 |                                                 
  blindbox-comment.dto.ts            |     100 |      100 |     100 |     100 |                                                 
  blindbox.dto.ts                    |     100 |      100 |     100 |     100 |                                                 
 src/dto/community                   |     100 |      100 |     100 |     100 |                                                 
  player-show.dto.ts                 |     100 |      100 |     100 |     100 |                                                 
 src/dto/coupon                      |     100 |      100 |     100 |     100 |                                                 
  coupon.dto.ts                      |     100 |      100 |     100 |     100 |                                                 
  user-coupon.dto.ts                 |     100 |      100 |     100 |     100 |                                                 
 src/dto/pay                         |     100 |      100 |     100 |     100 |                                                 
  cart.dto.ts                        |     100 |      100 |     100 |     100 |                                                 
  order.dto.ts                       |     100 |      100 |     100 |     100 |                                                 
 src/dto/user                        |     100 |      100 |     100 |     100 |                                                 
  user.dto.ts                        |     100 |      100 |     100 |     100 |                                                 
 src/entity/address                  |     100 |      100 |     100 |     100 |                                                 
  user_address.entity.ts             |     100 |      100 |     100 |     100 |                                                 
 src/entity/blindbox                 |     100 |      100 |     100 |     100 |                                                 
  blindbox-comment-like.entity.ts    |     100 |      100 |     100 |     100 |                                                 
  blindbox-comment.entity.ts         |     100 |      100 |     100 |     100 |                                                 
  blindbox.entity.ts                 |     100 |      100 |     100 |     100 |                                                 
  box-item.entity.ts                 |     100 |      100 |     100 |     100 |                                                 
 src/entity/community                |     100 |      100 |     100 |     100 |                                                 
  player-show-comment-like.entity.ts |     100 |      100 |     100 |     100 |                                                 
  player-show-comment.entity.ts      |     100 |      100 |     100 |     100 |                                                 
  player-show-like.entity.ts         |     100 |      100 |     100 |     100 |                                                 
  player-show.entity.ts              |     100 |      100 |     100 |     100 |                                                 
 src/entity/coupon                   |     100 |      100 |     100 |     100 |                                                 
  coupon.entity.ts                   |     100 |      100 |     100 |     100 |                                                 
  user-coupon.entity.ts              |     100 |      100 |     100 |     100 |                                                 
 src/entity/pay                      |     100 |      100 |     100 |     100 |                                                 
  cart.entity.ts                     |     100 |      100 |     100 |     100 |                                                 
  order-item.entity.ts               |     100 |      100 |     100 |     100 |                                                 
  order.entity.ts                    |     100 |      100 |     100 |     100 |                                                 
  recharge.entity.ts                 |     100 |      100 |     100 |     100 |                                                 
 src/entity/user                     |     100 |      100 |     100 |     100 |                                                 
  user.entity.ts                     |     100 |      100 |     100 |     100 |                                                 
 src/filter                          |   88.88 |    71.42 |     100 |   85.71 |                                                 
  default.filter.ts                  |   88.88 |    71.42 |     100 |   85.71 | 19                                               
 src/middleware                      |   93.61 |    83.33 |     100 |   92.85 |                                                 
  auth.middleware.ts                 |   91.89 |    83.33 |     100 |   91.17 | 77-79                                            
  report.middleware.ts               |     100 |      100 |     100 |     100 |                                                 
 src/service/address                 |   93.47 |       88 |     100 |   92.68 |                                                 
  address.service.ts                 |   93.47 |       88 |     100 |   92.68 | 22,30,45                                        
 src/service/auth                    |    97.5 |    83.33 |     100 |   97.36 |                                                 
  auth.service.ts                    |    97.5 |    83.33 |     100 |   97.36 | 66                                               
 src/service/blindbox                |   92.01 |    69.49 |     100 |   92.03 |                                                 
  blindbox-comment.service.ts        |   94.66 |    81.81 |     100 |   94.44 | 127-128,154,280                                 
  blindbox.service.ts                |   90.57 |    62.16 |     100 |   90.69 | 152-165,228,271,283                              
 src/service/community               |     100 |    88.23 |     100 |     100 |                                                 
  player-show.service.ts             |     100 |    88.23 |     100 |     100 | 101-109                                         
 src/service/coupon                  |   81.92 |       80 |   77.27 |   82.43 |                                                 
  coupon.service.ts                  |   92.59 |      100 |   77.77 |     100 |                                                 
  user-coupon.service.ts             |   76.78 |    66.66 |   76.92 |    74.5 | 17-43                                            
 src/service/pay                     |   80.92 |    70.58 |   82.14 |   79.86 |                                                 
  cart.service.ts                    |     100 |      100 |     100 |     100 |                                                 
  order.service.ts                   |   72.41 |    57.81 |      75 |   70.58 | ...,149-154,177-181,223-227,236-277,305,317-341 
  recharge.service.ts                |   93.54 |    91.42 |   85.71 |   93.33 | 39-40,103-110                                    
 src/service/user                    |   98.43 |      100 |   83.33 |     100 |                                                 
  user.service.ts                    |   98.43 |      100 |   83.33 |     100 |                                                 
-------------------------------------|---------|----------|---------|---------|-------------------------------------------------
```

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

### v1.0.0
- ✅ 完成基础8项功能
- ✅ 实现支付宝支付集成
- ✅ 完成Docker容器化部署
- ✅ 配置GitHub Actions CI/CD
- ✅ 完成完整的测试覆盖
- ✅ 实现玩家秀社区功能
- ✅ 支持多平台部署
- ✅ 实现优惠券系统
- ✅ 实现地址管理功能
- ✅ 实现购物车功能
- ✅ 实现充值系统
- ✅ 实现评论系统

---

**注意**: 本项目为Web开发大作业，实现了完整的盲盒抽奖商城功能，支持开发环境部署。
