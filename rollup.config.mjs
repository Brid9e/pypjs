import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const terserConfig = {
  compress: false, // 禁用压缩，只进行混淆
  mangle: {
    toplevel: true, // 混淆顶级作用域变量名
    properties: {
      regex: /^_/ // 混淆以下划线开头的属性名
    }
  },
  format: {
    comments: false, // 移除注释
    beautify: true, // 美化输出，保持代码格式
    indent_level: 2, // 缩进级别
    preserve_annotations: false // 不保留注释
  }
};

export default [
  // UMD 格式 - 用于浏览器直接引入和 CommonJS
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: 'pypjs',
      sourcemap: false
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist'
      }),
      terser(terserConfig)
    ]
  },
  // ES Module 格式 - 用于 Vue/React 等现代项目
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: false
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist'
      }),
      terser(terserConfig)
    ]
  }
];
