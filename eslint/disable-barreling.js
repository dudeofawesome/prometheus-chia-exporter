'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = context => ({
  Program: node => {
    if (node.body.find(node => node.type !== 'ExportAllDeclaration') == null) {
      context.report(node, `Barrel files are not allowed.`);
    }
  },
});
