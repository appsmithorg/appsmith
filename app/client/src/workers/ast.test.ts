import { extractIdentifiersFromCode, parseJSObjectWithAST } from "workers/ast";

describe("getAllIdentifiers", () => {
  it("works properly", () => {
    const cases: { script: string; expectedResults: string[] }[] = [
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
        expectedResults: ["Table5.data.map", "c.name"],
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
        expectedResults: ["Array[9]"],
      },
      {
        // Index identifier search
        script: "Table8.data[row][name]",
        expectedResults: ["Table8.data", "row", "name"],
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
    ];

    cases.forEach((perCase) => {
      const references = extractIdentifiersFromCode(perCase.script);
      expect(references).toStrictEqual(perCase.expectedResults);
    });
  });
});

describe("parseJSObjectWithAST", () => {
  it("parse js object", () => {
    const body = `{
	myVar1: [],
	myVar2: {},
	myFun1: () => {
		//write code here
	},
	myFun2: async () => {
		//use async-await or promises
	}
}`;
    const parsedObject = [
      {
        key: "myVar1",
        value: "[]",
        type: "ArrayExpression",
      },
      {
        key: "myVar2",
        value: "{}",
        type: "ObjectExpression",
      },
      {
        key: "myFun1",
        value: "() => {}",
        type: "ArrowFunctionExpression",
        arguments: [],
      },
      {
        key: "myFun2",
        value: "async () => {}",
        type: "ArrowFunctionExpression",
        arguments: [],
      },
    ];
    const resultParsedObject = parseJSObjectWithAST(body);
    expect(resultParsedObject).toStrictEqual(parsedObject);
  });

  it("parse js object with literal", () => {
    const body = `{
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
    const parsedObject = [
      {
        key: "myVar1",
        value: "[]",
        type: "ArrayExpression",
      },
      {
        key: "myVar2",
        value: '{\n  "a": "app"\n}',
        type: "ObjectExpression",
      },
      {
        key: "myFun1",
        value: "() => {}",
        type: "ArrowFunctionExpression",
        arguments: [],
      },
      {
        key: "myFun2",
        value: "async () => {}",
        type: "ArrowFunctionExpression",
        arguments: [],
      },
    ];
    const resultParsedObject = parseJSObjectWithAST(body);
    expect(resultParsedObject).toStrictEqual(parsedObject);
  });

  it("parse js object with variable declaration inside function", () => {
    const body = `{
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
    const parsedObject = [
      {
        key: "myFun1",
        value: `() => {
  const a = {
    conditions: [],
    requires: 1,
    testFunc: () => {},
    testFunc2: function () {}
  };
}`,
        type: "ArrowFunctionExpression",
        arguments: [],
      },
      {
        key: "myFun2",
        value: "async () => {}",
        type: "ArrowFunctionExpression",
        arguments: [],
      },
    ];
    const resultParsedObject = parseJSObjectWithAST(body);
    expect(resultParsedObject).toStrictEqual(parsedObject);
  });

  it("parse js object with params of all types", () => {
    const body = `{
      myFun2: async (a,b = Array(1,2,3),c = "", d = [], e = this.myVar1, f = {}, g = function(){}, h = Object.assign({}), i = String(), j = storeValue()) => {
        //use async-await or promises
      },
    }`;

    const parsedObject = [
      {
        key: "myFun2",
        value:
          'async (a, b = Array(1, 2, 3), c = "", d = [], e = this.myVar1, f = {}, g = function () {}, h = Object.assign({}), i = String(), j = storeValue()) => {}',
        type: "ArrowFunctionExpression",
        arguments: [
          {
            paramName: "a",
            defaultValue: undefined,
          },
          {
            paramName: "b",
            defaultValue: undefined,
          },
          {
            paramName: "c",
            defaultValue: undefined,
          },
          {
            paramName: "d",
            defaultValue: undefined,
          },
          {
            paramName: "e",
            defaultValue: undefined,
          },
          {
            paramName: "f",
            defaultValue: undefined,
          },
          {
            paramName: "g",
            defaultValue: undefined,
          },
          {
            paramName: "h",
            defaultValue: undefined,
          },
          {
            paramName: "i",
            defaultValue: undefined,
          },
          {
            paramName: "j",
            defaultValue: undefined,
          },
        ],
      },
    ];
    const resultParsedObject = parseJSObjectWithAST(body);
    expect(resultParsedObject).toEqual(parsedObject);
  });
});
