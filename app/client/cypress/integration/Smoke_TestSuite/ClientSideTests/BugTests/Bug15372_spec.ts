import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  ApiPage: apiPage,
  JSEditor: jsEditor,
} = ObjectsRegistry;

describe("[Bug]: Catch block was not triggering in Safari/firefox", () => {
  it("1. Triggers the catch block when the API hits a 404", () => {
    apiPage.CreateAndFillApi("https://swapi.dev/api/people/18261826", "Api1");
    cy.wait(3000);

    jsEditor.CreateJSObject(
      `export default {
      fun: async () => {
        return await Api1.run().catch((e) => showAlert("404 hit : " + e.message));
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: true,
        shouldCreateNewJSObj: true,
      },
    );
    agHelper.WaitUntilToastDisappear("404 hit : Api1 failed to execute");
  });
});
