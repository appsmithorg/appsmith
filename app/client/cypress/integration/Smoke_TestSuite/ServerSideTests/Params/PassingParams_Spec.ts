import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, jsName: any;
let agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources,
  jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  table = ObjectsRegistry.Table,
  apiPage = ObjectsRegistry.ApiPage;

describe("[Bug] - 10784 - Passing params from JS to SQL query should not break", () => {
  before(() => {
    cy.fixture("paramsDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. With Optional chaining : {{ this?.params?.condition }}", function() {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    dataSources.FillPostgresDSForm();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      guid = uid;
      agHelper.RenameWithInPane(guid, false);
      dataSources.TestSaveDatasource();
      cy.log("ds name is :" + guid);
      dataSources.NavigateToActiveDSQueryPane(guid);
      agHelper.GetNClick(dataSources._templateMenu);
      agHelper.RenameWithInPane("ParamsTest");
      agHelper.EnterValue(
        "SELECT * FROM public.users where id = {{this?.params?.condition || '1=1'}} order by id",
      );
      jsEditor.CreateJSObject(
        'ParamsTest.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
        {
          paste: true,
          completeReplace: false,
          toRun: false,
          shouldNavigate: true,
        },
      );
    });
    ee.SelectEntityByName("Button1", "WIDGETS");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      jsEditor.EnterJSContext(
        "onClick",
        "{{" + jsObjName + ".myFun1()}}",
        true,
        true,
      );
    });
    ee.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("Table Data", "{{ParamsTest.data}}");

    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    apiPage.OnPageLoadRun(false); //Bug 12476

    agHelper.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });

    agHelper.NavigateBacktoEditor();
  });

  it("2. With Optional chaining : {{ (function() { return this?.params?.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(function() { return this?.params?.condition })() || '1=1'}} order by id",
    );
    agHelper.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("3. With Optional chaining : {{ (() => { return this?.params?.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(() => { return this?.params?.condition })() || '1=1'}} order by id",
    );
    agHelper.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("4. With Optional chaining : {{ this?.params.condition }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{this?.params.condition || '1=1'}} order by id",
    );
    agHelper.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("5. With Optional chaining : {{ (function() { return this?.params.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(function() { return this?.params.condition })() || '1=1'}} order by id",
    );
    agHelper.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("6. With Optional chaining : {{ (() => { return this?.params.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(() => { return this?.params.condition })() || '1=1'}} order by id",
    );
    agHelper.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("7. With No Optional chaining : {{ this.params.condition }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{this.params.condition || '1=1'}} order by id",
    );
    agHelper.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("7");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("8. With No Optional chaining : {{ (function() { return this.params.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(function() { return this.params.condition })() || '1=1'}} order by id",
    );
    agHelper.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("8");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("9. With No Optional chaining : {{ (() => { return this.params.condition })() }}", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '1=1'}} order by id",
    );
    agHelper.DeployApp(locator._spanButton("Submit"));
    agHelper.SelectDropDown("9");
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("10. With Optional chaining : {{ this.params.condition }} && direct paramter passed", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '7'}} order by id",
    );

    agHelper.DeployApp(locator._spanButton("Submit"));
    //Verifh when No selected option passed
    cy.xpath(
      locator._selectWidgetDropdownInDeployed("selectwidget"),
    ).within(() => cy.get(locator._crossBtn).click());
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("11. With Optional chaining : {{ this.params.condition }} && no optional paramter passed", function() {
    ee.SelectEntityByName("ParamsTest", "QUERIES/JS");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })()}} order by id",
    );
    agHelper.DeployApp(locator._spanButton("Submit"));
    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("12. Delete all entities - Query, JSObjects, Datasource + Bug 12532", () => {
    ee.expandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("ParamsTest", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deleteAction", 200);
    ee.ActionContextMenuByEntityName(
      jsName as string,
      "Delete",
      "Are you sure?",
    );
    agHelper.ValidateNetworkStatus("@deleteJSCollection", 200);
    // //Bug 12532
    // ee.expandCollapseEntity('DATASOURCES')
    // ee.ActionContextMenuByEntityName(guid, 'Delete', 'Are you sure?')
    // agHelper.ValidateNetworkStatus("@deleteAction", 200)
  });
});
