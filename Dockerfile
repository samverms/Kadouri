FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Build shared package
WORKDIR /app/packages/shared
RUN npm install
RUN npm run build

# Build API
WORKDIR /app/apps/api
RUN npm install
RUN npm link ../../packages/shared
RUN npm run build

# Start
EXPOSE 3001
CMD ["npm", "start"]
