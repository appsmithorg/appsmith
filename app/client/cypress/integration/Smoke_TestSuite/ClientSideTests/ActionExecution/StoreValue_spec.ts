import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { AggregateHelper: agHelper, JSEditor: jsEditor } = ObjectsRegistry;

describe("storeValue Action test", () => {
  before(() => {
    //
  });

  it("1. Running consecutive storeValue actions and await", function() {
    const jsObjectBody = `export default {
      myFun1: () => {
        let values =
          [
            storeValue('val1', 'number 1'),
            storeValue('val2', 'number 2'),
            storeValue('val3', 'number 3'),
            storeValue('val4', 'number 4')
          ]
        return Promise.all(values)
          .then(() => {	
            showAlert(JSON.stringify(appsmith.store))
        })
          .catch((err) => { 
            return showAlert('Could not store values in store ' + err.toString());
          })
      }
    }`;

    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    agHelper.AssertAutoSave();

    jsEditor.EditJSObj(jsObjectBody);

    agHelper.AssertAutoSave();

    // running twice due to bug
    Cypress._.times(2, () => {
      cy.get(jsEditor._runButton)
        .first()
        .click()
        .wait(3000);
    });

    agHelper.ValidateToastMessage(
      JSON.stringify({
        val1: "number 1",
        val2: "number 2",
        val3: "number 3",
        val4: "number 4",
      }),
      2,
    );
  });
});
