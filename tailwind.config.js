/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./react/**/*.{js,jsx,ts,tsx}",
    "./modules/**/*.{js,jsx,ts,tsx}",
    "./app.js",
    "./conference.js",
    "./index.html",
    "./base.html",
    "./head.html",
    "./body.html",
    "./title.html",
    "./fonts.html",
    "./plugin.head.html"
  ],
  theme: {
    extend: {
      // 可以在这里扩展主题配置
      colors: {
        // 添加 Jitsi Meet 的品牌颜色
        'jitsi-blue': '#1c73e8',
        'jitsi-green': '#00d4aa',
        'jitsi-red': '#ff6b6b',
        'jitsi-yellow': '#ffd93d',
        'jitsi-purple': '#8b5cf6',
        'jitsi-gray': '#6b7280',
        'jitsi-dark': '#1f2937',
        'jitsi-light': '#f9fafb'
      },
      fontFamily: {
        // 可以添加自定义字体
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        // 可以添加自定义间距
      },
      borderRadius: {
        // 可以添加自定义圆角
      }
    },
  },
  plugins: [
    // 可以在这里添加 Tailwind 插件
  ],
  // 与现有 SCSS 样式共存
  corePlugins: {
    preflight: false, // 禁用 Tailwind 的 CSS 重置，避免与现有样式冲突
  }
}
