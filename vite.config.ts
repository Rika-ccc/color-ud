import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// リポジトリ名に変更（"color-ud" の部分）
const repoName = 'color-ud'

export default defineConfig({
  plugins: [react()],
  base: `/${repoName}/`
})
