es-info
=======

[![Build Status](https://travis-ci.com/eight04/es-info.svg?branch=master)](https://travis-ci.com/eight04/es-info)
[![codecov](https://codecov.io/gh/eight04/es-info/branch/master/graph/badge.svg)](https://codecov.io/gh/eight04/es-info)

Analyze ES module and extract information about imports, exports, and dynamic imports.

Usage
-----

```js
const {Parser} = require("acorn");
const {default: dynamicImport} = require("acorn-dynamic-import");
const {analyze} = require("es-info");

const DynamicImportParser = Parser.extend(dynamicImport);

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
const ast = DynamicImportParser.parse(code, {sourceType: "module"});

const result = analyze(ast);
```

Result:

```js
{
  import: {
    foo: {
      default: true,
      named: [],
      all: false,
      used: ["default"]
    },
    bar: {
      default: false,
      named: ["bar"],
      all: false,
      used: []
    },
    baz: {
      default: false,
      named: [],
      all: true,
      used: []
    },
    bla: {
      default: false,
      named: ["bla"],
      all: false,
      used: []
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

### analyze

```js
const analyzeResult: {
  import: Object<moduleId : importInfo>,
  export: exportInfo,
  dynamicImport: Array<String>
} = analyze(ast);
```

`import` is an object map. The key is the module ID and the value is an info object with these members:

```js
const importInfo = {
  default: Boolean,
  named: Array<String>,
  all: Boolean,
  used: Array<String>
};
```

If `importInfo.default` is true then the default member is imported from the module.

`importInfo.named` contains a list of imported names.

If `importInfo.all` is true then all names are imported from the module (`import * from ...`).

`importInfo.used` is an array of imported names. If a name is included in this array, then it is referenced somewhere in the code. You can use this array to determine which names are actually used when `importInfo.all` is true.

Note that `export {foo} from "bar"` doesn't *use* `foo`.

`exportInfo` has the following shape:

```js
const exportInfo = {
  default: Boolean,
  named: Array<String>,
  all: Boolean
};
```

If `exportInfo.default` is true then the module exports a default member.

`exportInfo.named` is a list of exported names.

If `exportInfo.all` is true then the module exports all members from another module e.g. `export * from "foo"`.

`dynamicImport` is a list of module ID which are imported with dynamic `import()` statement.

Changelog
---------

* 0.2.0 (Next)

  - **Breaking: drop `options.dynamicImport`. Now the module always analyze the entire tree.**
  - Add: `importInfo.used`. Use it to check which names are used.

* 0.1.1 (Apr 29, 2018)

  - Fix: ClassDeclaration.

* 0.1.0 (Apr 28, 2018)

  - Initial release.
