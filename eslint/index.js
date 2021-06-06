'use strict';

module.exports = {
  rules: {
    'no-findOne-by-id': require('./no-findOne-by-id'),
    'disallow-src-dist-import': require('./disallow-src-dist-import'),
    'param-decorator-defined': require('./param-decorator-defined'),
    'param-decorator-no-leading-colon': require('./param-decorator-no-leading-colon'),
    'disable-barreling': require('./disable-barreling'),
  },
};
