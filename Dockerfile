FROM node:20-alpine AS builder

RUN apk add --no-cache dumb-init

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build

FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "run", "start:prod"]