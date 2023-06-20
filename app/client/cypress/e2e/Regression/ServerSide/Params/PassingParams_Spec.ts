import {
  agHelper,
  locators,
  entityExplorer,
  jsEditor,
  propPane,
  deployMode,
  apiPage,
  dataSources,
  table,
  draggableWidgets,
  entityItems,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";
let jsName: any, dsName: any;

describe("Bug #10784 - Passing params from JS to SQL query should not break", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 100, 100);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 500, 100);
    propPane.UpdatePropertyFieldValue(
      "Options",
      `[\n  {\n    \"label\": \"7\",\n    \"value\": \"7\"\n  },\n  {\n    \"label\": \"8\",\n    \"value\": \"8\"\n  },\n  {\n    \"label\": \"9\",\n    \"value\": \"9\"\n  }\n]`,
    );
    propPane.UpdatePropertyFieldValue(
      "Default selected value",
      `{\n    \"label\": \"8\",\n    \"value\": \"8\"\n  }`,
    );
    propPane.RenameWidget("Select1", "selRecordFilter");
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 500, 300);
    entityExplorer.NavigateToSwitcher("Explorer");
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

    entityExplorer.SelectEntityByName("Button1", "Widgets");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      propPane.SelectJSFunctionToExecute("onClick", jsName as string, "myFun1");
    });
    entityExplorer.SelectEntityByName("Table1");
    propPane.EnterJSContext("Table data", "{{ParamsTest.data}}");

    entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    apiPage.ToggleOnPageLoadRun(false); //Bug 12476

    deployMode.DeployApp(locators._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, "v2", 3000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("2.{{ (function() { return this?.params?.condition })() }}", function () {
    deployMode.NavigateBacktoEditor();
    agHelper.Sleep(500);
    entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(function() { return this?.params?.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locators._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, "v2", 3000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
  });

  it("3.{{ (() => { return this?.params?.condition })() }}", function () {
    deployMode.NavigateBacktoEditor();
    agHelper.Sleep(500);
    entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this?.params?.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locators._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("4.{{ this?.params.condition }}", function () {
    deployMode.NavigateBacktoEditor();
    agHelper.Sleep(500);
    entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{this?.params.condition || '1=1'}} order by id",
    );
    deployMode.DeployApp(locators._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
  });

  it("5.{{ (function() { return this?.params.condition })() }}", function () {
    deployMode.NavigateBacktoEditor();
    agHelper.Sleep(500);
    entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(function() { return this?.params.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locators._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("6.{{ (() => { return this?.params.condition })() }}", function () {
    deployMode.NavigateBacktoEditor();
    agHelper.Sleep(500);
    entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this?.params.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locators._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
  });

  it("7. With No Optional chaining : {{ this.params.condition }}", function () {
    deployMode.NavigateBacktoEditor();
    agHelper.Sleep(500);
    entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{this.params.condition || '1=1'}} order by id",
    );
    deployMode.DeployApp(locators._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("8. With No Optional chaining : {{ (function() { return this.params.condition })() }}", function () {
    deployMode.NavigateBacktoEditor();
    agHelper.Sleep(500);
    entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(function() { return this.params.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locators._spanButton("Submit"));
    agHelper.SelectDropDown("8");
    agHelper.ClickButton("Submit");
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
  });

  it("9. With No Optional chaining : {{ (() => { return this.params.condition })() }}", function () {
    deployMode.NavigateBacktoEditor();
    agHelper.Sleep(500);
    entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locators._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
  });

  it("10.{{ this.params.condition }} && direct paramter passed", function () {
    deployMode.NavigateBacktoEditor();
    agHelper.Sleep(500);
    entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '7'}} order by id",
    );

    deployMode.DeployApp(locators._spanButton("Submit"));
    //Verifh when No selected option passed
    cy.xpath(locators._selectWidgetDropdownInDeployed("selectwidget")).within(
      () => cy.get(locators._crossBtn).click(),
    );
    agHelper.ClickButton("Submit");
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("11.{{ this.params.condition }} && no optional paramter passed", function () {
    deployMode.NavigateBacktoEditor();
    agHelper.Sleep(500);
    entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })()}} order by id",
    );
    deployMode.DeployApp(locators._spanButton("Submit"));
    agHelper.ClickButton("Submit");
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, "v2", 2000).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
  });

  it("12. Delete all entities - Query, JSObjects, Datasource + Bug 12532", () => {
    deployMode.NavigateBacktoEditor();
    //agHelper.Sleep(2500);
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "ParamsTest",
      action: "Delete",
      entityType: entityItems.Query,
    });
    assertHelper.AssertNetworkStatus("@deleteAction", 200);
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
});
