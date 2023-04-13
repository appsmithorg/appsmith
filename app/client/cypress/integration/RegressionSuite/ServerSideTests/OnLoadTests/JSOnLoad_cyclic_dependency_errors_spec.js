const dsl = require("../../../../fixtures/inputdsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const queryLocators = require("../../../../locators/QueryEditor.json");

let queryName = "Query1";
import * as _ from "../../../../support/Objects/ObjectsCore";

/*
Cyclic Dependency Error if occurs, Message would be shown in following 6 cases:
1. On page load actions
2. When updating DSL attribute
3. When updating JS Object name
4. When updating Js Object content
5. When updating DSL name
6. When updating Datasource query
*/

describe("Cyclic Dependency Informational Error Messages", function () {
  before(() => {
    //appId = localStorage.getItem("applicationId");
    //cy.log("appID:" + appId);
    cy.addDsl(dsl);
    cy.wait(3000); //dsl to settle!
  });

  it("1. Create Users Sample DB Query & Simulate cyclic depedency", () => {
    //Step1 : Create Mock Users DB
    _.dataSources.CreateMockDB("Users").then((dbName) => {
      _.dataSources.CreateQueryFromActiveTab(dbName, false);
      _.agHelper.GetNClick(_.dataSources._templateMenuOption("Select"));
      _.dataSources.ToggleUsePreparedStatement(false);
    });
    cy.get(widgetsPage.widgetSwitchId).click();
    cy.openPropertyPane("inputwidgetv2");
    cy.get(widgetsPage.defaultInput).type("{{" + queryName + ".data[0].gender");
    cy.widgetText(
      "gender",
      widgetsPage.inputWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.assertPageSave();
  });

  //Case 1: On page load actions
  it("2. Reload Page and it should not provide errors in response & update input widget's placeholder property and check errors array to be empty", () => {
    // cy.get(widgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.openPropertyPane("inputwidgetv2");
    cy.wait("@getPage").should(
      "have.nested.property",
      "response.body.data.layouts[0].layoutOnLoadActionErrors.length",
      0,
    );

    // Case 2: When updating DSL attribute
    cy.get(widgetsPage.placeholder).type("cyclic placeholder");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.data.layoutOnLoadActionErrors.length",
      0,
    );
  });

  it("3. Add JSObject and update its name, content and check for no errors", () => {
    // Case 3: When updating JS Object name
    _.jsEditor.CreateJSObject(
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
    _.jsEditor.RenameJSObjFromPane("newName");

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
    _.jsEditor.EditJSObj(syncJSCode, false);

    cy.wait("@jsCollections").should(
      "have.nested.property",
      "response.body.data.errorReports.length",
      0,
    );
  });

  // Case 5: When updating DSL name
  it("4. Update Widget Name and check for no errors & Update Query and check for errors", () => {
    let entityName = "gender";
    let newEntityName = "newInput";
    _.entityExplorer.SelectEntityByName(entityName, "Widgets");
    _.agHelper.RenameWidget(entityName, newEntityName);
    cy.wait("@updateWidgetName").should(
      "have.nested.property",
      "response.body.data.layoutOnLoadActionErrors.length",
      0,
    );

    // Case 6: When updating Datasource query
    _.entityExplorer.SelectEntityByName(queryName, "Queries/JS");
    // update query and check no cyclic dependency issue should occur
    cy.get(queryLocators.query).click({ force: true });
    cy.get(".CodeMirror textarea").first().focus().type(" ", {
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
