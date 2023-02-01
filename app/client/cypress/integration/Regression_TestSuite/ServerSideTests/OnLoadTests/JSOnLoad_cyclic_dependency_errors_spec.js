import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dsl = require("../../../../fixtures/inputdsl.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const jsEditor = ObjectsRegistry.JSEditor;
const ee = ObjectsRegistry.EntityExplorer;
const agHelper = ObjectsRegistry.AggregateHelper;
const canvasHelper = ObjectsRegistry.CanvasHelper;
let queryName;

/*
Cyclic Dependency Error if occurs, Message would be shown in following 6 cases:
1. On page load actions
2. When updating DSL attribute
3. When updating JS Object name
4. When updating Js Object content
5. When updating DSL name
6. When updating Datasource query
*/

describe("Cyclic Dependency Informational Error Messages", function() {
  before(() => {
    //appId = localStorage.getItem("applicationId");
    //cy.log("appID:" + appId);
    cy.addDsl(dsl);
    cy.wait(3000); //dsl to settle!
  });

  it("1. Create Users Sample DB & Sample DB Query", () => {
    //Step1
    cy.wait(2000);
    cy.NavigateToDatasourceEditor();

    //Step2
    cy.get(datasource.mockUserDatabase).click();

    //Step3 & 4
    cy.contains(`${datasource.datasourceCard}`, "Users")
      .last()
      .find(`${datasource.createQuery}`)
      .click({ force: true });

    //Step5.1: Click the editing field
    cy.get(".t--action-name-edit-field").click({ force: true });

    cy.generateUUID().then((uid) => {
      queryName = "query" + uid;
      //Step5.2: Click the editing field
      cy.get(queryLocators.queryNameField).type(queryName);

      // switching off Use Prepared Statement toggle
      cy.get(queryLocators.switch)
        .last()
        .click({ force: true });

      //Step 6.1: Click on Write query area
      cy.get(queryLocators.templateMenu).click();
      cy.get(queryLocators.query).click({ force: true });

      // Step6.2: writing query to get the schema
      cy.get(".CodeMirror textarea")
        .first()
        .focus()
        .type("SELECT gender FROM users ORDER BY id LIMIT 10;", {
          force: true,
          parseSpecialCharSequences: false,
        });
      cy.WaitAutoSave();
    });
  });

  // Step 1: simulate cyclic depedency
  it("2. Create Input Widget & Bind Input Widget Default text to Query Created", () => {
    canvasHelper.OpenWidgetPane();
    cy.openPropertyPane("inputwidgetv2");
    cy.get(widgetsPage.defaultInput).type("{{" + queryName + ".data[0].gender");
    cy.widgetText("gender", widgetsPage.inputWidget, widgetsPage.inputval);
    cy.assertPageSave();
  });

  //Case 1: On page load actions
  it("3. Reload Page and it should not provide errors in response", () => {
    // cy.get(widgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.openPropertyPane("inputwidgetv2");
    cy.wait("@getPage").should(
      "have.nested.property",
      "response.body.data.layouts[0].layoutOnLoadActionErrors.length",
      0,
    );
  });

  it("4. update input widget's placeholder property and check errors array to be empty", () => {
    // Case 2: When updating DSL attribute
    cy.get(widgetsPage.placeholder).type("cyclic placeholder");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.data.layoutOnLoadActionErrors.length",
      0,
    );
  });

  it("5. Add JSObject and update its name, content and check for no errors", () => {
    // Case 3: When updating JS Object name
    jsEditor.CreateJSObject(
      `export default {
      fun: async () => {
        showAlert("New Js Object");
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: true,
        shouldCreateNewJSObj: true,
      },
    );
    jsEditor.RenameJSObjFromPane("newName");

    cy.wait("@renameJsAction").should(
      "have.nested.property",
      "response.body.data.layoutOnLoadActionErrors.length",
      0,
    );

    // Case 4: When updating Js Object content
    const syncJSCode = `export default {
      asyncToSync : ()=>{
        return "yes";
      }
    }`;
    jsEditor.EditJSObj(syncJSCode, false);

    cy.wait("@jsCollections").should(
      "have.nested.property",
      "response.body.data.errorReports.length",
      0,
    );
  });

  // Case 5: When updating DSL name
  it("6. Update Widget Name and check for no errors", () => {
    let entityName = "gender";
    let newEntityName = "newInput";
    ee.SelectEntityByName(entityName, "Widgets");
    agHelper.RenameWidget(entityName, newEntityName);
    cy.wait("@updateWidgetName").should(
      "have.nested.property",
      "response.body.data.layoutOnLoadActionErrors.length",
      0,
    );
  });

  // Case 6: When updating Datasource query
  it("7. Update Query and check for errors", () => {
    ee.SelectEntityByName(queryName, "Queries/JS");
    // update query and check no cyclic dependency issue should occur
    cy.get(queryLocators.query).click({ force: true });
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(" ", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.wait("@saveAction").should(
      "have.nested.property",
      "response.body.data.errorReports.length",
      0,
    );
  });
});
