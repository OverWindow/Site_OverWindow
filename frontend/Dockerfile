FROM node:22-alpine

WORKDIR /app

# package.json 먼저 복사해서 dependency 캐싱
COPY package*.json ./

RUN npm install

# 나머지 소스 복사
COPY . .

# Vite dev server 포트
EXPOSE 5173

# dev server 실행
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]