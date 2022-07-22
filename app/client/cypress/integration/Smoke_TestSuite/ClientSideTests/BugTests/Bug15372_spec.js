import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let jsEditor = ObjectsRegistry.JSEditor;

describe("[Bug]: Catch block was not triggering in Safari/firefox", () => {
  it("1. Triggers the catch block when the API hits a 404", () => {
    cy.NavigateToAPI_Panel();
    cy.createAndFillApi("https://swapi.dev/api/people/18261826");
    cy.wait(3000);

    jsEditor.CreateJSObject(
      `export default {
      fun: async () => {
        return await Api1.run().catch(() => showAlert("404 hit"));
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: true,
        shouldCreateNewJSObj: true,
      },
    );

    cy.validateToastMessage("fun ran successfully");
    cy.validateToastMessage("404 hit");
  });
});
