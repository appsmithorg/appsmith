import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let jsEditor = ObjectsRegistry.JSEditor;

describe("JSEditor Indendation - Visual tests", () => {
  // for any changes in UI, update the screenshot in snapshot folder, to do so:
  //  1. Delete the required screenshot which you want to update.
  //  2. Run test in headless mode with any browser except chrome.(to maintain same resolution in CI)
  //  3. New screenshot will be generated in the snapshot folder.

  it("1. JSEditor validation for Prettify Code with lint errors", () => {
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
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify1");
    cy.get(".t--more-action-menu")
      .first()
      .click();
    cy.contains("Prettify Code")
      .trigger("click")
      .wait(3000); //allowing time to prettify!

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify1");
    cy.get("div.CodeMirror").not.matchImageSnapshot("jsObjBeforePrettify1");
  });

  it("2. JSEditor validation for Prettify Code with no errors", () => {
    jsEditor.CreateJSObject(
      `console.log("hi");
console.log("hidchjvxz sd,bcjmsd");
let sum = 0;
for (let i = 1; i<5; i++) {
sum += i;
}
switch (sum) {
case 1: console.log('hey ho');
let sum1 = 2;
break;
case 2:
console.log('hey ho');
let sum2 = 2;
break;
case 3:
 console.log('hey ho');
 break;
}
function hi(a,b) {
console.log(a,b);
}
hi(1,2);
`,
      {
        paste: false,
        completeReplace: false,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforePrettify2");
    cy.get(".t--more-action-menu")
      .first()
      .click();
    cy.contains("Prettify Code")
      .trigger("click")
      .wait(3000); //allowing time to prettify!

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterPrettify2");
    cy.get("div.CodeMirror").not.matchImageSnapshot("jsObjBeforePrettify2");
  });
});
