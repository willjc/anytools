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

# calibre 提供电子书格式转换所需的 ebook-convert（EPUB / MOBI / AZW3 等）。
#
# Debian 的 calibre 经 libqt6webenginecore6 依赖 sse3-support，而该包的 preinst
# 只认 GenuineIntel / AuthenticAMD，在本机 Hygon（海光）CPU 上误判「不支持 SSE3」
# 并 abort，导致整层构建失败。CPU 实测支持 x86-64-v2 要求的全部指令集，属上游
# 检测缺陷。这里预置一个同版本号的空包满足依赖，让 apt 跳过那个探测脚本。
RUN set -eux; \
  find /etc/apt -type f \( -name "*.sources" -o -name "sources.list" \) -exec sed -i 's|deb.debian.org|mirrors.aliyun.com|g' {} + \
  && apt-get update \
  && mkdir -p /tmp/sse3-stub/DEBIAN \
  && printf 'Package: sse3-support\nVersion: 15.1\nArchitecture: amd64\nMaintainer: local <local@localhost>\nSection: misc\nPriority: optional\nDescription: Stub; the stock SSE3 probe misreports Hygon CPUs as unsupported.\n' > /tmp/sse3-stub/DEBIAN/control \
  && dpkg-deb --build /tmp/sse3-stub /tmp/sse3-support_15.1_amd64.deb \
  && dpkg -i /tmp/sse3-support_15.1_amd64.deb \
  && apt-get install -y --no-install-recommends calibre \
  && rm -rf /tmp/sse3-stub /tmp/sse3-support_15.1_amd64.deb /var/lib/apt/lists/*

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs scripts/transfer-maintenance.mjs ./scripts/transfer-maintenance.mjs
RUN mkdir -p /data/transfer && chown nextjs:nodejs /data/transfer && chmod 700 /data/transfer

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
