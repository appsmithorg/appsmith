import { parse } from "acorn";
import { simple } from "acorn-walk";
import { addPropertiesToJSObjectCode } from ".";

describe("addPropertiesToJSObjectCode", () => {
  const parseAST = (code: string) =>
    parse(code, { sourceType: "module", ecmaVersion: 2020 });

  const findProperty = (properties: any[] | undefined, key: string) =>
    properties?.find((property) => property.key.name === key);

  it("should add new properties to the object", () => {
    const body = `
  export default {
    myVar1: [],
    myVar2: {},
    myFun1 () {
      // write code here
      // this.myVar1 = [1,2,3]
    },
    async myFun2 () {
      // use async-await or promises
      // await storeValue('varName', 'hello world')
    }
  }`;
    const obj = {
      inputs: "Module1.inputs",
      newProp: "42",
    };

    const result = addPropertiesToJSObjectCode(body, obj);

    const ast = parseAST(result);
    let properties;

    simple(ast, {
      ExportDefaultDeclaration(node) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        properties = node.declaration.properties;
      },
    });

    const inputsProperty = findProperty(properties, "inputs");
    const newPropProperty = findProperty(properties, "newProp");

    expect(inputsProperty).toBeDefined();
    expect(newPropProperty).toBeDefined();
    expect(inputsProperty.value.type).toBe("MemberExpression");
    expect(newPropProperty.value.value).toBe(42);
  });

  it("should replace existing properties", () => {
    const body = `
  export default {
    myVar1: [],
    myVar2: {},
    inputs: 'oldValue',
    myFun1 () {
      // write code here
      // this.myVar1 = [1,2,3]
    },
    async myFun2 () {
      // use async-await or promises
      // await storeValue('varName', 'hello world')
    }
  }`;
    const obj = {
      inputs: "Module1.inputs",
      myVar1: "[1, 2, 3]",
    };

    const result = addPropertiesToJSObjectCode(body, obj);

    const ast = parseAST(result);
    let properties;

    simple(ast, {
      ExportDefaultDeclaration(node) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        properties = node.declaration.properties;
      },
    });

    const inputsProperty = findProperty(properties, "inputs");
    const myVar1Property = findProperty(properties, "myVar1");

    expect(inputsProperty).toBeDefined();
    expect(myVar1Property).toBeDefined();
    expect(inputsProperty.value.type).toBe("MemberExpression");
    expect(myVar1Property.value.type).toBe("ArrayExpression");
    expect(
      myVar1Property.value.elements.map((e: { value: any }) => e.value),
    ).toEqual([1, 2, 3]);
  });

  it("should handle empty object input without errors", () => {
    const body = `export default {
    myVar1: [],
    myVar2: {},
    myFun1() {
    },
    async myFun2() {
    }
};`;
    const obj = {};

    const result = addPropertiesToJSObjectCode(body, obj);

    expect(result).toBe(body);
  });

  it("should handle empty string input without errors", () => {
    const body = ``;
    const obj = {
      inputs: "Module1.inputs",
    };

    const result = addPropertiesToJSObjectCode(body, obj);

    expect(result).toBe(body);
  });

  it("should handle missing export default declaration gracefully", () => {
    const body = `const myVar1 = [];
const myVar2 = {};
function myFun1() {
}
async function myFun2() {
}`;
    const obj = {
      inputs: "Module1.inputs",
    };

    const result = addPropertiesToJSObjectCode(body, obj);

    expect(result).toEqual(body);
  });
});
