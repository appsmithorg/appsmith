import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Invalid page routing", () => {
  it("1. Bug #16047 - Shows Invalid URL UI for invalid JS Object page url", () => {
    const JS_OBJECT_BODY = `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {
            //write code here

        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`;
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    cy.url().then((url) => {
      const urlWithoutQueryParams = url.split("?")[0];
      const invalidURL = urlWithoutQueryParams + "invalid";
      cy.visit(invalidURL);
      agHelper.AssertContains(
        `The page you’re looking for either does not exist`,
        "exist",
      );
    });
  });
});
