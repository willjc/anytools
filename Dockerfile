FROM node:24-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_PRIVATE_QUERY_URL=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_PRIVATE_QUERY_URL=$NEXT_PUBLIC_PRIVATE_QUERY_URL
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# The production host sits behind a slow route to deb.debian.org; build from
# an in-country mirror and keep the heavyweight installs in separate layers
# so a completed layer stays cached across releases.
RUN set -eux; \
  find /etc/apt -type f \( -name "*.sources" -o -name "sources.list" \) -exec sed -i 's|deb.debian.org|mirrors.aliyun.com|g' {} + \
  && apt-get update \
  && apt-get install -y --no-install-recommends qpdf ffmpeg libheif-examples \
  && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
  find /etc/apt -type f \( -name "*.sources" -o -name "sources.list" \) -exec sed -i 's|deb.debian.org|mirrors.aliyun.com|g' {} + \
  && apt-get update \
  && apt-get install -y --no-install-recommends libreoffice-writer libreoffice-draw fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
  find /etc/apt -type f \( -name "*.sources" -o -name "sources.list" \) -exec sed -i 's|deb.debian.org|mirrors.aliyun.com|g' {} + \
  && apt-get update \
  && apt-get install -y --no-install-recommends unzip \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs scripts/transfer-maintenance.mjs ./scripts/transfer-maintenance.mjs
RUN mkdir -p /data/transfer && chown nextjs:nodejs /data/transfer && chmod 700 /data/transfer

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
