'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = context => ({
  Decorator: node => {
    if (
      node.expression.type === 'CallExpression' &&
      node.expression.callee.name === 'Param' &&
      node.expression.arguments[0].type === 'Literal'
    ) {
      const param_name = node.expression.arguments[0].value;
      const method_def = node.parent.parent.parent;
      if (method_def.type === 'MethodDefinition') {
        for (const decorator of method_def.decorators) {
          if (
            decorator.expression.callee.name === 'Get' ||
            decorator.expression.callee.name === 'Head' ||
            decorator.expression.callee.name === 'Post' ||
            decorator.expression.callee.name === 'Put' ||
            decorator.expression.callee.name === 'Delete' ||
            decorator.expression.callee.name === 'Connect' ||
            decorator.expression.callee.name === 'Options' ||
            decorator.expression.callee.name === 'Trace' ||
            decorator.expression.callee.name === 'Patch'
          ) {
            if (
              decorator.expression.arguments != null &&
              decorator.expression.arguments.length > 0 &&
              !decorator.expression.arguments[0].value.includes(
                `:${param_name}`,
              )
            ) {
              context.report(
                node.expression.arguments[0],
                `"${param_name}" is not a named parameter in request path ("${
                  decorator.expression.arguments[0].value
                }")`,
              );
            }
          }
        }
      }
    }
  },
});
