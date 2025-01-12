import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
export default [
  {
    // 入口文件
    input: 'packages/vue/src/index.ts',
    output: [
      {
        sourcemap: true,
        file: './packages/vue/dist/vue.js',
        // script引入
        format: 'iife',
        name: 'Vue'
      }
    ],
    plugins: [
      typescript({ sourceMap: true }),
      // 路径补全
      resolve(),
      // 支持 commjs
      commonjs()
    ]
  }
]
