# Cushion 2025 최신 스택 배포 가이드 🛏️

## 🎯 프로젝트 개요

- **라이브러리**: Cushion - "Absorb the chaos, keep the peace"
- **목적**: 외부 변화를 흡수하여 코드의 편안함과 안정성 제공
- **타겟**: NPM 배포 + 문서 사이트 + 플레이그라운드 + 예제 갤러리
- **목표**: 개발자들에게 최고의 편안함(DX) 제공

---

## 📦 기술 스택 선택 (2025 최신)

### **개발 환경 - "편안한 개발을 위한 최고의 도구들"**

- **패키지 매니저**: `pnpm` (2025 표준, 빠르고 효율적)
- **모노레포**: `Turborepo` (Vercel 제작, 최고 성능)
- **TypeScript**: `v5.7+` (최신 기능으로 타입 안전성 극대화)
- **번들러**: `Tsup` (esbuild 기반, 초고속 번들링)

### **테스트 & 품질 - "완벽한 쿠션을 위한 품질 보장"**

- **테스트**: `Vitest` (Jest 대체, Vite 기반 초고속)
- **E2E**: `Playwright` (2025 표준, 실제 브라우저 테스트)
- **린터**: `Biome` (ESLint + Prettier 대체, Rust 기반 초고속)
- **타입체크**: `TypeScript` + `publint` (패키지 검증)

### **배포 & CI/CD - "자동화된 편안함"**

- **CI/CD**: `GitHub Actions` + `Changesets` (자동 버전 관리)
- **NPM 배포**: 완전 자동화된 릴리즈
- **문서**: `VitePress` (Vue 기반, 가장 빠름)
- **데모**: `StackBlitz` + `CodeSandbox` 연동

### **호스팅 - "전세계 편안함 제공"**

- **NPM**: 공식 레지스트리
- **문서 사이트**: `Vercel` (무료, 자동 배포)
- **플레이그라운드**: `Netlify` (빠른 static 호스팅)

---

## 🏗️ Cushion 프로젝트 구조

```
cushion/
├── apps/
│   ├── docs/                 # VitePress 문서 사이트
│   ├── playground/           # 인터랙티브 쿠션 체험
│   └── examples/             # 편안함 사용 예제들
├── packages/
│   ├── core/                 # 핵심 쿠션 라이브러리
│   ├── react/                # React 편안함 플러그인
│   ├── vue/                  # Vue 편안함 플러그인
│   └── zod/                  # Zod 검증 쿠션
├── tools/
│   ├── biome-config/         # 공유 린트 설정
│   └── tsconfig/             # 공유 TS 설정
├── .github/
│   └── workflows/            # 자동 편안함 배포
├── turbo.json               # Turborepo 설정
├── pnpm-workspace.yaml      # pnpm 워크스페이스
└── package.json
```

---

## 🚀 단계별 Cushion 셋업 가이드

### **Step 1: 편안한 개발 환경 구성**

```bash
# 1. Cushion 프로젝트 생성
mkdir cushion
cd cushion

# 2. 편안함을 위한 pnpm 초기화
pnpm init

# 3. 최신 Turborepo로 편안한 모노레포 구성
npx create-turbo@latest --package-manager pnpm .

# 4. Cushion 구조 생성
mkdir -p packages/{core,react,vue,zod}
mkdir -p apps/{docs,playground,examples}
mkdir -p tools/{biome-config,tsconfig}

# 5. 필수 루트 의존성 설치
pnpm add -D @biomejs/biome @changesets/cli turbo typescript

# 6. 워크스페이스 공통 도구 설치
pnpm add -D vitest @vitest/coverage-v8 publint
```

### **Step 2: Turborepo 편안함 설정**

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"
  - "tools/*"
```

### **Step 3: 핵심 Cushion 라이브러리 설정**

```bash
# packages/core로 이동
cd packages/core

# 핵심 개발 의존성 설치
pnpm init
pnpm add -D tsup typescript @types/node vitest @vitest/coverage-v8
pnpm add -D publint @biomejs/biome

