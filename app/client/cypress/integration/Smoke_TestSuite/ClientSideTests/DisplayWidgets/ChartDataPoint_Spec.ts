import { ObjectsRegistry } from "../../../../support/Objects/Registry"

let dataSet: any, dsl: any;
let agHelper = ObjectsRegistry.AggregateHelper,
    ee = ObjectsRegistry.EntityExplorer,
    jsEditor = ObjectsRegistry.JSEditor,
    locator = ObjectsRegistry.CommonLocators;

describe("Input widget test with default value from chart datapoint", () => {

    //beforeEach - becasuse to enable re-attempt passing!
    beforeEach(() => {
        cy.fixture('ChartDsl').then((val: any) => {
            agHelper.AddDsl(val)
            dsl = val;
        });
        cy.fixture("testdata").then(function (data: any) {
            dataSet = data;
        });
    });

    it("1. Chart widget - Input widget test with default value from another Input widget", () => {
        ee.SelectEntityByName("Input1", 'WIDGETS')
        jsEditor.EnterJSContext("Default Text", dataSet.bindChartData + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
        ee.SelectEntityByName("Chart1")
        agHelper.SelectPropertiesDropDown("ondatapointclick", "Show message")
        agHelper.EnterActionValue("Message", dataSet.bindingDataPoint)
        ee.SelectEntityByName("Input2")
        jsEditor.EnterJSContext("Default Text", dataSet.bindingSeriesTitle + "}}");
        agHelper.DeployApp()
        agHelper.Sleep(1500)//waiting for chart to load!
        agHelper.GetNClick("//*[local-name()='rect']", 13)
        cy.get(locator._inputWidgetInDeployed).first().invoke('val').then($value => {
            let inputVal = ($value as string).replace(/\s/g, "")//removing space here
            //cy.get(locator._toastMsg).invoke('text').then(toastTxt => expect(toastTxt.trim()).to.eq(inputVal))
            cy.get(locator._toastMsg).should('have.text', inputVal)
        })
        cy.get(locator._inputWidgetInDeployed).last().should("have.value", dsl.dsl.children[0].chartData[0].seriesName);
    });

    afterEach(() => {
        //this is to enable re-attempt passing!
        agHelper.NavigateBacktoEditor()
    })

});
