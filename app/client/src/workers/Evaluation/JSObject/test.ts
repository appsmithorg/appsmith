import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import { getUpdatedLocalUnEvalTreeAfterJSUpdates } from ".";

describe("updateJSCollectionInUnEvalTree", function () {
  it("updates async value of jsAction", () => {
    const jsUpdates = {
      JSObject1: {
        parsedBody: {
          body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t\n\t},\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}\n}",
          actions: [
            {
              name: "myFun1",
              body: "() => {}",
              arguments: [],
              isAsync: false,
            },
            {
              name: "myFun2",
              body: "() => {\n  yeso;\n}",
              arguments: [],
              isAsync: true,
            },
          ],
          variables: [
            {
              name: "myVar1",
              value: "[]",
            },
            {
              name: "myVar2",
              value: "{}",
            },
          ],
        },
        id: "64013546b956c26882acc587",
      },
    };
    const JSObject1Prototype = {
      actionId: "64013546b956c26882acc587",
      pluginType: "JS",
      ENTITY_TYPE: "JSACTION",
    };
    const JSObject1PrototypeConfig = {
      JSObject1: {
        meta: {
          myFun1: {
            arguments: [],
            isAsync: false,
            confirmBeforeExecute: false,
          },
          myFun2: {
            arguments: [],
            isAsync: false,
            confirmBeforeExecute: false,
          },
        },
        name: "JSObject1",
        pluginType: "JS",
        ENTITY_TYPE: "JSACTION",
        bindingPaths: {
          body: "SMART_SUBSTITUTE",
          myVar1: "SMART_SUBSTITUTE",
          myVar2: "SMART_SUBSTITUTE",
          myFun1: "SMART_SUBSTITUTE",
          myFun2: "SMART_SUBSTITUTE",
        },
        reactivePaths: {
          body: "SMART_SUBSTITUTE",
          myVar1: "SMART_SUBSTITUTE",
          myVar2: "SMART_SUBSTITUTE",
          myFun1: "SMART_SUBSTITUTE",
          myFun2: "SMART_SUBSTITUTE",
        },
        dynamicBindingPathList: [
          {
            key: "body",
          },
          {
            key: "myVar1",
          },
          {
            key: "myVar2",
          },
          {
            key: "myFun1",
          },
          {
            key: "myFun2",
          },
        ],
        variables: ["myVar1", "myVar2"],
        dependencyMap: {
          body: ["myFun1", "myFun2"],
        },
      },
    };
    const JSObject1 = {
      myVar1: "[]",
      myVar2: "{}",
      myFun1: new String("() => {}"),
      myFun2: new String("async () => {\n  yeso;\n}"),
      body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t\n\t},\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}\n}",
      ENTITY_TYPE: "JSACTION",
    };
    (JSObject1["myFun1"] as any).data = {};
    (JSObject1["myFun2"] as any).data = {};
    Object.setPrototypeOf(JSObject1, JSObject1Prototype);
    const localUnEvalTree = {
      JSObject1,
    } as unknown as DataTree;

    const actualResult = getUpdatedLocalUnEvalTreeAfterJSUpdates(
      jsUpdates,
      localUnEvalTree,
      JSObject1PrototypeConfig as unknown as ConfigTree,
    );

    const expectedJSObjectPrototype = {
      actionId: "64013546b956c26882acc587",
      pluginType: "JS",
      ENTITY_TYPE: "JSACTION",
    };
    const expectedJSObject = {
      myVar1: "[]",
      myVar2: "{}",
      myFun1: new String("() => {}"),
      myFun2: new String("() => {\n  yeso;\n}"),
      body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t\n\t},\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}\n}",
      ENTITY_TYPE: "JSACTION",
      variables: ["myVar1", "myVar2"],
    };
    (expectedJSObject["myFun1"] as any).data = {};
    (expectedJSObject["myFun2"] as any).data = {};
    Object.setPrototypeOf(expectedJSObject, expectedJSObjectPrototype);
    const expectedResult = {
      JSObject1: expectedJSObject,
    };

    expect(Object.getPrototypeOf(actualResult["JSObject1"])).toStrictEqual(
      Object.getPrototypeOf(expectedResult["JSObject1"]),
    );

    expect(expectedResult).toStrictEqual(actualResult);
  });
});
