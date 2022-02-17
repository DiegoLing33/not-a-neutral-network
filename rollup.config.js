import nodeResolve from 'rollup-plugin-node-resolve';
import commonJs from 'rollup-plugin-commonjs';
import typeScript from 'rollup-plugin-typescript2';
import visualizer from 'rollup-plugin-visualizer';
import {sizeSnapshot} from "rollup-plugin-size-snapshot";
import {terser} from 'rollup-plugin-terser';


export default [{
  input: 'src/app.ts',
  output: [{ file: 'src/server/static/app.js', format: 'iife' }],
  plugins: [
    nodeResolve(), // подключение модулей node
    commonJs(), // подключение модулей commonjs
    typeScript({tsconfig: "tsconfig.json", tsconfigOverride: {compilerOptions: {module: "ES2015"}}}), // подключение typescript
    sizeSnapshot(), // напишет в консоль размер бандла
    // terser(), // минификатор совместимый с ES2015+, форк и наследник UglifyES
    visualizer() // анализатор бандла
  ],
}];
