import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { format } from 'prettier';
import fs from 'fs';
import path from 'path';

// Define plugin to replace __ENABLE_GLOBAL_MOUNT__
// This plugin should run after TypeScript compilation
const definePlugin = (enableGlobalMount) => ({
  name: 'define',
  transform(code, id) {
    // Match the compiled JavaScript output
    if (code.includes('__ENABLE_GLOBAL_MOUNT__')) {
      return code.replace(/__ENABLE_GLOBAL_MOUNT__/g, String(enableGlobalMount));
    }
    return null;
  }
});

// Plugin to format ESM output with prettier
const formatESMPlugin = {
  name: 'format-esm',
  async writeBundle(options, bundle) {
    // 只处理 esm.js 文件
    if (options.file && options.file.endsWith('.esm.js')) {
      const filePath = path.isAbsolute(options.file)
        ? options.file
        : path.resolve(process.cwd(), options.file);

      if (fs.existsSync(filePath)) {
        let code = fs.readFileSync(filePath, 'utf-8');

        // 先修复注释格式：确保块注释后跟换行
        // 匹配 */ 后面跟空白字符或直接跟代码的情况（如 "*/ const", "*/function" 等）
        // 但排除已经是换行的情况
        code = code.replace(/\*\/\s*([a-zA-Z_$])/g, '*/\n$1');

        try {
          const formatted = await format(code, {
            parser: 'babel',
            semi: false,
            singleQuote: true,
            tabWidth: 2,
            trailingComma: 'none',
            printWidth: 100,
            arrowParens: 'avoid',
            // 确保注释后有适当的间距
            endOfLine: 'lf'
          });
          fs.writeFileSync(filePath, formatted, 'utf-8');
        } catch (error) {
          console.warn('格式化失败，使用原始代码:', error.message);
        }
      }
    }
  }
};

// ESM 构建配置 - 不压缩，只混淆，保留块注释
const terserConfigESM = {
  compress: false, // 禁用压缩，只进行混淆
  mangle: {
    toplevel: true, // 混淆顶级作用域变量名
    properties: {
      regex: /^_/ // 混淆以下划线开头的属性名
    }
  },
  format: {
    // 保留块注释（/* ... */ 和 /** ... */）
    comments: (node, comment) => {
      // comment2 是块注释类型（包括 /* */ 和 /** */）
      return comment.type === 'comment2';
    },
    beautify: true, // 美化输出，保持代码格式
    indent_level: 2, // 缩进级别
    preserve_annotations: false, // 不保留注释
    max_line_len: false, // 不限制行长度，让注释自然换行
    ascii_only: false, // 允许非 ASCII 字符
    wrap_iife: false, // 不包装立即执行函数
    wrap_func_args: false // 不包装函数参数
  }
};

// UMD 构建配置 - 启用压缩
const terserConfig = {
  compress: true, // 启用压缩
  mangle: {
    toplevel: true, // 混淆顶级作用域变量名
    properties: {
      regex: /^_/ // 混淆以下划线开头的属性名
    }
  },
  format: {
    comments: false, // 移除注释
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
      definePlugin(true), // UMD 构建启用全局挂载（在 TypeScript 编译后替换）
      terser(terserConfig) // UMD 构建使用压缩配置
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
        declarationDir: './dist',
        removeComments: false // 保留注释，让 terser 来处理
      }),
      definePlugin(false), // ESM 构建禁用全局挂载（在 TypeScript 编译后替换）
      terser(terserConfigESM), // ESM 构建保持现状，不压缩
      formatESMPlugin // 最后格式化代码
    ]
  }
];
