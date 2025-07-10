import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Cushion',
  description: 'Absorb the chaos, keep the peace',
  base: '/cushion/',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Playground', link: '/playground/' }
    ],

    sidebar: {
      '/guide/': [
        { text: 'Getting Comfortable', link: '/guide/' },
        { text: 'Basic Cushioning', link: '/guide/basic-usage' },
        { text: 'Advanced Comfort', link: '/guide/advanced' },
        { text: 'Comfort Plugins', link: '/guide/plugins' }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/username/cushion' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Cushion 🛏️'
    }
  },

  vite: {
    optimizeDeps: {
      include: ['cushion']
    }
  }
})