# 루트로 돌아가기
cd ../..
```

```json
// packages/core/package.json
{
  "name": "cushion",
  "version": "0.0.1-alpha.0",
  "description": "Absorb the chaos, keep the peace - External change cushioning middleware",
  "keywords": [
    "cushion",
    "api",
    "transform",
    "absorb",
    "middleware",
    "comfort"
  ],
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./core": {
      "import": "./dist/core.js",
      "types": "./dist/core.d.ts"
    },
    "./absorb": {
      "import": "./dist/absorb.js",
      "types": "./dist/absorb.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "test:comfort": "vitest --reporter=verbose",
    "type-check": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "publint": "publint"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@types/node": "^22.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "publint": "^0.2.0",
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

```typescript
// packages/core/tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/core.ts", "src/absorb.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  minify: true,
  treeshake: true,
  splitting: false,
  sourcemap: true,
  target: "es2022",
  external: [],
  banner: {
    js: "// Cushion 🛏️ - Absorb the chaos, keep the peace",
  },
});
```

### **Step 4: 편안한 품질 도구 설정**

```json
// biome.json (프로젝트 루트)
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": "error"
      },
      "style": {
        "useNodejsImportProtocol": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5"
    }
  },
  "typescript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5"
    }
  }
}
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### **Step 5: 편안한 문서 사이트 (VitePress)**

```bash
# apps/docs 설정
cd apps/docs
pnpm init

# VitePress 및 의존성 설치
pnpm add -D vitepress vue
pnpm add -D @types/node

# 기본 구조 생성
mkdir -p .vitepress docs guide api examples playground

# 루트로 돌아가기
cd ../..
```

```typescript
// apps/docs/.vitepress/config.ts
import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Cushion",
  description: "Absorb the chaos, keep the peace",
  base: "/cushion/",

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "API", link: "/api/" },
      { text: "Examples", link: "/examples/" },
      { text: "Playground", link: "/playground/" },
    ],

    sidebar: {
      "/guide/": [
        { text: "Getting Comfortable", link: "/guide/" },
        { text: "Basic Cushioning", link: "/guide/basic-usage" },
        { text: "Advanced Comfort", link: "/guide/advanced" },
        { text: "Comfort Plugins", link: "/guide/plugins" },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/username/cushion" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025 Cushion 🛏️",
    },
  },

  vite: {
    optimizeDeps: {
      include: ["cushion"],
    },
  },
});
```

### **Step 6: 자동 편안함 배포 (GitHub Actions)**

```yaml
# .github/workflows/comfort-ci.yml
name: Comfort CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-comfort:
    runs-on: ubuntu-latest
    steps:
      - name: 🛏️ Checkout Cushion
        uses: actions/checkout@v4

      - name: 📦 Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: 🏃 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: 💤 Install dependencies
        run: pnpm install --frozen-lockfile

      - name: 🏗️ Build Cushion
        run: pnpm run build

      - name: 🧪 Test Comfort
        run: pnpm run test

      - name: ✨ Lint Comfort
        run: pnpm run lint

      - name: 🔍 Check Types
        run: pnpm run type-check

  deploy-comfort:
    needs: test-comfort
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: 🛏️ Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 📦 Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: 🏃 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
          registry-url: "https://registry.npmjs.org"

      - name: 💤 Install dependencies
        run: pnpm install --frozen-lockfile

      - name: 🏗️ Build for comfort
        run: pnpm run build

      - name: 🚀 Release Comfort
        uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

```yaml
# .github/workflows/comfort-docs.yml
name: Deploy Comfort Docs

on:
  push:
    branches: [main]
    paths: ["apps/docs/**"]

jobs:
  deploy-docs:
    runs-on: ubuntu-latest
    steps:
      - name: 🛏️ Checkout Comfort Docs
        uses: actions/checkout@v4

      - name: 📦 Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: 🏃 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: 💤 Install dependencies
        run: pnpm install --frozen-lockfile

      - name: 🏗️ Build Cushion
        run: pnpm run build

      - name: 📚 Build comfort docs
        run: cd apps/docs && pnpm run build

      - name: 🌍 Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/docs
```

### **Step 7: 편안한 버전 관리 (Changesets)**

```bash
# Changesets로 편안한 버전 관리
pnpm add -D @changesets/cli
pnpm changeset init
```

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/changelog-github",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### **Step 8: 편안함 체험 플레이그라운드**

```bash
# apps/playground 설정
cd apps/playground
pnpm init

# React 플레이그라운드 의존성 설치
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom
pnpm add -D vite @vitejs/plugin-react typescript
pnpm add -D tailwindcss postcss autoprefixer

# 로컬 패키지 참조 (워크스페이스 문법 사용)
pnpm add cushion@workspace:*

# Tailwind 초기화
npx tailwindcss init -p

# 루트로 돌아가기
cd ../..
```

