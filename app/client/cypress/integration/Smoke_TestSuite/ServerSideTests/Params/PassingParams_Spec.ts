import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let jsName: any, dsName: any;
let agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources,
  jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  table = ObjectsRegistry.Table,
  apiPage = ObjectsRegistry.ApiPage,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane;

describe("[Bug] - 10784 - Passing params from JS to SQL query should not break", () => {
  before(() => {
    cy.fixture("paramsDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. With Optional chaining : {{ this?.params?.condition }}", function() {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateNewQueryInDS(
        dsName,
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

    ee.SelectEntityByName("Button1", "WIDGETS");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      propPane.SelectJSFunctionToExecute("onClick", jsName as string, "myFun1")
    });
    ee.SelectEntityByName("Table1");
    propPane.UpdatePropertyFieldValue("Table Data", "{{ParamsTest.data}}");

    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    apiPage.ToggleOnPageLoadRun(false); //Bug 12476

    deployMode.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 3000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });

    deployMode.NavigateBacktoEditor();
  });

  it("2. With Optional chaining : {{ (function() { return this?.params?.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(function() { return this?.params?.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("3. With Optional chaining : {{ (() => { return this?.params?.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this?.params?.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("4. With Optional chaining : {{ this?.params.condition }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{this?.params.condition || '1=1'}} order by id",
    );
    deployMode.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("5. With Optional chaining : {{ (function() { return this?.params.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(function() { return this?.params.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("6. With Optional chaining : {{ (() => { return this?.params.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this?.params.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("7. With No Optional chaining : {{ this.params.condition }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{this.params.condition || '1=1'}} order by id",
    );
    deployMode.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("8. With No Optional chaining : {{ (function() { return this.params.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(function() { return this.params.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("8");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("9. With No Optional chaining : {{ (() => { return this.params.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '1=1'}} order by id",
    );
    deployMode.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("10. With Optional chaining : {{ this.params.condition }} && direct paramter passed", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '7'}} order by id",
    );

    deployMode.DeployApp(locator._spanButton("Submit"));
    //Verifh when No selected option passed
    cy.xpath(
      locator._selectWidgetDropdownInDeployed("selectwidget"),
    ).within(() => cy.get(locator._crossBtn).click());
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("11. With Optional chaining : {{ this.params.condition }} && no optional paramter passed", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })()}} order by id",
    );
    deployMode.DeployApp(locator._spanButton("Submit"));
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("12. Delete all entities - Query, JSObjects, Datasource + Bug 12532", () => {
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("ParamsTest", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deleteAction", 200);
    ee.ActionContextMenuByEntityName(
      jsName as string,
      "Delete",
      "Are you sure?",
      true,
    );
    // //Bug 12532
    // ee.ExpandCollapseEntity('DATASOURCES')
    // ee.ActionContextMenuByEntityName(dsName, 'Delete', 'Are you sure?')
    // agHelper.ValidateNetworkStatus("@deleteAction", 200)
  });
});
