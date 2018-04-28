es-info
=======

Analyze ES module and extract information about imports, exports, and dynamic imports.

Usage
-----

```js
const {default: acorn} = require("acorn-dynamic-import");
const {analyze} = require("cjs-es");

const code = `
import foo from "foo";
import {bar} from "bar";
import * as baz from "baz";

export default "bar";
export const boo = "boo";
export {bla} from "bla";

if (foo === "doSomething") {
  import("dynamic-imported")
    .then(module => module.doSomething());
}
`;

const ast = acorn.parse(code, {
  sourceType: "module",
  plugins: {
    dynamicImport: true
  }
});
const result = analyze(ast, {dynamicImport: true});
```

Result:

```js
{
  import: {
    foo: {
      default: true,
      named: [],
      all: false
    },
    bar: {
      default: false,
      named: ["bar"],
      all: false
    },
    baz: {
      default: false,
      named: []
      all: true
    },
    bla: {
      default: false,
      named: ["bla"],
      all: false
    }
  },
  export: {
    default: true,
    named: ["boo", "bla"],
    all: false
  },
  dynamicImport: ["dynamic-imported"]
}
```

API reference
-------------

This module exports following members.

* `analyze`: A function which can analyze an AST and extract imports, exports information.

### analyze(ast, options: object): Result object

`options` has following members:

* `dynamicImport`: `boolean`. If true then collect dynamic import information. Note that it has to analyze entire AST instead of top-level import/export declarations.

The result object has following properties:

* `import`: An object map. The key is the module ID and the value is an object with these members:

  - `default`: `boolean`. If true then the default member is imported from the module.
  - `named`: `Array<string>`. A list of name that is imported from the module.
  - `all`: `boolean`. If true then all names are imported from the module.
  
* `export`: `object`. It has following keys:

  - `default`: `boolean`. If true then the module has default export.
  - `named`: `Array<string>`. A list of named export.
  - `all`: `boolean`. If true then the module exports all members from another import e.g. `export * from "foo"`.
  
* `dynamicImport`: `Array<string>`. A list of module ID which is imported with dynamic `import()` statement.

Changelog
---------

* 0.1.0 (Apr 28, 2018)

  - Initial release.
