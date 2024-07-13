import { parseJSObject } from "../index";
import {
  extractIdentifierInfoFromCode,
  getMemberExpressionObjectFromProperty,
  isFunctionPresent,
} from "../src/index";

describe("getAllIdentifiers", () => {
  it("works properly", () => {
    const cases: Array<{
      script: string;
      expectedResults: string[];
      invalidIdentifiers?: Record<string, unknown>;
    }> = [
      {
        // Entity reference
        script: "DirectTableReference",
        expectedResults: ["DirectTableReference"],
      },
      {
        // One level nesting
        script: "TableDataReference.data",
        expectedResults: ["TableDataReference.data"],
      },
      {
        // Deep nesting
        script: "TableDataDetailsReference.data.details",
        expectedResults: ["TableDataDetailsReference.data.details"],
      },
      {
        // Deep nesting
        script: "TableDataDetailsMoreReference.data.details.more",
        expectedResults: ["TableDataDetailsMoreReference.data.details.more"],
      },
      {
        // Deep optional chaining
        script: "TableDataOptionalReference.data?.details.more",
        expectedResults: ["TableDataOptionalReference.data"],
      },
      {
        // Deep optional chaining with logical operator
        script:
          "TableDataOptionalWithLogical.data?.details.more || FallbackTableData.data",
        expectedResults: [
          "TableDataOptionalWithLogical.data",
          "FallbackTableData.data",
        ],
      },
      {
        // null coalescing
        script: "TableDataOptionalWithLogical.data ?? FallbackTableData.data",
        expectedResults: [
          "TableDataOptionalWithLogical.data",
          "FallbackTableData.data",
        ],
      },
      {
        // Basic map function
        script: "Table5.data.map(c => ({ name: c.name }))",
        expectedResults: ["Table5.data.map"],
      },
      {
        // Literal property search
        script: "Table6['data']",
        expectedResults: ["Table6"],
      },
      {
        // Deep literal property search
        script: "TableDataOptionalReference['data'].details",
        expectedResults: ["TableDataOptionalReference"],
      },
      {
        // Array index search
        script: "array[8]",
        expectedResults: ["array[8]"],
      },
      {
        // Deep array index search
        script: "Table7.data[4]",
        expectedResults: ["Table7.data[4]"],
      },
      {
        // Deep array index search
        script: "Table7.data[4].value",
        expectedResults: ["Table7.data[4].value"],
      },
      {
        // string literal and array index search
        script: "Table['data'][9]",
        expectedResults: ["Table"],
      },
      {
        // array index and string literal search
        script: "Array[9]['data']",
        expectedResults: [],
        invalidIdentifiers: {
          Array: true,
        },
      },
      {
        // Index identifier search
        script: "Table8.data[row][name]",
        expectedResults: ["Table8.data", "row"],
        // name is a global scoped variable
        invalidIdentifiers: {
          name: true,
        },
      },
      {
        // Index identifier search with global
        script: "Table9.data[appsmith.store.row]",
        expectedResults: ["Table9.data", "appsmith.store.row"],
      },
      {
        // Index literal with further nested lookups
        script: "Table10.data[row].name",
        expectedResults: ["Table10.data", "row"],
      },
      {
        // IIFE and if conditions
        script:
          "(function(){ if(Table11.isVisible) { return Api1.data } else { return Api2.data } })()",
        expectedResults: ["Table11.isVisible", "Api1.data", "Api2.data"],
      },
      {
        // Functions and arguments
        script: "JSObject1.run(Api1.data, Api2.data)",
        expectedResults: ["JSObject1.run", "Api1.data", "Api2.data"],
      },
      {
        // IIFE - without braces
        script: `function() {
          const index = Input1.text

          const obj = {
              "a": 123
          }

          return obj[index]

      }()`,
        expectedResults: ["Input1.text"],
      },
      {
        // IIFE
        script: `(function() {
          const index = Input2.text

          const obj = {
              "a": 123
          }

          return obj[index]

      })()`,
        expectedResults: ["Input2.text"],
      },
      {
        // arrow IIFE - without braces - will fail
        script: `() => {
          const index = Input3.text

          const obj = {
              "a": 123
          }

          return obj[index]

      }()`,
        expectedResults: [],
      },
      {
        // arrow IIFE
        script: `(() => {
          const index = Input4.text

          const obj = {
              "a": 123
          }

          return obj[index]

      })()`,
        expectedResults: ["Input4.text"],
      },
      {
        // Direct object access
        script: `{ "a": 123 }[Input5.text]`,
        expectedResults: ["Input5.text"],
      },
      {
        // Function declaration and default arguments
        script: `function run(apiData = Api1.data) {
          return apiData;
        }`,
        expectedResults: ["Api1.data"],
      },
      {
        // Function declaration with arguments
        script: `function run(data) {
          return data;
        }`,
        expectedResults: [],
      },
      {
        // anonymous function with variables
        script: `() => {
          let row = 0;
          const data = {};
          while(row < 10) {
            data["test__" + row] = Table12.data[row];
            row = row += 1;
          }
        }`,
        expectedResults: ["Table12.data"],
      },
      {
        // function with variables
        script: `function myFunction() {
          let row = 0;
          const data = {};
          while(row < 10) {
            data["test__" + row] = Table13.data[row];
            row = row += 1;
          }
        }`,
        expectedResults: ["Table13.data"],
      },
      {
        // expression with arithmetic operations
        script: `Table14.data + 15`,
        expectedResults: ["Table14.data"],
      },
      {
        // expression with logical operations
        script: `Table15.data || [{}]`,
        expectedResults: ["Table15.data"],
      },
      // JavaScript built in classes should not be valid identifiers
      {
        script: `function(){
          const firstApiRun = Api1.run();
          const secondApiRun = Api2.run();
          const randomNumber = Math.random();
          return Promise.all([firstApiRun, secondApiRun])
        }()`,
        expectedResults: ["Api1.run", "Api2.run"],
        invalidIdentifiers: {
          Math: true,
          Promise: true,
        },
      },
      // Global dependencies should not be valid identifiers
      {
        script: `function(){
          const names = [["john","doe"],["Jane","dane"]];
          const flattenedNames = _.flatten(names);
          return {flattenedNames, time: moment()}
        }()`,
        expectedResults: [],
        invalidIdentifiers: {
          _: true,
          moment: true,
        },
      },
      // browser Apis should not be valid identifiers
      {
        script: `function(){
          const names = {
            firstName: "John",
            lastName:"Doe"
          };
          const joinedName = Object.values(names).join(" ");
          console.log(joinedName)
          return Api2.name
        }()`,
        expectedResults: ["Api2.name"],
        invalidIdentifiers: {
          Object: true,
          console: true,
        },
      },
      // identifiers and member expressions derived from params should not be valid identifiers
      {
        script: `function(a, b){
          return a.name + b.name
        }()`,
        expectedResults: [],
      },
      // identifiers and member expressions derived from local variables should not be valid identifiers
      {
        script: `function(){
          const a = "variableA";
          const b = "variableB";
          return a.length + b.length
        }()`,
        expectedResults: [],
      },
      // "appsmith" is an internal identifier and should be a valid reference
      {
        script: `function(){
          return appsmith.user
        }()`,
        expectedResults: ["appsmith.user"],
      },
    ];

    // commenting to trigger test shared workflow action
    cases.forEach((perCase) => {
      const { references } = extractIdentifierInfoFromCode(
        perCase.script,
        2,
        perCase.invalidIdentifiers,
      );
      expect(references).toStrictEqual(perCase.expectedResults);
    });
  });
});

