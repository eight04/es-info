const {walk} = require("estree-walker");
const {attachScopes} = require("rollup-pluginutils");
const isReference = require("is-reference");

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
  
  ast._esInfoScope = attachScopes(ast, "_esInfoScope");
  
  const importRefs = new Map;
  
  walk(ast, {
    enter: analyzeNode
  });
  
  function getImported(id) {
    return result.import[id] ?
      result.import[id] :
      (result.import[id] = {
        named: [],
        default: false,
        all: false,
        used: []
      });
  }
  
  function analyzeNode(node, parent) {
    if (node._esInfoSkip) {
      this.skip();
      return;
    }
    if (!node._esInfoScope && parent) {
      node._esInfoScope = parent._esInfoScope;
    }
    if (node.type === "ImportDeclaration") {
      const id = node.source.value;
      const imported = getImported(id);
      for (const spec of node.specifiers) {
        if (spec.type === "ImportSpecifier") {
          imported.named.push(spec.imported.name);
          importRefs.set(spec.local.name, {id, name: spec.imported.name});
        } else if (spec.type === "ImportDefaultSpecifier") {
          imported.default = true;
          importRefs.set(spec.local.name, {id, name: "default"});
        } else if (spec.type === "ImportNamespaceSpecifier") {
          imported.all = true;
          importRefs.set(spec.local.name, {id, name: null});
        } else {
          throw new ParseError(`Unknown node type ${spec.type}`, spec);
        }
        spec.local._esInfoSkip = true;
      }
    } else if (node.type === "ExportNamedDeclaration") {
      // check import
      if (node.source) {
        const id = node.source.value;
        const imported = getImported(id);
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
    } else if (node.type === "CallExpression") {
      if (node.callee.type === "Import") {
        result.dynamicImport.push(node.arguments[0].value);
      }
    } else if (node.type === "Identifier" && isReference(node, parent)) {
      if (!node._esInfoScope.contains(node.name) && importRefs.has(node.name)) {
        let {id, name} = importRefs.get(node.name);
        if (!name && parent.type === "MemberExpression") {
          name = parent.property.name;
        }
        if (name && !result.import[id].used.includes(name)) {
          result.import[id].used.push(name);
        }
      }
    }
  }
  
  return result;
}

module.exports = {analyze};
