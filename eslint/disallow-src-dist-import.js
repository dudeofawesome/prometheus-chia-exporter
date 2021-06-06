'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = context => ({
  ImportDeclaration: node => {
    if (
      node.source.type === 'Literal' &&
      (node.source.value.startsWith('dist/') ||
        node.source.value.startsWith('src/'))
    ) {
      context.report(
        node.source,
        `import source cannot start with "${node.source.value.split('/')[0]}/"`,
      );
    }
  },
});
