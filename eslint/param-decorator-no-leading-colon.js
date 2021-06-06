'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = context => ({
  Decorator: node => {
    if (
      node.expression.type === 'CallExpression' &&
      node.expression.callee.name === 'Param' &&
      node.expression.arguments[0].type === 'Literal' &&
      node.expression.arguments[0].value.startsWith(':')
    ) {
      context.report(
        node.expression.arguments[0],
        `@Param decorator property cannot start with ":"`,
      );
    }
  },
});
