import {
  agHelper,
  apiPage,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  jsEditor,
  locators,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

let jsName: any, dsName: any;

describe(
  "Bug #10784 - Passing params from JS to SQL query should not break",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 100, 100);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 500, 100);
      propPane.EnterJSContext(
        "Source Data",
        `[\n  {\n    \"label\": \"7\",\n    \"value\": \"7\"\n  },\n  {\n    \"label\": \"8\",\n    \"value\": \"8\"\n  },\n  {\n    \"label\": \"9\",\n    \"value\": \"9\"\n  }\n]`,
      );

      propPane.EnterJSContext("Label key", "label");
      propPane.EnterJSContext("Value key", "value");

      propPane.UpdatePropertyFieldValue(
        "Default selected value",
        `{\n    \"label\": \"8\",\n    \"value\": \"8\"\n  }`,
      );
      propPane.RenameWidget("Select1", "selRecordFilter");
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 500, 300);
    });

    it("1.{{ this?.params?.condition }}", function () {
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateQueryAfterDSSaved(
          "SELECT * FROM public.users where id = {{this?.params?.condition || '1=1'}} order by id",
          "ParamsTest",
        );
      });

      jsEditor.CreateJSObject(
        'ParamsTest.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
        {
          paste: true,
          completeReplace: false,
          toRun: false,
          shouldCreateNewJSObj: true,
        },
      );

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      cy.get("@jsObjName").then((jsObjName) => {
        jsName = jsObjName;
        propPane.SelectJSFunctionToExecute(
          "onClick",
          jsName as string,
          "myFun1",
        );
      });
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.EnterJSContext("Table data", "{{ParamsTest.data}}");

      EditorNavigation.SelectEntityByName("ParamsTest", EntityType.Query);
      apiPage.ToggleOnPageLoadRun(false); //Bug 12476

      deployMode.DeployApp(locators._buttonByText("Submit"));
      agHelper.SelectDropDown("7");
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkExecutionSuccess("@postExecute");
      table.ReadTableRowColumnData(0, 0, "v2", 3000).then((cellData) => {
        expect(cellData).to.be.equal("7");
      });
    });

    it("2.{{ (function() { return this?.params?.condition })() }}", function () {
      deployMode.NavigateBacktoEditor();
      agHelper.Sleep(500);
      EditorNavigation.SelectEntityByName("ParamsTest", EntityType.Query);
      dataSources.EnterQuery(
        "SELECT * FROM public.users where id = {{(function() { return this?.params?.condition })() || '1=1'}} order by id",
      );
      deployMode.DeployApp(locators._buttonByText("Submit"));
      agHelper.SelectDropDown("9");
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkExecutionSuccess("@postExecute");
      table.ReadTableRowColumnData(0, 0, "v2", 3000).then((cellData) => {
        expect(cellData).to.be.equal("9");
      });
    });

    it("3.{{ (() => { return this?.params?.condition })() }}", function () {
      deployMode.NavigateBacktoEditor();
      agHelper.Sleep(500);
      EditorNavigation.SelectEntityByName("ParamsTest", EntityType.Query);
      dataSources.EnterQuery(
        "SELECT * FROM public.users where id = {{(() => { return this?.params?.condition })() || '1=1'}} order by id",
      );
      deployMode.DeployApp(locators._buttonByText("Submit"));
      agHelper.SelectDropDown("7");
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkExecutionSuccess("@postExecute");
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
        expect(cellData).to.be.equal("7");
      });
    });

    it("4.{{ this?.params.condition }}", function () {
      deployMode.NavigateBacktoEditor();
      agHelper.Sleep(500);
      EditorNavigation.SelectEntityByName("ParamsTest", EntityType.Query);
      dataSources.EnterQuery(
        "SELECT * FROM public.users where id = {{this?.params.condition || '1=1'}} order by id",
      );
      deployMode.DeployApp(locators._buttonByText("Submit"));
      agHelper.SelectDropDown("9");
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkExecutionSuccess("@postExecute");
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
        expect(cellData).to.be.equal("9");
      });
    });

    it("5.{{ (function() { return this?.params.condition })() }}", function () {
      deployMode.NavigateBacktoEditor();
      agHelper.Sleep(500);
      EditorNavigation.SelectEntityByName("ParamsTest", EntityType.Query);
      dataSources.EnterQuery(
        "SELECT * FROM public.users where id = {{(function() { return this?.params.condition })() || '1=1'}} order by id",
      );
      deployMode.DeployApp(locators._buttonByText("Submit"));
      agHelper.SelectDropDown("7");
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkExecutionSuccess("@postExecute");
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
        expect(cellData).to.be.equal("7");
      });
    });

    it("6.{{ (() => { return this?.params.condition })() }}", function () {
      deployMode.NavigateBacktoEditor();
      agHelper.Sleep(500);
      EditorNavigation.SelectEntityByName("ParamsTest", EntityType.Query);
      dataSources.EnterQuery(
        "SELECT * FROM public.users where id = {{(() => { return this?.params.condition })() || '1=1'}} order by id",
      );
      deployMode.DeployApp(locators._buttonByText("Submit"));
      agHelper.SelectDropDown("9");
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkExecutionSuccess("@postExecute");
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
        expect(cellData).to.be.equal("9");
      });
    });

    it("7. With No Optional chaining : {{ this.params.condition }}", function () {
      deployMode.NavigateBacktoEditor();
      agHelper.Sleep(500);
      EditorNavigation.SelectEntityByName("ParamsTest", EntityType.Query);
      dataSources.EnterQuery(
        "SELECT * FROM public.users where id = {{this.params.condition || '1=1'}} order by id",
      );
      deployMode.DeployApp(locators._buttonByText("Submit"));
      agHelper.SelectDropDown("7");
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkExecutionSuccess("@postExecute");
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
        expect(cellData).to.be.equal("7");
      });
    });

    it("8. With No Optional chaining : {{ (function() { return this.params.condition })() }}", function () {
      deployMode.NavigateBacktoEditor();
      agHelper.Sleep(500);
      EditorNavigation.SelectEntityByName("ParamsTest", EntityType.Query);
      dataSources.EnterQuery(
        "SELECT * FROM public.users where id = {{(function() { return this.params.condition })() || '1=1'}} order by id",
      );
      deployMode.DeployApp(locators._buttonByText("Submit"));
      agHelper.SelectDropDown("8");
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkExecutionSuccess("@postExecute");
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
        expect(cellData).to.be.equal("8");
      });
    });

    it("9. With No Optional chaining : {{ (() => { return this.params.condition })() }}", function () {
      deployMode.NavigateBacktoEditor();
      agHelper.Sleep(500);
      EditorNavigation.SelectEntityByName("ParamsTest", EntityType.Query);
      dataSources.EnterQuery(
        "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '1=1'}} order by id",
      );
      deployMode.DeployApp(locators._buttonByText("Submit"));
      agHelper.SelectDropDown("9");
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkExecutionSuccess("@postExecute");
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
        expect(cellData).to.be.equal("9");
      });
    });

    it("10.{{ this.params.condition }} && direct paramter passed", function () {
      deployMode.NavigateBacktoEditor();
      agHelper.Sleep(500);
      EditorNavigation.SelectEntityByName("ParamsTest", EntityType.Query);
      dataSources.EnterQuery(
        "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '7'}} order by id",
      );

      deployMode.DeployApp(locators._buttonByText("Submit"));
      //Verifh when No selected option passed
      cy.xpath(locators._selectWidgetDropdownInDeployed("selectwidget")).within(
        () => cy.get(locators._crossBtn).click(),
      );
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkExecutionSuccess("@postExecute");
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
        expect(cellData).to.be.equal("7");
      });
    });

    it("11.{{ this.params.condition }} && no optional paramter passed", function () {
      deployMode.NavigateBacktoEditor();
      agHelper.Sleep(500);
      EditorNavigation.SelectEntityByName("ParamsTest", EntityType.Query);
      dataSources.EnterQuery(
        "SELECT * FROM public.users where id = {{(() => { return this.params.condition })()}} order by id",
      );
      deployMode.DeployApp(locators._buttonByText("Submit"));
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkExecutionSuccess("@postExecute");
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
        expect(cellData).to.be.equal("8");
      });
    });

    it("12. Delete all entities - Query, JSObjects, Datasource + Bug 12532", () => {
      deployMode.NavigateBacktoEditor();
      //agHelper.Sleep(2500);
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "ParamsTest",
        action: "Delete",
        entityType: entityItems.Query,
      });
      assertHelper.AssertNetworkStatus("@deleteAction", 200);
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: jsName as string,
        action: "Delete",
        entityType: entityItems.JSObject,
      });
      // //Bug 12532
      // entityExplorer.ExpandCollapseEntity('Datasources')
      // entityExplorer.ActionContextMenuByEntityName(dsName, 'Delete', 'Are you sure?')
      // assertHelper.AssertNetworkStatus("@deleteAction", 200)
    });
  },
);
