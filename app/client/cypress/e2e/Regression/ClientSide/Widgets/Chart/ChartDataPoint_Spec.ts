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

  it("1. Chart widget - Input widget test with default value from another Input widget", () => {
    entityExplorer.SelectEntityByName("Input1", "Widgets");
    propPane.UpdatePropertyFieldValue(
      "Default value",
      dataSet.bindChartData + "}}",
    );
    assertHelper.AssertNetworkStatus("@updateLayout");
    entityExplorer.SelectEntityByName("Chart1");
    propPane.SelectPlatformFunction("onDataPointClick", "Show alert");
    agHelper.EnterActionValue("Message", dataSet.bindingDataPoint);
    entityExplorer.SelectEntityByName("Input2");
    propPane.UpdatePropertyFieldValue(
      "Default value",
      dataSet.bindingSeriesTitle + "}}",
    );
    deployMode.DeployApp();
    agHelper.Sleep(1500); //waiting for chart to load!
    agHelper.GetNClick(widgetLocators.chartDataPoint);
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

  afterEach(() => {
    //this is to enable re-attempt passing!
    deployMode.NavigateBacktoEditor();
  });
});
