'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = context => {
  return {
    MemberExpression: node => {
      if (
        node.property.name === 'findOneOrFail' ||
        node.property.name === 'findOne'
      ) {
        if (
          node.parent.arguments == null ||
          node.parent.arguments.length === 0
        ) {
          context.report(
            node,
            `${node.property.name} requires at least one parameter`,
          );
        } else if (
          node.parent.arguments[0].name === 'undefined' ||
          node.parent.arguments[0].name === 'null'
        ) {
          context.report(
            node.parent.arguments[0],
            `${node.parent.arguments[0].name} is not a valid parameter`,
          );
        }
      }
    },
  };
};
