/* eslint-env mocha */
const assert = require("assert");
const fs = require("fs");
const {Parser: AcornParser} = require("acorn");
const {default: dynamicImport} = require("acorn-dynamic-import");
const {analyze} = require("..");

const parseCode = (() => {
  const Parser = AcornParser.extend(dynamicImport);
  return code => Parser.parse(code, {sourceType: "module"});
})();

describe("cases", () => {
  for (const dir of fs.readdirSync(__dirname + "/cases")) {
    it(dir, () => {
      const readFile = filename => {
        try {
          const content = fs.readFileSync(`${__dirname}/cases/${dir}/${filename}`, "utf8").replace(/\r/g, "");
          if (filename.endsWith(".json")) {
            return JSON.parse(content);
          }
          return content;
        } catch (err) {
          // pass
        }
      };
      const options = readFile("options.json") || {};
      const error = readFile("error.json");
      const input = readFile("input.js");
      const output = readFile("output.json");
      const ast = parseCode(input);
      
      let result, err;
      try {
        result = analyze(ast, Object.assign({dynamicImport: true}, options));
      } catch (_err) {
        if (!error) {
          throw _err;
        }
        err = _err;
      }
      if (result) {
        assert.deepStrictEqual(result, output);
      } else {
        assert.equal(err.message, error.message);
      }
    });
  }
});
