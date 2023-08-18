import {
  agHelper,
  assertHelper,
  propPane,
  deployMode,
  locators,
  entityExplorer,
} from "../../../../../support/Objects/ObjectsCore";

const widgetLocators = require("../../../../../locators/Widgets.json");

let dataSet: any, dsl: any;

describe("Input widget test with default value from chart datapoint", () => {
  //beforeEach - becasuse to enable re-attempt passing!
  beforeEach(() => {
    agHelper.AddDsl("ChartDsl");
    cy.fixture("ChartDsl").then((val: any) => {
      dsl = val;
    });
    cy.fixture("testdata").then(function (data: any) {
      dataSet = data;
    });
  });

  afterEach(() => {
    //this is to enable re-attempt passing!
    deployMode.NavigateBacktoEditor();
  });

  it("1. Chart widget - Input widget test with default value from another Input widget", () => {
    entityExplorer.SelectEntityByName("Input1", "Widgets");
    propPane.UpdatePropertyFieldValue(
      "Default value",
      dataSet.bindChartData + "}}",
    );
    assertHelper.AssertNetworkStatus("@updateLayout");
    entityExplorer.SelectEntityByName("Chart1");
    propPane.TogglePropertyState("Show Labels", "On");
    propPane.SelectPlatformFunction("onDataPointClick", "Show alert");
    agHelper.EnterActionValue("Message", dataSet.bindingDataPoint);
    entityExplorer.SelectEntityByName("Input2");
    propPane.UpdatePropertyFieldValue(
      "Default value",
      dataSet.bindingSeriesTitle + "}}",
    );
    deployMode.DeployApp();
    agHelper.Sleep(1500); //waiting for chart to load!
    agHelper.GetNClickByContains(widgetLocators.chartDataPoint, "36000");
    cy.get(locators._widgetInputSelector("inputwidgetv2"))
      .first()
      .invoke("val")
      .then(($value) => {
        let inputVal = ($value as string).replace(/\s/g, ""); //removing space here
        //cy.get(locator._toastMsg).invoke('text').then(toastTxt => expect(toastTxt.trim()).to.eq(inputVal))
        cy.get(locators._toastMsg).should("have.text", inputVal);
      });
    cy.get(locators._widgetInputSelector("inputwidgetv2"))
      .last()
      .should("have.value", dsl.dsl.children[0].chartData[0].seriesName);
  });

  it("2. onDataPointClick should work and respond with x, y, seriesTitle, and rawEventData (in case of custom fusion chart).", () => {
    assertHelper.AssertNetworkStatus("@updateLayout");
    entityExplorer.SelectEntityByName("Chart1");
    propPane.SelectPlatformFunction("onDataPointClick", "Show alert");
    agHelper.EnterActionValue("Message", dataSet.bindingDataPoint);

    deployMode.DeployApp();
    agHelper.Sleep(1500); //waiting for chart to load!

    agHelper.GetNClick(widgetLocators.chartDataPoint);
    cy.get(locators._toastMsg).should(
      "have.text",
      `{"x":"Mon","y":10000,"seriesTitle":"Sales"}`,
    );
    deployMode.NavigateBacktoEditor();

    agHelper.AddDsl("chartCustomSankeyDataDsl");
    cy.fixture("chartCustomSankeyDataDsl").then((val: any) => {
      dsl = val;
    });
    cy.fixture("testdata").then(function (data: any) {
      dataSet = data;
    });

    assertHelper.AssertNetworkStatus("@updateLayout");
    entityExplorer.SelectEntityByName("Chart1");
    propPane.SelectPlatformFunction("onDataPointClick", "Show alert");
    agHelper.EnterActionValue("Message", dataSet.bindingDataPoint);

    deployMode.DeployApp();

    agHelper.Sleep(1500); //waiting for chart to load!
    agHelper.GetNClick(widgetLocators.sankeyChartDataPoint, 0, true);
    cy.get(locators._toastMsg).should(
      "have.text",
      `{"x":-1,"y":-1,"seriesTitle":"","rawEventData":{"color":"#FFC533","alpha":100,"labelFill":"#666","labelAlpha":100,"value":4747591,"label":"European Union","sourceLinks":["France","United States","United Kingdom","Switzerland","Austria","Sweden"],"targetLinks":["Netherlands","Germany","Belgium","China","Italy","Russia","Spain"]}}`,
    );
  });
});
