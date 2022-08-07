es-info
=======

[![.github/workflows/build.yml](https://github.com/eight04/es-info/actions/workflows/build.yml/badge.svg)](https://github.com/eight04/es-info/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/eight04/es-info/branch/master/graph/badge.svg)](https://codecov.io/gh/eight04/es-info)

Analyze ES module and extract information about imports, exports, and dynamic imports.

Usage
-----

```js
const {Parser} = require("acorn");
const {analyze} = require("es-info");

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
const ast = Parser.parse(code, {sourceType: "module", ecmaVersion: 2022});

const result = await analyze({ast, subtree: true});
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

```ts
async analyze({
  ast,
  subtree?: boolean
}) => {
  import: {
    [importee]: {
      default: boolean,
      named: Array<string>,
      all: boolean,
      used: Array<string>
    }
  }
  export: {
    default: boolean,
    named: Array<string>,
    all: boolean
  },
  dynamicImport: Array<string>
}
```

#### options

* `ast` is an estree object.
* `subtree` - if `true`, the analyzer will analyze the entire tree, otherwise only those top-level nodes (import/export declarations) are analyzed. **You have to set `subtree` to `true` if you want to collect the usage of imported names and to collect dynamic imports**. Default: `false`.

#### result.import

* `result.import` is an `importee` -> `importInfo` object map.
* `result.import[importee].default` - if true then the default member is imported from the `importee` module.
* `result.import[importee].named` contains a list of imported names.
* `result.import[importee].all` - if true then all names are imported from the module i.e. `import * from ...`.
* `result.import[importee].used` is an array of imported names. If a name is included in this array, then it is referenced somewhere in the code. You can use this array to determine which names are actually used when `.all` is true.

  Note that `export {foo} from "bar"` doesn't *use* `foo`.

#### result.export

* `result.export.default` - if true then the module exports a default member.
* `result.export.named` is a list of exported names.
* `result.export.all` - if true then the module exports all members from another module e.g. `export * from "foo"`.

#### result.dynamicImport

* `dynamicImport` is a list of module ID which are imported with dynamic `import()` statement.

Changelog
---------

* 0.4.0 (Aug 8, 2022)

  - Bump dependencies.
  - **Change: `analyze` is now an async function.**
  - Fix: support `ImportExpression`.

* 0.3.0 (Jun 13, 2019)

  - **Breaking: the signature of `analyze()` is changed.**
  - Add: `subtree` option.

* 0.2.1 (Jun 6, 2019)

  - Fix: rename `.scope` to `._esInfoScope` to avoid the conflict.

* 0.2.0 (Jun 6, 2019)

  - **Breaking: drop `options.dynamicImport`. Now the module always analyze the entire tree.**
  - Add: `importInfo.used`. Use it to check which names are used.

* 0.1.1 (Apr 29, 2018)

  - Fix: ClassDeclaration.

* 0.1.0 (Apr 28, 2018)

  - Initial release.
