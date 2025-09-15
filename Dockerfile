# Sử dụng node image
FROM node:22-alpine

# Tạo thư mục app
WORKDIR /app

# Copy package trước để cache layer
COPY package*.json ./

# Cài dependencies
RUN npm install 

# Copy toàn bộ source
COPY . .

# Build NestJS
RUN npm run build

# Expose port
EXPOSE 3000

# Run app
CMD ["node", "dist/main.js"]