// for converting commonjs modules to to ES6, so they can be included in a rollup bundle
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

const globals = {
    'apollo-link': 'apolloLink.core',
    'apollo-utilities': 'apolloUtilities',
    'lodash.clonedeep': 'lodash.clonedeep',
    'lodash.merge': 'lodash.merge',
};

export default {
    input: 'lib/index.js',
    output: {
        file: pkg.main, // get output file name from `main` field in package.json
        name: 'apolloLink.deepDedup',
        globals, // map modules to globals in the bundle
        format: 'umd',
        sourcemap: true,
    },
    external: Object.keys(globals), // so they won't be resolved in the bundle
    plugins: [commonjs()],
};
