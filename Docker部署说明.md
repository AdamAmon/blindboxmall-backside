# 盲盒商城 Docker 部署说明

## 项目概述

本项目是一个基于 MidwayJS 的盲盒抽奖商城，采用前后端一体化架构：
- **后端**: MidwayJS + TypeScript + SQLite
- **前端**: React + Vite + TailwindCSS (构建产物已集成到后端)
- **数据库**: SQLite
- **部署方式**: Docker 容器化部署

## 系统要求

- Docker Desktop 20.10+
- Docker Compose 2.0+
- Windows 10/11 (AMD x86架构)
- 至少 2GB 可用内存
- 至少 1GB 可用磁盘空间

## 快速开始

### 1. 克隆项目

```bash
git clone <项目地址>
cd blindboxmall-backside
```

### 2. 使用部署脚本 (推荐)

#### Windows 系统
```cmd
# 构建镜像
docker-deploy.bat build

# 启动服务
docker-deploy.bat start

# 查看日志
docker-deploy.bat logs

# 停止服务
docker-deploy.bat stop

# 查看帮助
docker-deploy.bat help
```

#### Linux/Mac 系统
```bash
# 给脚本添加执行权限
chmod +x docker-deploy.sh

# 构建镜像
./docker-deploy.sh build

# 启动服务
./docker-deploy.sh start

# 查看日志
./docker-deploy.sh logs

# 停止服务
./docker-deploy.sh stop

# 查看帮助
./docker-deploy.sh help
```

### 3. 手动部署

#### 构建镜像
```bash
docker-compose build --no-cache
```

#### 启动服务
```bash
docker-compose up -d
```

#### 查看服务状态
```bash
docker-compose ps
```

#### 查看日志
```bash
docker-compose logs -f
```

#### 停止服务
```bash
docker-compose down
```

## 访问地址

- **主应用**: http://localhost:7001
- **健康检查**: http://localhost:7001/api/health
- **API文档**: http://localhost:7001/swagger-ui/index.html

## 项目功能

### 基础功能 (已完成)
1. ✅ 多用户注册、登录
2. ✅ 盲盒管理
3. ✅ 盲盒抽取
4. ✅ 盲盒订单管理
5. ✅ 盲盒列表查看
6. ✅ 盲盒详情查看
7. ✅ 玩家秀
8. ✅ 盲盒搜索

### 技术特性
- 🔄 热重载开发环境
- 📊 健康检查机制
- 🔒 JWT身份认证
- 📱 响应式设计
- 🎨 现代化UI界面
- 📝 API文档自动生成

## 目录结构

```
blindboxmall-backside/
├── src/                    # 后端源代码
│   ├── controller/         # 控制器层
│   ├── service/           # 服务层
│   ├── entity/            # 数据实体
│   ├── config/            # 配置文件
│   └── middleware/        # 中间件
├── public/                # 前端构建产物
│   ├── index.html         # 主页面
│   └── assets/            # 静态资源
├── Dockerfile             # Docker镜像配置
├── docker-compose.yml     # Docker Compose配置
├── docker-deploy.sh       # Linux部署脚本
├── docker-deploy.bat      # Windows部署脚本
├── data.sqlite           # SQLite数据库文件
└── package.json          # 项目依赖配置
```

## 环境配置

### 开发环境变量
```bash
NODE_ENV=local
PORT=7001
JWT_SECRET=dev-secret-key
```

### 数据库配置
- **类型**: SQLite
- **文件**: `data.sqlite`
- **位置**: 项目根目录
- **持久化**: 通过Docker卷挂载确保数据持久化

### 网络配置
- **端口**: 7001
- **协议**: HTTP
- **跨域**: 已配置支持前端访问

## 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 检查端口占用
netstat -ano | findstr :7001

# 停止占用端口的进程
taskkill /PID <进程ID> /F
```

#### 2. Docker镜像构建失败
```bash
# 清理Docker缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

#### 3. 数据库连接失败
```bash
# 检查数据库文件权限
ls -la data.sqlite

# 重新创建数据库文件
rm data.sqlite
touch data.sqlite
```

#### 4. 容器启动失败
```bash
# 查看详细错误日志
docker-compose logs

# 检查容器状态
docker-compose ps -a
```

### 日志查看

#### 实时日志
```bash
docker-compose logs -f
```

#### 指定服务日志
```bash
docker-compose logs -f blindboxmall
```

#### 查看错误日志
```bash
docker-compose logs --tail=100 | grep ERROR
```

## 性能优化

### 1. 镜像优化
- 使用 Alpine Linux 基础镜像
- 配置中国镜像源加速下载
- 多阶段构建减少镜像大小

### 2. 容器优化
- 健康检查机制
- 资源限制配置
- 自动重启策略

### 3. 网络优化
- 使用桥接网络
- 端口映射优化
- 跨域配置优化

## 安全考虑

### 1. 环境变量
- 敏感信息通过环境变量配置
- 开发环境使用默认密钥
- 生产环境需要更换密钥

### 2. 网络安全
- 仅暴露必要端口
- 配置跨域白名单
- 使用HTTPS协议（生产环境）

### 3. 数据安全
- 数据库文件权限控制
- 定期备份数据
- 日志文件管理

## 开发模式

### 热重载开发
```bash
# 启动开发模式
docker-compose up -d

# 代码修改后自动重载
# 无需重启容器
```

### 调试模式
```bash
# 查看实时日志
docker-compose logs -f

# 进入容器调试
docker-compose exec blindboxmall sh
```

## 生产部署建议

### 1. 环境变量
```bash
# 生产环境配置
NODE_ENV=production
JWT_SECRET=<强密钥>
ALIPAY_APP_ID=<支付宝应用ID>
```

### 2. 反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:7001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. SSL证书
```bash
# 配置HTTPS
# 使用Let's Encrypt免费证书
```

## 维护命令

### 日常维护
```bash
# 查看容器状态
docker-compose ps

# 重启服务
docker-compose restart

# 更新镜像
docker-compose pull
docker-compose up -d
```

### 数据备份
```bash
# 备份数据库
docker-compose exec blindboxmall cp data.sqlite data.sqlite.backup

# 恢复数据库
docker-compose exec blindboxmall cp data.sqlite.backup data.sqlite
```

## 技术支持

如遇到问题，请按以下步骤排查：

1. 查看部署脚本帮助信息
2. 检查Docker和Docker Compose版本
3. 查看容器日志
4. 检查端口占用情况
5. 验证网络连接

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 完成基础功能开发
- ✅ 实现Docker容器化部署
- ✅ 配置开发环境热重载
- ✅ 添加健康检查机制
- ✅ 优化镜像构建配置 