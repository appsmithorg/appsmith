import { JSAction } from "entities/JSCollection";
import { uniqueId } from "lodash";
import { NO_FUNCTION_DROPDOWN_OPTION } from "./constants";
import {
  convertJSActionToDropdownOption,
  getJSActionOption,
  getJSFunctionStartLineFromCode,
  isCursorWithinNode,
} from "./utils";

const BASE_JS_OBJECT_BODY = `export default {
	myVar1: [],
	myVar2: {},
	myFun1: () => {
		//write code here
		return FilePicker1
	},
	myFun2: async () => {
		//use async-await or promises
		await Api3.run()
		await Api3.run()
		return Api3.data
	}	
}`;

const BASE_JS_OBJECT_BODY_WITH_LITERALS = `export default {
	myVar1: [],
	myVar2: {},
	["myFun1"]: () => {
		//write code here
		return FilePicker1
	},
	["myFun2"]: async () => {
		//use async-await or promises
		await Api3.run()
		await Api3.run()
		return Api3.data
	}	
}`;

const BASE_JS_ACTION = (useLiterals = false) => {
  return {
    workspaceId: "workspace-id",
    pageId: "page-id",
    collectionId: "collection-id",
    pluginId: "plugin-id",
    executeOnLoad: false,
    dynamicBindingPathList: [],
    isValid: false,
    invalids: [],
    jsonPathKeys: [],
    cacheResponse: "",
    confirmBeforeExecute: false,
    messages: [],
    clientSideExecution: false,
    actionConfiguration: {
      body: useLiterals
        ? BASE_JS_OBJECT_BODY_WITH_LITERALS
        : BASE_JS_OBJECT_BODY,
      isAsync: true,
      timeoutInMillisecond: 1000,
      jsArguments: [],
    },
  };
};

const createJSAction = (name: string, useLiterals = false): JSAction => {
  return {
    ...BASE_JS_ACTION(useLiterals),
    id: uniqueId(name),
    name,
  };
};

describe("getJSFunctionStartLineFromCode", () => {
  it("returns null when cursor isn't within any function", () => {
    const actualResponse = getJSFunctionStartLineFromCode(
      BASE_JS_OBJECT_BODY,
      100,
    );

    const expectedResponse = null;

    expect(actualResponse).toStrictEqual(expectedResponse);
  });

  it("returns correct start line of function", () => {
    const actualResponse1 = getJSFunctionStartLineFromCode(
      BASE_JS_OBJECT_BODY,
      4,
    );
    const actualResponse2 = getJSFunctionStartLineFromCode(
      BASE_JS_OBJECT_BODY,
      9,
    );
    const expectedStartLine1 = 3; // startLine of myFun1
    const expectedStartLine2 = 7; // startLine of myFun2

    expect(actualResponse1?.line).toStrictEqual(expectedStartLine1);
    expect(actualResponse2?.line).toStrictEqual(expectedStartLine2);
  });

  it("returns correct start line of function when object keys are literals", () => {
    const actualResponse1 = getJSFunctionStartLineFromCode(
      BASE_JS_OBJECT_BODY_WITH_LITERALS,
      4,
    );
    const actualResponse2 = getJSFunctionStartLineFromCode(
      BASE_JS_OBJECT_BODY_WITH_LITERALS,
      9,
    );
    const expectedStartLine1 = 3; // startLine of myFun1
    const expectedStartLine2 = 7; // startLine of myFun2

    expect(actualResponse1?.line).toStrictEqual(expectedStartLine1);
    expect(actualResponse2?.line).toStrictEqual(expectedStartLine2);
  });

  it("isCursorWithinNode returns correct value", () => {
    const cursorLineNumber = 2;
    const testNodeLocation1 = {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 6, column: 1, offset: 0 },
    };
    const testNodeLocation2 = {
      start: { line: 4, column: 1, offset: 0 },
      end: { line: 6, column: 1, offset: 0 },
    };

    const actualResponse1 = isCursorWithinNode(
      testNodeLocation1,
      cursorLineNumber,
    );
    const actualResponse2 = isCursorWithinNode(
      testNodeLocation2,
      cursorLineNumber,
    );

    expect(actualResponse1).toBeTruthy();
    expect(actualResponse2).toBeFalsy();
  });
});

describe("jsAction dropdown", () => {
  const jsActions = [
    createJSAction("myFun1"),
    createJSAction("myFun2"),
    createJSAction("myFun3"),
  ];

  it("getJSActionOption returns active JS Action on priority", () => {
    const activeJSAction = jsActions[0];
    const actualResponse = getJSActionOption(activeJSAction, jsActions);
    const expectedResponse = convertJSActionToDropdownOption(activeJSAction);
    expect(actualResponse).toEqual(expectedResponse);
  });

  it("getJSActionOption returns default option when there is no jsAction present", () => {
    const activeJSAction = null;
    const actualResponse = getJSActionOption(activeJSAction, []);
    const expectedResponse = NO_FUNCTION_DROPDOWN_OPTION;
    expect(actualResponse).toEqual(expectedResponse);
  });
});
