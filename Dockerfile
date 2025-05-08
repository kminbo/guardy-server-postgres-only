# Node.js 20 LTS 버전 기반
FROM node:20

# 앱 디랙토리 생성
WORKDIR /usr/src/app

# 의존성 파일 복사
COPY package*.json ./

# 컨테이너 안에서 의존성 설치 (리눅스용 bcrypt 설치됨)
RUN npm install

# 앱 소스 복사
COPY . .

# Prisma client 생성
RUN npx prisma generate

# Nestjs 앱 빌드
RUN npm run build

# 포트 오픈( cloud run 기본)
EXPOSE 8080

# 서버 실행
CMD ["npm", "run", "start:prod"]