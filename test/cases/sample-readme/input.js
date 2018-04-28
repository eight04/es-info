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
