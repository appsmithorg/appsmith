import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let jsEditor = ObjectsRegistry.JSEditor;

describe("JSEditor Indendation - Visual tests", () => {
  // for any changes in UI, update the screenshot in snapshot folder, to do so:
  //  1. Delete the required screenshot which you want to update.
  //  2. Run test in headless mode with any browser except chrome.(to maintain same resolution in CI)
  //  3. New screenshot will be generated in the snapshot folder.

  it("JSEditor validation for Prettify Code with lint errors", () => {
    jsEditor.CreateJSObject(
      `let allFuncs = [Genderize.run({ country: 'India' }),
    RandomUser.run(),
    GetAnime.run({ name: 'Gintama' }),
    InspiringQuotes.run(),
    Agify.run({ person: 'Scripty' }),
    Christmas.run()
    ]
    showAlert("Running all api's", "warning");
    return Promise.all(allFuncs).then(() =>
    showAlert("Wonderful! all apis executed", "success")).catch(() => showAlert("Please check your api's again", "error")); `,
      true,
      false,
      false,
    );

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify1");
    cy.get(".t--more-action-menu")
      .first()
      .click();
    cy.contains("Prettify Code")
      .trigger("click")
      .wait(3000); //allowing time to prettify!

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify1");

    cy.get(".t--more-action-menu")
      .first()
      .click();
    cy.contains("Prettify Code")
      .trigger("click")
      .wait(3000); //allowing time to prettify!
    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify2");
  });
});
