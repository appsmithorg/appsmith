import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../locators/Widgets.json");

let queryName = "Query1";

import {
  agHelper,
  jsEditor,
  propPane,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";

/*
Cyclic Dependency Error if occurs, Message would be shown in following 6 cases:
1. On page load actions
2. When updating DSL attribute
3. When updating JS Object name
4. When updating Js Object content
5. When updating DSL name
6. When updating Datasource query
*/

let dsname;

describe(
  "Cyclic Dependency Informational Error Messages",
  { tags: ["@tag.PropertyPane", "@tag.JS", "@tag.Binding"] },
  function () {
    before(() => {
      //appId = localStorage.getItem("applicationId");
      //cy.log("appID:" + appId);
      agHelper.AddDsl("inputdsl");
    });

    it(
      "1. Create Users Sample DB Query & Simulate cyclic depedency",
      { tags: ["@tag.excludeForAirgap"] },
      () => {
        //Step1 : Create Mock Users DB
        dataSources.CreateMockDB("Users").then(() => {
          dataSources.CreateQueryAfterDSSaved();
          dataSources.ToggleUsePreparedStatement(false);
          dataSources.EnterQuery("SELECT * FROM users LIMIT 10");
        });
        PageLeftPane.switchSegment(PagePaneSegment.UI);
        cy.openPropertyPane("inputwidgetv2");
        cy.get(widgetsPage.defaultInput).type(
          "{{" + queryName + ".data[0].gender",
        );
        cy.widgetText(
          "gender",
          widgetsPage.inputWidget,
          widgetsPage.widgetNameSpan,
        );
        agHelper.AssertAutoSave();
      },
    );

    it(
      "airgap",
      "1. Create Users Sample DB Query & Simulate cyclic depedency - airgap",
      () => {
        //Step1 : Create postgres DB
        dataSources.CreateDataSource("Postgres");
        cy.get("@saveDatasource").then((httpResponse) => {
          dsname = httpResponse.response.body.data.name;
        });
        cy.wait(1000);
        dataSources.CreateQueryAfterDSSaved();
        dataSources.EnterQuery("SELECT * FROM users LIMIT 10");
        dataSources.ToggleUsePreparedStatement(false);
        PageLeftPane.switchSegment(PagePaneSegment.UI);
        cy.openPropertyPane("inputwidgetv2");
        cy.get(widgetsPage.defaultInput).type(
          "{{" + queryName + ".data[0].gender",
        );
        cy.widgetText(
          "gender",
          widgetsPage.inputWidget,
          widgetsPage.widgetNameSpan,
        );
        agHelper.AssertAutoSave();
      },
    );

    //Case 1: On page load actions
    it("2. Reload Page and it should not provide errors in response & update input widget's placeholder property and check errors array to be empty", () => {
      // cy.get(widgetsPage.NavHomePage).click({ force: true });
      cy.reload();
      cy.openPropertyPane("inputwidgetv2");
      cy.wait("@getConsolidatedData").should(
        "have.nested.property",
        "response.body.data.pageWithMigratedDsl.data.layouts[0].layoutOnLoadActionErrors.length",
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
    it("4. Update Widget Name and check for no errors & Update Query and check for errors", () => {
      let entityName = "gender";
      let newEntityName = "newInput";
      propPane.RenameWidget(entityName, newEntityName);
      cy.get("@updateWidgetName").should(
        "have.nested.property",
        "response.body.data.layoutOnLoadActionErrors.length",
        0,
      );

      // Case 6: When updating Datasource query
      EditorNavigation.SelectEntityByName(queryName, EntityType.Query);
      // update query and check no cyclic dependency issue should occur
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
  },
);
