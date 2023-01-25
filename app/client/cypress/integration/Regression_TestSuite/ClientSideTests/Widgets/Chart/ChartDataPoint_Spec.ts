import { ObjectsRegistry } from "../../../../../support/Objects/Registry"

let dataSet: any, dsl: any;
let agHelper = ObjectsRegistry.AggregateHelper,
    ee = ObjectsRegistry.EntityExplorer,
    propPane = ObjectsRegistry.PropertyPane,
    locator = ObjectsRegistry.CommonLocators,
    deployMode = ObjectsRegistry.DeployMode;

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
        ee.SelectEntityByName("Input1", 'Widgets')
        propPane.UpdatePropertyFieldValue("Default Value", dataSet.bindChartData + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
        ee.SelectEntityByName("Chart1")
        propPane.SelectPropertiesDropDown("ondatapointclick", "Show message")
        agHelper.EnterActionValue("Message", dataSet.bindingDataPoint)
        ee.SelectEntityByName("Input2")
        propPane.UpdatePropertyFieldValue("Default Value", dataSet.bindingSeriesTitle + "}}");
        deployMode.DeployApp()
        agHelper.Sleep(1500)//waiting for chart to load!
        agHelper.GetNClick("//*[local-name()='rect']", 13)
        cy.get(locator._widgetInputSelector("inputwidgetv2")).first().invoke('val').then($value => {
            let inputVal = ($value as string).replace(/\s/g, "")//removing space here
            //cy.get(locator._toastMsg).invoke('text').then(toastTxt => expect(toastTxt.trim()).to.eq(inputVal))
            cy.get(locator._toastMsg).should('have.text', inputVal)
        })
        cy.get(locator._widgetInputSelector("inputwidgetv2")).last().should("have.value", dsl.dsl.children[0].chartData[0].seriesName);
    });

    afterEach(() => {
        //this is to enable re-attempt passing!
        deployMode.NavigateBacktoEditor()
    })

});