describe("parseJSObjectWithAST", () => {
  it("parse js object", () => {
    const body = `export default{
	myVar1: [],
	myVar2: {},
	myFun1: () => {
		//write code here
	},
	myFun2: async () => {
		//use async-await or promises
	}
}`;

    const expectedParsedObject = [
      {
        key: "myVar1",
        value: "[]",
        rawContent: "myVar1: []",
        type: "ArrayExpression",
        position: {
          startLine: 2,
          startColumn: 1,
          endLine: 2,
          endColumn: 11,
          keyStartLine: 2,
          keyEndLine: 2,
          keyStartColumn: 1,
          keyEndColumn: 7,
        },
      },
      {
        key: "myVar2",
        value: "{}",
        rawContent: "myVar2: {}",
        type: "ObjectExpression",
        position: {
          startLine: 3,
          startColumn: 1,
          endLine: 3,
          endColumn: 11,
          keyStartLine: 3,
          keyEndLine: 3,
          keyStartColumn: 1,
          keyEndColumn: 7,
        },
      },
      {
        key: "myFun1",
        value: "() => {}",
        rawContent: "myFun1: () => {\n\t\t//write code here\n\t}",
        type: "ArrowFunctionExpression",
        position: {
          startLine: 4,
          startColumn: 1,
          endLine: 6,
          endColumn: 2,
          keyStartLine: 4,
          keyEndLine: 4,
          keyStartColumn: 1,
          keyEndColumn: 7,
        },
        arguments: [],
        isMarkedAsync: false,
      },
      {
        key: "myFun2",
        value: "async () => {}",
        rawContent:
          "myFun2: async () => {\n\t\t//use async-await or promises\n\t}",
        type: "ArrowFunctionExpression",
        position: {
          startLine: 7,
          startColumn: 1,
          endLine: 9,
          endColumn: 2,
          keyStartLine: 7,
          keyEndLine: 7,
          keyStartColumn: 1,
          keyEndColumn: 7,
        },
        arguments: [],
        isMarkedAsync: true,
      },
    ];
    const { parsedObject } = parseJSObject(body);
    expect(parsedObject).toStrictEqual(expectedParsedObject);
  });

  it("parse js object with literal", () => {
    const body = `export default{
	myVar1: [],
	myVar2: {
		"a": "app",
	},
	myFun1: () => {
		//write code here
	},
	myFun2: async () => {
		//use async-await or promises
	}
}`;
    const expectedParsedObject = [
      {
        key: "myVar1",
        value: "[]",
        rawContent: "myVar1: []",
        type: "ArrayExpression",
        position: {
          startLine: 2,
          startColumn: 1,
          endLine: 2,
          endColumn: 11,
          keyStartLine: 2,
          keyEndLine: 2,
          keyStartColumn: 1,
          keyEndColumn: 7,
        },
      },
      {
        key: "myVar2",
        value: '{\n  "a": "app"\n}',
        rawContent: 'myVar2: {\n\t\t"a": "app",\n\t}',
        type: "ObjectExpression",
        position: {
          startLine: 3,
          startColumn: 1,
          endLine: 5,
          endColumn: 2,
          keyStartLine: 3,
          keyEndLine: 3,
          keyStartColumn: 1,
          keyEndColumn: 7,
        },
      },
      {
        key: "myFun1",
        value: "() => {}",
        rawContent: "myFun1: () => {\n\t\t//write code here\n\t}",
        type: "ArrowFunctionExpression",
        position: {
          startLine: 6,
          startColumn: 1,
          endLine: 8,
          endColumn: 2,
          keyStartLine: 6,
          keyEndLine: 6,
          keyStartColumn: 1,
          keyEndColumn: 7,
        },
        arguments: [],
        isMarkedAsync: false,
      },
      {
        key: "myFun2",
        value: "async () => {}",
        rawContent:
          "myFun2: async () => {\n\t\t//use async-await or promises\n\t}",
        type: "ArrowFunctionExpression",
        position: {
          startLine: 9,
          startColumn: 1,
          endLine: 11,
          endColumn: 2,
          keyStartLine: 9,
          keyEndLine: 9,
          keyStartColumn: 1,
          keyEndColumn: 7,
        },
        arguments: [],
        isMarkedAsync: true,
      },
    ];
    const { parsedObject } = parseJSObject(body);
    expect(parsedObject).toStrictEqual(expectedParsedObject);
  });

  it("parse js object with variable declaration inside function", () => {
    const body = `export default{
      myFun1: () => {
        const a = {
          conditions: [],
          requires: 1,
          testFunc: () => {},
          testFunc2: function(){}
        };
      },
      myFun2: async () => {
        //use async-await or promises
      }
    }`;
    const expectedParsedObject = [
      {
        key: "myFun1",
        value:
          "() => {\n" +
          "  const a = {\n" +
          "    conditions: [],\n" +
          "    requires: 1,\n" +
          "    testFunc: () => {},\n" +
          "    testFunc2: function () {}\n" +
          "  };\n" +
          "}",
        rawContent:
          "myFun1: () => {\n" +
          "        const a = {\n" +
          "          conditions: [],\n" +
          "          requires: 1,\n" +
          "          testFunc: () => {},\n" +
          "          testFunc2: function(){}\n" +
          "        };\n" +
          "      }",
        type: "ArrowFunctionExpression",
        position: {
          startLine: 2,
          startColumn: 6,
          endLine: 9,
          endColumn: 7,
          keyStartLine: 2,
          keyEndLine: 2,
          keyStartColumn: 6,
          keyEndColumn: 12,
        },
        arguments: [],
        isMarkedAsync: false,
      },
      {
        key: "myFun2",
        value: "async () => {}",
        rawContent:
          "myFun2: async () => {\n        //use async-await or promises\n      }",
        type: "ArrowFunctionExpression",
        position: {
          startLine: 10,
          startColumn: 6,
          endLine: 12,
          endColumn: 7,
          keyStartLine: 10,
          keyEndLine: 10,
          keyStartColumn: 6,
          keyEndColumn: 12,
        },
        arguments: [],
        isMarkedAsync: true,
      },
    ];
    const { parsedObject } = parseJSObject(body);
    expect(parsedObject).toStrictEqual(expectedParsedObject);
  });

  it("parse js object with params of all types", () => {
    const body = `export default{
      myFun2: async (a,b = Array(1,2,3),c = "", d = [], e = this.myVar1, f = {}, g = function(){}, h = Object.assign({}), i = String(), j = storeValue(), k = "Hello", l = 10, m = null, n = "hello" + 500, o = true, p = () => "arrow function", { o1 = 20, o2 }, [ a1, a2 = 30 ], { k1 = 20, k2 = 40 } = { k1: 500, k2: 600 }, [ g1 = 5, g2 ] = [], ...rest) => {
        //use async-await or promises
      },
    }`;

    const expectedParsedObject = [
      {
        key: "myFun2",
        value: `async (a, b = Array(1, 2, 3), c = \"\", d = [], e = this.myVar1, f = {}, g = function () {}, h = Object.assign({}), i = String(), j = storeValue(), k = \"Hello\", l = 10, m = null, n = \"hello\" + 500, o = true, p = () => \"arrow function\", {o1 = 20, o2}, [a1, a2 = 30], {k1 = 20, k2 = 40} = {
  k1: 500,
  k2: 600
}, [g1 = 5, g2] = [], ...rest) => {}`,
        rawContent:
          'myFun2: async (a,b = Array(1,2,3),c = "", d = [], e = this.myVar1, f = {}, g = function(){}, h = Object.assign({}), i = String(), j = storeValue(), k = "Hello", l = 10, m = null, n = "hello" + 500, o = true, p = () => "arrow function", { o1 = 20, o2 }, [ a1, a2 = 30 ], { k1 = 20, k2 = 40 } = { k1: 500, k2: 600 }, [ g1 = 5, g2 ] = [], ...rest) => {\n' +
          "        //use async-await or promises\n" +
          "      }",
        type: "ArrowFunctionExpression",
        position: {
          startLine: 2,
          startColumn: 6,
          endLine: 4,
          endColumn: 7,
          keyStartLine: 2,
          keyEndLine: 2,
          keyStartColumn: 6,
          keyEndColumn: 12,
        },
        arguments: [
          { paramName: "a", defaultValue: undefined },
          { paramName: "b", defaultValue: "{{Array(1,2,3)}}" },
          { paramName: "c", defaultValue: "" },
          { paramName: "d", defaultValue: "{{[]}}" },
          { paramName: "e", defaultValue: "{{this.myVar1}}" },
          { paramName: "f", defaultValue: "{{{}}}" },
          { paramName: "g", defaultValue: "{{function(){}}}" },
          { paramName: "h", defaultValue: "{{Object.assign({})}}" },
          { paramName: "i", defaultValue: "{{String()}}" },
          { paramName: "j", defaultValue: "{{storeValue()}}" },
          { paramName: "k", defaultValue: "Hello" },
          { paramName: "l", defaultValue: "{{10}}" },
          { paramName: "m", defaultValue: "{{null}}" },
          { paramName: "n", defaultValue: '{{"hello" + 500}}' },
          { paramName: "o", defaultValue: "{{true}}" },
          { paramName: "p", defaultValue: '{{() => "arrow function"}}' },
          { paramName: "", defaultValue: "{{{}}}" },
          { paramName: "", defaultValue: "{{[]}}" },
          { paramName: "", defaultValue: undefined },
          { paramName: "", defaultValue: undefined },
          { paramName: "rest", defaultValue: undefined },
        ],
        isMarkedAsync: true,
      },
    ];
    const { parsedObject } = parseJSObject(body);
    expect(parsedObject).toStrictEqual(expectedParsedObject);
  });
});

