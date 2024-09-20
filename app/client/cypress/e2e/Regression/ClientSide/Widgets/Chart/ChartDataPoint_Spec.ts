import {
  agHelper,
  assertHelper,
  deployMode,
  draggableWidgets,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const widgetLocators = require("../../../../../locators/Widgets.json");

let dataSet: any, dsl: any;

describe(
  "Input widget test with default value from chart datapoint",
  { tags: ["@tag.Widget", "@tag.Chart", "@tag.Sanity"] },
  () => {
    //beforeEach - to enable re-attempt passing!
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
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.bindChartData + "}}",
      );
      assertHelper.AssertNetworkStatus("@updateLayout");
      EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
      propPane.TogglePropertyState("Show Labels", "On");
      propPane.SelectPlatformFunction("onDataPointClick", "Show alert");
      agHelper.EnterActionValue("Message", dataSet.bindingDataPoint);
      EditorNavigation.SelectEntityByName("Input2", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.bindingSeriesTitle + "}}",
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CHART));
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

      deployMode.NavigateBacktoEditor();
    });

    it("2. onDataPointClick should work and respond with x, y, seriesTitle, and rawEventData (in case of custom fusion chart).", () => {
      agHelper.AddDsl("chartCustomSankeyDataDsl");
      EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
      agHelper.Sleep(1500); //waiting for chart to load!
      propPane.SelectPlatformFunction("onDataPointClick", "Show alert");
      agHelper.EnterActionValue("Message", dataSet.bindingDataPoint);

      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CHART));
      agHelper.Sleep(1500); //waiting for chart to load!
      agHelper.GetNClickByContains(
        widgetLocators.chartDataPoint,
        "European Union",
      );
      agHelper.ValidateToastMessage(
        '{"rawEventData":{"color":"#FFC533","alpha":100,"labelFill":"#666","labelAlpha":100,"value":4747591,"label":"European Union","sourceLinks":["France","United States","United Kingdom","Switzerland","Austria","Sweden"],"targetLinks":["Netherlands","Germany","Belgium","China","Italy","Russia","Spain"]}}',
      );
    });
  },
);
