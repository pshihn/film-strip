import { terser } from "rollup-plugin-terser";
import filesize from 'rollup-plugin-filesize';

export default {
  input: `./bin/film-strip.js`,
  output: {
    file: `./bin/film-strip.min.js`,
    format: 'esm'
  },
  plugins: [
    terser(),
    filesize({
      showMinifiedSize: false,
      showBeforeSizes: 'build'
    })
  ]
};