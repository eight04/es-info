const {walk} = require("estree-walker");

class ParseError extends Error {
  constructor(message, node) {
    super(message);
    this.node = node;
  }
}

function analyze(ast) {
  const result = {
    import: {},
    export: {
      default: false,
      named: [],
      all: false
    },
    dynamicImport: []
  };
  
  walk(ast, {
    enter: analyzeNode
  });
  
  function getImported(id) {
    return result.import[id] ?
      result.import[id] :
      (result.import[id] = {
        named: [],
        default: false,
        all: false
      });
  }
  
  function analyzeNode(node) {
    if (node.type === "ImportDeclaration") {
      const imported = getImported(node.source.value);
      for (const spec of node.specifiers) {
        if (spec.type === "ImportSpecifier") {
          imported.named.push(spec.imported.name);
        } else if (spec.type === "ImportDefaultSpecifier") {
          imported.default = true;
        } else if (spec.type === "ImportNamespaceSpecifier") {
          imported.all = true;
        } else {
          throw new ParseError(`Unknown node type ${spec.type}`, spec);
        }
      }
    } else if (node.type === "ExportNamedDeclaration") {
      // check import
      if (node.source) {
        const imported = getImported(node.source.value);
        for (const spec of node.specifiers) {
          if (spec.local.name === "default") {
            imported.default = true;
          } else {
            imported.named.push(spec.local.name);
          }
        }
      }
      for (const spec of node.specifiers) {
        if (spec.exported.name === "default") {
          result.export.default = true;
        } else {
          result.export.named.push(spec.exported.name);
        }
      }
      if (node.declaration) {
        if (
          node.declaration.type === "FunctionDeclaration" ||
          node.declaration.type === "ClassDeclaration"
        ) {
          result.export.named.push(node.declaration.id.name);
        } else if (node.declaration.type === "VariableDeclaration") {
          for (const va of node.declaration.declarations) {
            result.export.named.push(va.id.name);
          }
        } else {
          throw new ParseError(`Unknown node type ${node.declaration.type}`, node.declaration);
        }
      }
    } else if (node.type === "ExportDefaultDeclaration") {
      result.export.default = true;
    } else if (node.type === "ExportAllDeclaration") {
      result.export.all = true;
      const imported = getImported(node.source.value);
      imported.all = true;
    } else if (dynamicImport && node.type === "CallExpression") {
      if (node.callee.type === "Import") {
        result.dynamicImport.push(node.arguments[0].value);
      }
    }
  }
  
  return result;
}

module.exports = {analyze};
