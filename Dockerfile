# 阶段1：打包前端代码（用Node镜像编译）
FROM node:18-alpine as build-stage
WORKDIR /app
# 复制package.json和锁文件（优先装依赖，利用Docker缓存）
COPY package*.json ./
RUN npm install --registry=https://registry.npmmirror.com  # 用国内镜像加速
# 复制所有代码
COPY . .
# 打包（如果你的命令是build:prod，就改成npm run build:prod）
RUN npm run build

# 阶段2：用Nginx运行静态文件
FROM nginx:alpine as production-stage
# 复制打包后的dist目录到Nginx的默认静态文件目录
COPY --from=build-stage /app/dist /usr/share/nginx/html
# （可选）复制自定义Nginx配置（比如改端口、解决跨域）
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 暴露端口（Nginx默认80，也可以改）
EXPOSE 80
# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]