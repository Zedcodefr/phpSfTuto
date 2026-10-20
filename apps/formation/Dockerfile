# Support de formation TaskBoard — image de production
# Construire depuis la RACINE du dépôt (les cours et les ressources téléchargeables en font partie) :
#   docker build -f apps/formation/Dockerfile -t taskboard-formation .

# ---------------------------------------------------------------- Build
FROM node:24-alpine AS build
WORKDIR /repo/apps/formation
COPY apps/formation/package.json apps/formation/package-lock.json ./
RUN npm ci --no-audit --no-fund
WORKDIR /repo
COPY . .
WORKDIR /repo/apps/formation
# validation des quiz + zips (projet, cours, solutions) + tsc + vite build
RUN npm run build

# ---------------------------------------------------------------- Runtime
FROM node:24-alpine
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/formation/dist ./dist
COPY --from=build --chown=node:node /repo/apps/formation/protected ./protected
COPY --from=build --chown=node:node /repo/apps/formation/server ./server
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "server/server.mjs"]
