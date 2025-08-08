# 使用Node.js 20作为基础镜像
FROM node:20-alpine

# 安装wget用于健康检查和编译工具
RUN apk add --no-cache wget python3 py3-pip make g++ sqlite-dev

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=local
ENV PORT=7001

# 配置npm使用中国镜像源
RUN npm config set registry https://registry.npmmirror.com

# 设置环境变量以使用预编译的sqlite3
ENV SQLITE3_BINARY_HOST_MIRROR=https://npmmirror.com/mirrors/sqlite3/

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p logs

# 确保支付宝密钥文件存在（如果不存在则创建占位符）
RUN if [ ! -f private_key.pem ]; then echo "-----BEGIN RSA PRIVATE KEY-----\n# 请替换为您的支付宝应用私钥\n-----END RSA PRIVATE KEY-----" > private_key.pem; fi
RUN if [ ! -f public_key.pem ]; then echo "-----BEGIN PUBLIC KEY-----\n# 请替换为支付宝公钥\n-----END PUBLIC KEY-----" > public_key.pem; fi

# 暴露端口
EXPOSE 7001

# 启动开发环境
CMD ["npm", "run", "dev"] 