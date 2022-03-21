import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { JSEditor } from "../../../../support/Pages/JSEditor";
import { DataSources } from "../../../../support/Pages/DataSources";
import { CommonLocators } from "../../../../support/Objects/CommonLocators";

const agHelper = new AggregateHelper();
const jsEditor = new JSEditor();
const dataSources = new DataSources();
const locator = new CommonLocators();

describe("[Bug] - 10784 - Passing params from JS to SQL query should not break", () => {
  before(() => {
    cy.fixture("paramsDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  let guid: any;

  it("1. With Optional chaining : {{ this?.params?.condition }}", function() {
    agHelper.NavigateToDSCreateNew();
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
      agHelper.RenameWithInPane("Params1");
      agHelper.EnterValue(
        "SELECT * FROM public.users where id = {{this?.params?.condition || '1=1'}} order by id",
      );
      jsEditor.CreateJSObject(
        'Params1.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
      );
    });
    agHelper.expandCollapseEntity("WIDGETS");
    agHelper.SelectEntityByName("Button1");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext(
        "onclick",
        "{{" + jsObjName + ".myFun1()}}",
        true,
        true,
      );
    });
    agHelper.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("tabledata", "{{Params1.data}}");

    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });

    agHelper.SelectDropDown("selectwidget", "7");
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.Sleep(2000);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("2. With Optional chaining : {{ (function() { return this?.params?.condition })() }}", function() {
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("Params2");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(function() { return this?.params?.condition })() || '1=1'}} order by id",
    );
    jsEditor.CreateJSObject(
      'Params2.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
    );

    agHelper.SelectEntityByName("Button1");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext(
        "onclick",
        "{{" + jsObjName + ".myFun1()}}",
        true,
        true,
      );
    });
    agHelper.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("tabledata", "{{Params2.data}}");

    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });

    agHelper.SelectDropDown("selectwidget", "9");
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.Sleep(2000);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
  });

  it("3. With Optional chaining : {{ (() => { return this?.params?.condition })() }}", function() {
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("Params3");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(() => { return this?.params?.condition })() || '1=1'}} order by id",
    );
    jsEditor.CreateJSObject(
      'Params3.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
    );

    agHelper.SelectEntityByName("Button1");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext(
        "onclick",
        "{{" + jsObjName + ".myFun1()}}",
        true,
        true,
      );
    });
    agHelper.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("tabledata", "{{Params3.data}}");

    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });

    agHelper.SelectDropDown("selectwidget", "8");
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.Sleep(2000);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
  });

  it("4. With Optional chaining : {{ this?.params.condition }}", function() {
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("Params4");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{this?.params.condition || '1=1'}} order by id",
    );
    jsEditor.CreateJSObject(
      'Params4.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
    );

    agHelper.SelectEntityByName("Button1");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext(
        "onclick",
        "{{" + jsObjName + ".myFun1()}}",
        true,
        true,
      );
    });
    agHelper.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("tabledata", "{{Params4.data}}");

    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });

    agHelper.SelectDropDown("selectwidget", "7");
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.Sleep(2000);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("5. With Optional chaining : {{ (function() { return this?.params.condition })() }}", function() {
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("Params5");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(function() { return this?.params.condition })() || '1=1'}} order by id",
    );
    jsEditor.CreateJSObject(
      'Params5.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
    );

    agHelper.SelectEntityByName("Button1");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext(
        "onclick",
        "{{" + jsObjName + ".myFun1()}}",
        true,
        true,
      );
    });
    agHelper.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("tabledata", "{{Params5.data}}");

    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });

    agHelper.SelectDropDown("selectwidget", "9");
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.Sleep(2000);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
  });

  it("6. With Optional chaining : {{ (() => { return this?.params.condition })() }}", function() {
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("Params6");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(() => { return this?.params.condition })() || '1=1'}} order by id",
    );
    jsEditor.CreateJSObject(
      'Params6.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
    );

    agHelper.SelectEntityByName("Button1");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext(
        "onclick",
        "{{" + jsObjName + ".myFun1()}}",
        true,
        true,
      );
    });
    agHelper.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("tabledata", "{{Params6.data}}");

    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });

    agHelper.SelectDropDown("selectwidget", "8");
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.Sleep(2000);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
  });

  it("7. With No Optional chaining : {{ this.params.condition }}", function() {
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("Params7");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{this.params.condition || '1=1'}} order by id",
    );
    jsEditor.CreateJSObject(
      'Params7.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
    );

    agHelper.SelectEntityByName("Button1");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext(
        "onclick",
        "{{" + jsObjName + ".myFun1()}}",
        true,
        true,
      );
    });
    agHelper.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("tabledata", "{{Params7.data}}");

    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });

    agHelper.SelectDropDown("selectwidget", "7");
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.Sleep(2000);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });

  it("8. With No Optional chaining : {{ (function() { return this.params.condition })() }}", function() {
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("Params8");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(function() { return this.params.condition })() || '1=1'}} order by id",
    );
    jsEditor.CreateJSObject(
      'Params8.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
    );

    agHelper.SelectEntityByName("Button1");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext(
        "onclick",
        "{{" + jsObjName + ".myFun1()}}",
        true,
        true,
      );
    });
    agHelper.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("tabledata", "{{Params8.data}}");

    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });

    agHelper.SelectDropDown("selectwidget", "9");
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.Sleep(2000);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });
  });

  it("9. With No Optional chaining : {{ (() => { return this.params.condition })() }}", function() {
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("Params9");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '1=1'}} order by id",
    );
    jsEditor.CreateJSObject(
      'Params9.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
    );

    agHelper.SelectEntityByName("Button1");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext(
        "onclick",
        "{{" + jsObjName + ".myFun1()}}",
        true,
        true,
      );
    });
    agHelper.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("tabledata", "{{Params9.data}}");

    agHelper.ClickButton("Submit");
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("9");
    });

    agHelper.SelectDropDown("selectwidget", "8");
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.Sleep(2000);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
  });

  it("10. With Optional chaining : {{ this?.params?.condition }} && no optional paramter passed", function() {
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("Params10");
    agHelper.EnterValue(
      "SELECT * FROM public.users where id = {{(() => { return this.params.condition })() || '7'}} order by id",
    );
    jsEditor.CreateJSObject(
      'Params10.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})',
    );

    agHelper.SelectEntityByName("Button1");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext(
        "onclick",
        "{{" + jsObjName + ".myFun1()}}",
        true,
        true,
      );
    });
    agHelper.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("tabledata", "{{Params10.data}}");

    //When No selected option passed
    cy.xpath(locator._selectWidgetDropdown("selectwidget")).within(() =>
      cy.get(locator._crossBtn).click(),
    );
    agHelper.ClickButton("Submit");
    agHelper.Sleep(2000);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    agHelper.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("7");
    });
  });
});