describe("isFunctionPresent", () => {
  it("should return true if function is present", () => {
    const code = "function myFun(){}";

    const result = isFunctionPresent(code, 2);

    expect(result).toBe(true);
  });

  it("should return true if arrow function is present", () => {
    const code = "const myFun = () => {}";

    const result = isFunctionPresent(code, 2);

    expect(result).toBe(true);
  });

  it("should return false if function is absent", () => {
    const code = "const a = { key: 'value' }";

    const result = isFunctionPresent(code, 2);

    expect(result).toBe(false);
  });

  it("should return false for a string", () => {
    const code = "Hello world {{appsmith.store.name}}!!";

    const result = isFunctionPresent(code, 2);

    expect(result).toBe(false);
  });

  it("should return true for shorthand arrow function", () => {
    const code = "const myFun = () => 'value'";

    const result = isFunctionPresent(code, 2);

    expect(result).toBe(true);
  });

  it("should return true for IFFE function", () => {
    const code = "(function myFun(){ console.log('hello') })()";

    const result = isFunctionPresent(code, 2);

    expect(result).toBe(true);
  });

  it("should return true for functions with parameters", () => {
    const code = "function myFun(arg1, arg2){ console.log(arg1, arg2); }";

    const result = isFunctionPresent(code, 2);

    expect(result).toBe(true);
  });

  it("should return true for functions with parameters", () => {
    const code = "function myFun(arg1, arg2){ console.log(arg1, arg2); }";

    const result = isFunctionPresent(code, 2);

    expect(result).toBe(true);
  });

  it("should return true for higher order functions", () => {
    const code = "function myFun(cb){ const val = cb(); }";

    const result = isFunctionPresent(code, 2);

    expect(result).toBe(true);
  });

  it("should return true for functions with promises", () => {
    const code = "async function myFun(promise){ const val = await promise; }";

    const result = isFunctionPresent(code, 2);

    expect(result).toBe(true);
  });
});

