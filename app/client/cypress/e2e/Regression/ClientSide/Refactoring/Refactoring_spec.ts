import {
  agHelper,
  apiPage,
  dataManager,
  dataSources,
  entityExplorer,
  entityItems,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Validate JS Object Refactoring does not affect the comments & variables",
  { tags: ["@tag.PropertyPane", "@tag.Binding"] },
  () => {
    let dsName: any;

    const jsCode = `//TextWidget, InputWidget, QueryRefactor and RefactorAPI are used
  let text = TextWidget.text;
  let input = InputWidget.text;
  let query = QueryRefactor.data;
  let api = RefactorAPI.data;
  console.log("InputWidget.text + TextWidget.text + QueryRefactor.data + RefactorAPI.data");
  return 10;`;
    const query =
      "SELECT * FROM paintings ORDER BY id LIMIT {{JSObject1.myFun1()}};";
    const refactorInput = {
      api: { oldName: "RefactorAPI", newName: "RefactorAPIRenamed" },
      query: { oldName: "QueryRefactor", newName: "QueryRefactorRenamed" },
      jsObject: { oldName: "JSObject1", newName: "JSObject1Renamed" },
      inputWidget: {
        oldName: "InputWidget",
        newName: "InputWidgetRenamed",
      },
      textWidget: {
        oldName: "TextWidget",
        newName: "TextWidgetRenamed",
      },
    };

    before(() => {
      agHelper.AddDsl("Datatypes/RefactorDTdsl");
      dataSources.CreateDataSource("MySql", true, false);
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        AppSidebar.navigate(AppSidebarButton.Editor);

        //Selecting paintings table from MySQL DS
        //Initialize new JSObject with custom code
        jsEditor.CreateJSObject(jsCode);
        //Initialize new Query entity with custom query
        dataSources.CreateQueryFromOverlay(
          dsName,
          query,
          refactorInput.query.oldName,
        ); //Creating query from EE overlay
        //Initialize new API entity with custom header
        apiPage.CreateAndFillApi(
          dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
          refactorInput.api.oldName,
        );
        apiPage.EnterHeader("key1", `{{\tJSObject1.myVar1}}`);
      });
    });

    it("1. Refactor Widget, API, Query and JSObject", () => {
      //Rename all widgets and entities
      propPane.RenameWidget(
        refactorInput.textWidget.oldName,
        refactorInput.textWidget.newName,
      );
      propPane.RenameWidget(
        refactorInput.inputWidget.oldName,
        refactorInput.inputWidget.newName,
      );
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      entityExplorer.RenameEntityFromExplorer(
        refactorInput.query.oldName,
        refactorInput.query.newName,
      );
      entityExplorer.RenameEntityFromExplorer(
        refactorInput.api.oldName,
        refactorInput.api.newName,
      );
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      entityExplorer.RenameEntityFromExplorer(
        refactorInput.jsObject.oldName,
        refactorInput.jsObject.newName,
      );
    });

    it("2. Verify refactoring updates in JS Object", () => {
      //Verify JSObject refactoring in API pane
      EditorNavigation.SelectEntityByName(
        refactorInput.api.newName,
        EntityType.Api,
      );
      agHelper.Sleep(1000);
      agHelper.GetNAssertContains(
        locators._editorVariable,
        refactorInput.jsObject.newName,
      );

      //Verify JSObject refactoring in Query pane
      EditorNavigation.SelectEntityByName(
        refactorInput.query.newName,
        EntityType.Query,
      );
      agHelper.Sleep(1000);
      agHelper.GetNAssertContains(
        locators._editorVariable,
        refactorInput.jsObject.newName,
      );

      //Verify TextWidget, InputWidget, QueryRefactor, RefactorAPI refactor
      //Verify Names in JS Object string shouldn't be updated
      EditorNavigation.SelectEntityByName(
        refactorInput.jsObject.newName,
        EntityType.JSObject,
      );
      agHelper.GetNAssertContains(
        locators._consoleString,
        refactorInput.textWidget.newName,
        "not.exist",
      );
      agHelper.GetNAssertContains(
        locators._consoleString,
        refactorInput.inputWidget.newName,
        "not.exist",
      );
      agHelper.GetNAssertContains(
        locators._consoleString,
        refactorInput.query.newName,
        "not.exist",
      );
      agHelper.GetNAssertContains(
        locators._consoleString,
        refactorInput.api.newName,
        "not.exist",
      );

      //Names in comment shouldn't be updated
      agHelper.GetNAssertContains(
        locators._commentString,
        refactorInput.textWidget.newName,
        "not.exist",
      );
      agHelper.GetNAssertContains(
        locators._commentString,
        refactorInput.inputWidget.newName,
        "not.exist",
      );
      agHelper.GetNAssertContains(
        locators._commentString,
        refactorInput.query.newName,
        "not.exist",
      );
      agHelper.GetNAssertContains(
        locators._commentString,
        refactorInput.api.newName,
        "not.exist",
      );

      //Variables reffered should be updated in JS Object
      agHelper.GetNAssertContains(
        locators._editorVariable,
        refactorInput.textWidget.newName,
      );
      agHelper.GetNAssertContains(
        locators._editorVariable,
        refactorInput.inputWidget.newName,
      );
      agHelper.GetNAssertContains(
        locators._editorVariable,
        refactorInput.query.newName,
      );
      agHelper.GetNAssertContains(
        locators._editorVariable,
        refactorInput.api.newName,
      );
    });

    after("Delete Mysql query, JSObject, API & Datasource", () => {
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "JSObject1Renamed",
        action: "Delete",
        entityType: entityItems.JSObject,
      });
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "QueryRefactorRenamed",
        action: "Delete",
        entityType: entityItems.Query,
      });
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "RefactorAPIRenamed",
        action: "Delete",
        entityType: entityItems.Api,
      });
      dataSources.DeleteDatasourceFromWithinDS(dsName, 200);
    });
  },
);