**만약 워크스페이스 참조가 안 되면:**

```bash
# 대안 1: 상대 경로로 참조
pnpm add ../packages/core

# 대안 2: 일단 스킵하고 나중에 추가
# (core 패키지 빌드 후 다시 시도)
```

```typescript
// apps/playground/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
});
```

```json
// apps/playground/package.json
{
  "name": "@cushion/playground",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "cushion": "workspace:*",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

**올바른 워크스페이스 설정 순서:**

```bash
# 1. 루트에서 pnpm-workspace.yaml 확인
cat pnpm-workspace.yaml

# 2. 먼저 core 패키지 빌드
cd packages/core
pnpm build

# 3. 루트로 돌아가서 전체 의존성 해결
cd ../..
pnpm install

# 4. 이제 playground에서 cushion 사용 가능
cd apps/playground
# cushion@workspace:* 이미 package.json에 있으면 자동 링크됨
```

```typescript
// apps/playground/src/App.tsx
import { useState } from "react";
import { setupCushion, absorb } from "cushion";

export default function CushionPlayground() {
  const [serverData, setServerData] = useState(`{
  "username": "john_doe",
  "user_email": "john@example.com", 
  "user_age": 25
}`);

  const [cushioning, setCushioning] = useState(`{
  "name": "username",
  "email": "user_email",
  "age": "user_age"
}`);

  const [result, setResult] = useState("");

  const handleAbsorb = () => {
    try {
      const data = JSON.parse(serverData);
      const cushionConfig = JSON.parse(cushioning);
      const comfortable = absorb(data, cushionConfig);
      setResult(JSON.stringify(comfortable, null, 2));
    } catch (error) {
      setResult(`Comfort Error: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Cushion Playground 🛏️</h1>
        <p className="text-xl text-gray-600">
          Experience the comfort of absorbing external chaos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            🌪️ Chaotic External Data (JSON)
          </label>
          <textarea
            value={serverData}
            onChange={(e) => setServerData(e.target.value)}
            className="w-full h-40 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Enter chaotic server data..."
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            🛏️ Cushion Configuration
          </label>
          <textarea
            value={cushioning}
            onChange={(e) => setCushioning(e.target.value)}
            className="w-full h-40 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
            placeholder="Configure your comfort zone..."
          />
        </div>
      </div>

      <div className="text-center mb-6">
        <button
          onClick={handleAbsorb}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          🛏️ Absorb the Chaos
        </button>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          ✨ Comfortable Result
        </label>
        <pre className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-lg overflow-auto font-mono text-sm min-h-32">
          {result || "// Your comfortable data will appear here..."}
        </pre>
      </div>

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          💡 Comfort Tips
        </h3>
        <ul className="text-blue-800 space-y-1">
          <li>• Try changing field names in the chaotic data</li>
          <li>• Update your cushion config to absorb the changes</li>
          <li>• See how your comfortable interface stays stable!</li>
        </ul>
      </div>
    </div>
  );
}
```

## 📋 완전한 패키지 설치 체크리스트

### **루트 프로젝트 의존성**

```bash
# 필수 루트 의존성
pnpm add -D @biomejs/biome @changesets/cli turbo typescript
pnpm add -D vitest @vitest/coverage-v8 publint
```

### **packages/core 의존성**

```bash
cd packages/core
pnpm add -D tsup typescript @types/node vitest @vitest/coverage-v8
pnpm add -D publint @biomejs/biome
```

### **apps/docs 의존성**

```bash
cd apps/docs
pnpm add -D vitepress vue @types/node
```

### **apps/playground 의존성**

```bash
cd apps/playground
pnpm add react react-dom cushion
pnpm add -D @types/react @types/react-dom vite @vitejs/plugin-react
pnpm add -D typescript tailwindcss postcss autoprefixer
```

### **선택적 플러그인 패키지들**

```bash
# packages/react (React 훅)
cd packages/react
pnpm add react cushion
pnpm add -D @types/react typescript tsup

# packages/vue (Vue 컴포저블)
cd packages/vue
pnpm add vue cushion
pnpm add -D typescript tsup

# packages/zod (Zod 통합)
cd packages/zod
pnpm add zod cushion
pnpm add -D typescript tsup
```

### **개발 환경 - 편안한 개발**

```bash
# 전체 편안함 개발 서버
pnpm dev

# 특정 패키지만 편안하게 개발
pnpm --filter core dev
pnpm --filter docs dev
pnpm --filter playground dev

# 편안함 테스트
pnpm test
pnpm test:comfort  # 상세한 편안함 테스트

# 편안함 품질 체크
pnpm lint
pnpm type-check
```

### **빌드 & 배포 - 세상에 편안함 전파**

```bash
# 편안함 빌드
pnpm build

# 편안함 버전업 준비
pnpm changeset

# 편안함 버전 적용
pnpm changeset version

# 세상에 편안함 배포 (CI에서 자동)
pnpm changeset publish

# 편안함 문서 배포 (Vercel 자동)
git push origin main
```

---

## 📊 편안함 성능 & 품질 관리

### **편안함 번들 크기 모니터링**

```json
// package.json scripts 추가
{
  "scripts": {
    "size": "bundlesize",
    "analyze": "npx bundle-analyzer dist/index.js",
    "comfort-check": "npm run size && npm run analyze"
  }
}
```

### **편안함 품질 게이트**

- **테스트 커버리지**: 80% 이상 (편안함 보장)
- **번들 크기**: 15KB 이하 (가벼운 편안함)
- **타입 커버리지**: 100% (완벽한 편안함)
- **린트 에러**: 0개 (깔끔한 편안함)

### **편안함 모니터링 대시보드**

- **NPM 다운로드**: npmtrends.com/cushion
- **번들 크기**: bundlephobia.com/package/cushion
- **GitHub 통계**: ⭐ 스타, 🍴 포크, 🐛 이슈
- **성능**: Lighthouse CI

---

## 🎯 편안함 배포 체크리스트

### **편안함 배포 전 확인사항**

- [ ] 🧪 모든 편안함 테스트 통과
- [ ] 🔍 타입 에러 없음 (완벽한 편안함)
- [ ] ✨ 린팅 에러 없음 (깔끔한 편안함)
- [ ] 📦 번들 크기 15KB 이하 (가벼운 편안함)
- [ ] 📚 편안함 문서 업데이트 완료
- [ ] 📝 CHANGELOG 작성 (편안함 히스토리)
- [ ] 🏷️ 버전 번호 확인

### **편안함 배포 후 확인사항**

- [ ] 📦 NPM 패키지 정상 설치
- [ ] 📚 편안함 문서 사이트 정상 동작
- [ ] 🎮 편안함 플레이그라운드 정상 동작
- [ ] 🔷 TypeScript 타입 정상 동작
- [ ] 💡 예제 코드 정상 동작
- [ ] 🌍 전세계 편안함 전파 확인

---

## 🔧 편안함 트러블슈팅

### **자주 발생하는 편안함 문제들**

**1. pnpm 편안함 설치 문제**

```bash
# Node.js 편안함 버전 확인
node -v  # 20+ 필요 (편안한 버전)

# pnpm 편안함 재설치
npm install -g pnpm@latest
```

**2. Turborepo 편안함 캐시 문제**

```bash
# 편안함 캐시 클리어
pnpm turbo clean
rm -rf node_modules/.cache
```

**3. TypeScript 편안함 빌드 에러**

```bash
# 편안함 의존성 다시 설치
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**4. Vercel 편안함 배포 실패**

- 환경 변수 편안함 확인
- 빌드 명령어 편안함 확인
- Node.js 버전 편안함 매칭

---

## 🎉 완성된 편안함 배포 환경

이 가이드를 따라하면 다음이 자동으로 구성됩니다:

1. **📦 NPM 편안함 패키지**: 자동 버전 관리 + 배포
2. **📚 편안함 문서 사이트**: VitePress + Vercel 자동 배포
3. **🎮 편안함 플레이그라운드**: 인터랙티브 체험
4. **🧪 편안함 품질 관리**: 자동 테스트 + 린팅
5. **📊 편안함 모니터링**: 성능 + 사용량 추적

이제 편안한 코딩에만 집중하면 됩니다! 🛏️✨

---

<div align="center">
  <h3>🛏️ 세상에 편안함을 전파하세요</h3>
  <p><em>Absorb the chaos, keep the peace</em></p>
  
  **[편안함 시작하기 →](https://cushion.dev/guide)**
</div>
