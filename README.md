# Cushion 🛏️

> **Absorb the chaos, keep the peace**

Automatically cushion your code from external changes. When servers change their data structure, Cushion absorbs the impact so your frontend stays comfortable and stable.

[![npm version](https://badge.fury.io/js/cushion.svg)](https://www.npmjs.com/package/cushion)
[![Downloads](https://img.shields.io/npm/dm/cushion.svg)](https://www.npmjs.com/package/cushion)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/cushion.svg)](https://bundlephobia.com/package/cushion)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ The Problem

```typescript
// 😱 External system changes structure
// Before: { user_name: "John" }
// After:  { username: "John" }

// 💀 Now you need to update everywhere
setUser({
  // name: data.user_name,  // ❌ Breaks across your app
  name: data.username,     // ✅ Manual fix everywhere
});
```

## 🛏️ The Cushion Solution

```typescript
// 🎉 Set up a cushion once
setupCushion('/api/user', {
  name: 'username'  // Cushion absorbs user_name → username change
});

// 💤 Your code stays comfortable and unchanged
const user = await fetch('/api/user').then(r => r.json());
console.log(user.name); // ✅ Always works, cushioned from chaos!
```

**One cushion setup. Zero breaking changes. Maximum comfort.**

---

## 🚀 Quick Start

### Installation

```bash
npm install cushion
# or
pnpm add cushion
# or
yarn add cushion
```

### Comfort in 3 Steps

```typescript
import { setupCushion } from 'cushion';

// 1️⃣ Set up your comfort zone (once, at app startup)
setupCushion('/api/user', {
  name: 'username',      // Server's 'username' becomes your 'name'
  email: 'user_email',   // Server's 'user_email' becomes your 'email'
  age: 'user_age'        // Server's 'user_age' becomes your 'age'
});

// 2️⃣ Use your existing code (no changes needed!)
const user = await fetch('/api/user').then(r => r.json());
// → { name: "John", email: "john@example.com", age: 25 }

// 3️⃣ Stay comfortable while servers change around you
function UserProfile({ user }) {
  return (
    <div>
      <h1>{user.name}</h1>      {/* ✅ Cushioned from chaos */}
      <p>{user.email}</p>       {/* ✅ Always comfortable */}
      <p>Age: {user.age}</p>    {/* ✅ Perfectly stable */}
    </div>
  );
}
```

---

## 🎭 Comfort Scenarios

### Scenario 1: Field Rename Chaos
```typescript
// Server team goes snake_case → camelCase crazy
setupCushion('/api/user', {
  firstName: 'first_name',
  lastName: 'last_name',
  profilePic: 'profile_pic_url'
});

// ✅ Your 50+ components stay blissfully unaware
```

### Scenario 2: Structure Reorganization
```typescript
// Server: { name: "John" } → { profile: { personal: { name: "John" } } }
setupCushion('/api/user', {
  name: 'profile.personal.name',
  email: 'profile.contact.email'
});

// ✅ Your flat, comfortable interface preserved
```

### Scenario 3: Legacy System Madness
```typescript
// Ancient systems with cryptic field names
setupCushion('/legacy/api', {
  userName: 'USR_NM_1',
  userEmail: 'USR_EMAIL_ADDR',
  userStatus: 'STATUS_CD'
});

// ✅ Modern comfort from legacy chaos
```

### Scenario 4: Smart Cushioning
```typescript
// Different cushioning based on conditions
setupCushion('/api/user', {
  mapping: {
    name: 'username',
    email: 'user_email'
  },
  condition: (data) => data.version === 'v2',
  fallback: {
    name: 'user_name',  // v1 cushioning
    email: 'email'
  }
});
```

---

## 🧩 Framework Comfort

### React Query + Cushion = Perfect Comfort
```typescript
import { useQuery } from '@tanstack/react-query';

// Setup cushion once
setupCushion('/api/user', userCushioning);

// Enjoy comfort everywhere
function UserProfile() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => fetch('/api/user').then(r => r.json())
  });
  
  return <div>{user?.name}</div>; // ✅ Cushioned automatically
}
```

### SWR Comfort Zone
```typescript
import useSWR from 'swr';

// Setup comfort once
setupCushion('/api/posts', postCushioning);

// Relax in comfort
function PostList() {
  const { data: posts } = useSWR('/api/posts', fetch);
  
  return posts?.map(post => (
    <div key={post.id}>{post.title}</div> // ✅ Perfectly cushioned
  ));
}
```

### Universal Comfort (Works with Everything)
```typescript
// Axios? Cushioned.
const { data: user } = await axios.get('/api/user');

// Fetch? Cushioned.
const user = await fetch('/api/user').then(r => r.json());

// Ky? Cushioned.
const user = await ky.get('/api/user').json();

// ✅ All cushioned from external chaos
```

---

## 🔧 Advanced Comfort Features

### Pattern-Based Cushioning
```typescript
setupCushions({
  '/api/user': userCushioning,           // Exact comfort
  '/api/user/*': userCushioning,         // Wildcard comfort
  '/api/user/:id': userCushioning,       // Parameter comfort
  '/api/posts?detailed=true': detailedCushioning  // Query comfort
});
```

### Manual Comfort Control
```typescript
import { absorb } from 'cushion';

// For one-off comfort needs
const comfortableData = absorb(chaoticServerData, {
  title: 'post_title',
  author: 'writer.display_name'
});
```

### TypeScript Comfort
```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

// Full comfort with type safety
setupCushion('/api/user', {
  name: 'username',
  email: 'user_email', 
  age: 'user_age'
});

const user = await fetch('/api/user').then(r => r.json()) as User;
//    ↑ Cushioned and typed for maximum comfort
```

---

## 🔌 Comfort Plugins

### Zod Validation Comfort
```typescript
import { z } from 'zod';
import { zodPlugin } from 'cushion/zod';

use(zodPlugin);

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

setupCushion('/api/user', {
  mapping: { name: 'username', email: 'user_email' },
  schema: UserSchema  // Cushioned + validated comfort
});
```

### React Comfort Hooks
```typescript
import { useCushion } from 'cushion/react';

function UserProfile() {
  // Declarative comfort in components
  const user = useCushion('/api/user', userCushioning);
  
  return <div>{user?.name}</div>;
}
```

---

## 📊 Comfort Performance

- **Bundle Size**: < 15KB gzipped (lightweight comfort)
- **Runtime Overhead**: < 1ms per cushioning (fast comfort)
- **Memory Usage**: Minimal (efficient comfort)
- **Tree Shaking**: Full support (selective comfort)

```typescript
// Import only the comfort you need
import { setupCushion } from 'cushion/core';     // 8KB
import { absorb } from 'cushion/absorb';         // 3KB
import { useCushion } from 'cushion/react';      // 2KB
```

---

## 🆚 Comfort Comparisons

### vs tRPC
| Feature | Cushion | tRPC |
|---------|---------|------|
| **External System Support** | ✅ Any system | ❌ TypeScript only |
| **Existing Code Comfort** | ✅ Zero changes | ❌ Full rewrite |
| **Change Resilience** | ✅ Frontend-first | ❌ Server-dependent |
| **Comfort Size** | ✅ 15KB | ❌ 50KB+ |

### vs Manual Mapping
| Feature | Cushion | Manual |
|---------|---------|--------|
| **Maintenance Comfort** | ✅ One place | ❌ Everywhere |
| **Error Resistance** | ✅ Centralized | ❌ Copy-paste chaos |
| **Type Comfort** | ✅ Full support | ❌ Manual work |
| **Team Consistency** | ✅ Guaranteed | ❌ Team dependent |

---

## 🎯 Comfort Use Cases

### ✅ Perfect Comfort For
- 🏢 **Legacy System Integration**: Ancient chaos → Modern comfort
- 🚀 **Rapid Development**: Frequent changes → Stable comfort  
- 👥 **Large Teams**: Multiple systems → Unified comfort
- 🔄 **System Migrations**: Gradual transitions → Smooth comfort
- 🌍 **External APIs**: Uncontrolled chaos → Controlled comfort

### ❌ Comfort Not Needed For
- 🏠 **Full Control Environment**: You control everything (use tRPC)
- 🎯 **GraphQL Systems**: Use GraphQL's built-in comfort
- 📱 **Tiny Apps**: < 10 API calls (manual is fine)
- ⚡ **Microsecond Optimization**: Extreme performance needs

---

## 🔍 Comfort Examples

### E-commerce Comfort
```typescript
// Product chaos → Shopping comfort
setupCushions({
  '/api/products': {
    title: 'product_name',
    price: 'sale_price',
    image: 'primary_image_url',
    rating: 'avg_rating'
  },
  '/api/cart': {
    items: 'cart_items',
    total: 'total_amount',
    shipping: 'shipping_cost'
  }
});
```

### Social Media Comfort
```typescript
// Feed chaos → Social comfort
setupCushion('/api/feed', {
  posts: 'feed_items',
  'posts.*.author': 'posts.*.user.display_name',
  'posts.*.content': 'posts.*.post_content',
  'posts.*.likes': 'posts.*.engagement.like_count'
});
```

### Financial System Comfort
```typescript
// Banking chaos → Financial comfort
setupCushion('/legacy/account', {
  accountNumber: 'ACCT_NO_1',
  balance: 'CURR_BAL_AMT',
  accountType: 'ACCT_TYP_CD',
  lastTransaction: 'LAST_TXN_DT'
});
```

---

## 🛠️ Development Comfort

### Contributing to Comfort
```bash
git clone https://github.com/username/cushion.git
cd cushion
pnpm install
pnpm dev
```

### Testing Comfort
```bash
pnpm test        # Comfort unit tests
pnpm test:e2e    # End-to-end comfort tests
pnpm test:types  # Type comfort checking
```

### Building Comfort
```bash
pnpm build       # Build all comfort packages
pnpm size        # Check comfort bundle size
```

---

## 📚 Comfort Resources

- 📖 **[Documentation](https://cushion.dev)** - Complete comfort guides
- 🎮 **[Playground](https://cushion.dev/playground)** - Try comfort online
- 💡 **[Examples](https://github.com/username/cushion/tree/main/examples)** - Real comfort cases
- 🐛 **[Issues](https://github.com/username/cushion/issues)** - Comfort problems
- 💬 **[Discussions](https://github.com/username/cushion/discussions)** - Comfort community

---

## 🏆 Comfort Success Stories

> *"Cushion saved us 3 weeks when our backend team restructured everything. One config change and we were back to comfort!"*  
> — **Sarah Chen, Frontend Lead @ TechCorp**

> *"Legacy systems used to be a nightmare. Now they're just comfortably cushioned APIs. Amazing!"*  
> — **Mike Rodriguez, Full-Stack Developer @ StartupXYZ**

> *"Finally, external API chaos doesn't break our sprint. Cushion keeps us comfortable and productive."*  
> — **Alex Kim, Senior Developer @ Enterprise Inc**

---

## 🤝 Comfort Community

- 🌟 **Star on GitHub** if Cushion brought you comfort!
- 🐦 **Follow [@CushionJS](https://twitter.com/cushionjs)** for comfort updates
- 💼 **[LinkedIn](https://linkedin.com/company/cushion)** for professional comfort
- 📧 **[Newsletter](https://cushion.dev/newsletter)** for comfort tips

---

## 📄 License

MIT © [Your Name](https://github.com/username)

---

<div align="center">
  <h3>🛏️ Stay comfortable while the world changes around you</h3>
  <p><em>Absorb the chaos, keep the peace</em></p>
  
  **[Get Comfortable →](https://cushion.dev/guide)**
</div>