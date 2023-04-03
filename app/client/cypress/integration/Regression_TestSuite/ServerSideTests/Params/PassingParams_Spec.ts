import * as _ from "../../../../support/Objects/ObjectsCore";

let jsName: any, dsName: any;

describe("[Bug] - 10784 - Passing params from JS to SQL query should not break", () => {
  before(() => {
    cy.fixture("paramsDsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. With Optional chaining : {{ this?.params?.condition }}", function () {
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      _.dataSources.CreateQueryAfterDSSaved(
        "SELECT * FROM public.users where id = {{this?.params?.condition || '1=1'}} order by id",
        "ParamsTest",
      );
    });

    _.jsEditor.CreateJSObject(
      'ParamsTest.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
      {
        paste: true,
        completeReplace: false,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      _.propPane.SelectJSFunctionToExecute(
        "onClick",
        jsName as string,
        "myFun1",
      );
    });
    _.entityExplorer.SelectEntityByName("Table1");
    _.propPane.UpdatePropertyFieldValue("Table Data", "{{ParamsTest.data}}");

    _.entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    _.apiPage.ToggleOnPageLoadRun(false); //Bug 12476

    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    _.agHelper.SelectDropDown("7");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0, "v1", 3000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("2. With Optional chaining : {{ (function() { return this?.params?.condition })() }}", function () {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    _.dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(function() { return this?.params?.condition })() || '1=1'}} order by id",
    );
    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    _.agHelper.SelectDropDown("9");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
  });

  it("3. With Optional chaining : {{ (() => { return this?.params?.condition })() }}", function () {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    _.dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this?.params?.condition })() || '1=1'}} order by id",
    );
    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    _.agHelper.SelectDropDown("7");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("4. With Optional chaining : {{ this?.params.condition }}", function () {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    _.dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{this?.params.condition || '1=1'}} order by id",
    );
    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    _.agHelper.SelectDropDown("9");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
  });

  it("5. With Optional chaining : {{ (function() { return this?.params.condition })() }}", function () {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    _.dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(function() { return this?.params.condition })() || '1=1'}} order by id",
    );
    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    _.agHelper.SelectDropDown("7");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("6. With Optional chaining : {{ (() => { return this?.params.condition })() }}", function () {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    _.dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this?.params.condition })() || '1=1'}} order by id",
    );
    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    _.agHelper.SelectDropDown("9");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
  });

  it("7. With No Optional chaining : {{ this.params.condition }}", function () {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    _.dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{this.params.condition || '1=1'}} order by id",
    );
    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    _.agHelper.SelectDropDown("7");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("8. With No Optional chaining : {{ (function() { return this.params.condition })() }}", function () {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    _.dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(function() { return this.params.condition })() || '1=1'}} order by id",
    );
    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    _.agHelper.SelectDropDown("8");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
  });

  it("9. With No Optional chaining : {{ (() => { return this.params.condition })() }}", function () {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    _.dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '1=1'}} order by id",
    );
    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    _.agHelper.SelectDropDown("9");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
  });

  it("10. With Optional chaining : {{ this.params.condition }} && direct paramter passed", function () {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    _.dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '7'}} order by id",
    );

    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    //Verifh when No selected option passed
    cy.xpath(_.locators._selectWidgetDropdownInDeployed("selectwidget")).within(
      () => cy.get(_.locators._crossBtn).click(),
    );
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("11. With Optional chaining : {{ this.params.condition }} && no optional paramter passed", function () {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("ParamsTest", "Queries/JS");
    _.dataSources.EnterQuery(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })()}} order by id",
    );
    _.deployMode.DeployApp(_.locators._spanButton("Submit"));
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
  });

  it("12. Delete all entities - Query, JSObjects, Datasource + Bug 12532", () => {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.ActionContextMenuByEntityName(
      "ParamsTest",
      "Delete",
      "Are you sure?",
    );
    _.agHelper.ValidateNetworkStatus("@deleteAction", 200);
    _.entityExplorer.ActionContextMenuByEntityName(
      jsName as string,
      "Delete",
      "Are you sure?",
      true,
    );
    // //Bug 12532
    // _.entityExplorer.ExpandCollapseEntity('Datasources')
    // _.entityExplorer.ActionContextMenuByEntityName(dsName, 'Delete', 'Are you sure?')
    // _.agHelper.ValidateNetworkStatus("@deleteAction", 200)
  });
});
