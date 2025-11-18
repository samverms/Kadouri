FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Build shared package
WORKDIR /app/packages/shared
RUN npm install
RUN npm run build

# Build Web
WORKDIR /app/apps/web
RUN npm ci --legacy-peer-deps
RUN npm link ../../packages/shared
RUN npm run build

# Start
EXPOSE 3000
CMD ["npm", "start"]
