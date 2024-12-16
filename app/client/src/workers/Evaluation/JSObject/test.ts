import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeTypes";
import {
  getUpdatedLocalUnEvalTreeAfterJSUpdates,
  saveResolvedFunctionsAndJSUpdates,
} from ".";
import type { JSUpdate } from "utils/JSPaneUtils";
import type {
  JSActionEntity,
  JSActionEntityConfig,
} from "ee/entities/DataTree/types";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";

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
            },
            {
              name: "myFun2",
              body: "() => {\n  yeso;\n}",
              arguments: [],
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
    const JSObject1Config = {
      JSObject1: {
        actionId: "64013546b956c26882acc587",
        meta: {
          myFun1: {
            arguments: [],

            confirmBeforeExecute: false,
          },
          myFun2: {
            arguments: [],

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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (JSObject1["myFun1"] as any).data = {};
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (JSObject1["myFun2"] as any).data = {};

    const localUnEvalTree = {
      JSObject1,
    } as unknown as UnEvalTree;

    const actualResult = getUpdatedLocalUnEvalTreeAfterJSUpdates(
      jsUpdates,
      localUnEvalTree,
      JSObject1Config as unknown as ConfigTree,
    );

    const expectedJSObject = {
      myVar1: "[]",
      myVar2: "{}",
      myFun1: new String("() => {}"),
      myFun2: new String("() => {\n  yeso;\n}"),
      body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t\n\t},\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}\n}",
      ENTITY_TYPE: "JSACTION",
    };

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (expectedJSObject["myFun1"] as any).data = {};
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (expectedJSObject["myFun2"] as any).data = {};

    const expectedResult = {
      JSObject1: expectedJSObject,
    };

    expect(expectedResult).toStrictEqual(actualResult);
  });
});

describe("saveResolvedFunctionsAndJSUpdates", function () {
  it("parses JSObject with duplicate actions, variables and updates jsUpdates correctly", () => {
    const dataTreeEvalRef = new DataTreeEvaluator({});
    const entity: JSActionEntity = {
      actionId: "64013546b956c26882acc587",
      body: "export default {\n\tmyVar1: [],\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t\n\t},\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}\n,\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}}",
      ENTITY_TYPE: "JSACTION",
      name: "JSObject1",
      pluginType: "JS",
    };
    const jsUpdates: Record<string, JSUpdate> = {};
    const unEvalDataTree: UnEvalTree = {
      JSObject1: {
        myVar1: "[]",
        myVar2: "{}",
        myFun1: new String("() => {}"),
        myFun2: new String("async () => {\n  yeso;\n}"),
        body: "export default {\n\tmyVar1: [],\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t\n\t},\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}\n,\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}}",
        ENTITY_TYPE: "JSACTION",
        meta: {
          myFun1: {
            arguments: [],
            confirmBeforeExecute: false,
          },
          myFun2: {
            arguments: [],
            confirmBeforeExecute: false,
          },
        },
        dependencyMap: {
          body: ["myFun1", "myFun2"],
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
        pluginType: "JS",
        name: "JSObject1",
        actionId: "64013546b956c26882acc587",
        actionNames: new Set(["myFun1", "myFun2"]),
      } as JSActionEntityConfig,
    };
    const entityName = "JSObject1";

    const result = saveResolvedFunctionsAndJSUpdates(
      dataTreeEvalRef,
      entity,
      jsUpdates,
      unEvalDataTree,
      entityName,
    );

    const expectedJSUpdates = {
      JSObject1: {
        parsedBody: {
          body: "export default {\n\tmyVar1: [],\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t\n\t},\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}\n,\n\tmyFun2:  () => {\n\t\t//use async-await or promises\n\t\tyeso\n\t}}",
          actions: [
            {
              name: "myFun1",
              body: "() => {}",
              arguments: [],
            },
            {
              name: "myFun2",
              body: "() => {\n  yeso;\n}",
              arguments: [],
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

    expect(result).toStrictEqual(expectedJSUpdates);
  });
});