describe("getMemberExpressionObjectFromProperty", () => {
  it("returns an empty array for empty property name", () => {
    const code = `function(){
      const test = Api1.data.test
      return "Favour"
    }`;
    const propertyName = "";
    const actualResponse = getMemberExpressionObjectFromProperty(
      propertyName,
      code,
    );
    expect(actualResponse).toStrictEqual([]);
  });
  it("returns an empty array for invalid js", () => {
    const code = `function(){
      const test = Api1.data.test
      return "Favour"
    `;
    const propertyName = "test";
    const actualResponse = getMemberExpressionObjectFromProperty(
      propertyName,
      code,
    );
    expect(actualResponse).toStrictEqual([]);
  });
  it("returns correct member expression object(s)", () => {
    const testData = [
      {
        code: `function(){
        const test = Api1.data.test
        return "Favour"
      }`,
        propertyName: "test",
        expectedResponse: ["Api1.data"],
      },
      {
        code: `function(){
        const test = Api1.data.test;
        Button1.test;
        return "Favour"
      }`,
        propertyName: "test",
        expectedResponse: ["Api1.data", "Button1"],
      },
      {
        code: `function(){
        // const test = Api1.data.test
        return "Favour"
      }`,
        propertyName: "test",
        expectedResponse: [],
      },
      {
        code: `function(){
        const test = Api1.data.test.now
        return "Favour"
      }`,
        propertyName: "test",
        expectedResponse: ["Api1.data"],
      },
      {
        code: `function(){
        const test = Api1.data["test"]
        return "Favour"
      }`,
        propertyName: "test",
        expectedResponse: ["Api1.data"],
      },
    ];

    for (const testDatum of testData) {
      const actualResponse = getMemberExpressionObjectFromProperty(
        testDatum.propertyName,
        testDatum.code,
      );
      expect(actualResponse).toStrictEqual(testDatum.expectedResponse);
    }
  });
});
