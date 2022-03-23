import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { JSEditor } from "../../../../support/Pages/JSEditor";
import { CommonLocators } from "../../../../support/Objects/CommonLocators";

const agHelper = new AggregateHelper();
const jsEditor = new JSEditor();
const locator = new CommonLocators();

let dataSet: any, dsl: any;

describe("Input widget test with default value from chart datapoint", () => {

    before(() => {
        cy.fixture('ChartDsl').then((val: any) => {
            agHelper.AddDsl(val)
            dsl = val;
        });
        cy.fixture("testdata").then(function (data: any) {
            dataSet = data;
        });
    });

    it("1. Input widget test with default value from another Input widget", () => {
        agHelper.expandCollapseEntity("WIDGETS")
        agHelper.SelectEntityByName("Input1")
        jsEditor.EnterJSContext("defaulttext", dataSet.bindChartData + "}}");
        agHelper.ValidateNetworkCallRespPut('@updateLayout')
    });

    it("2. Chart with datapoint feature validation", function () {
        agHelper.SelectEntityByName("Chart1")
        agHelper.SelectPropertiesDropDown("ondatapointclick", "Show message")
        agHelper.EnterActionValue("Message", dataSet.bindingDataPoint)
        agHelper.XpathNClick("(//*[local-name()='rect'])[13]")
        cy.get(locator._inputWidget).first().invoke('val').then($value => {
            let inputVal = ($value as string).replace(/\s/g, "")
            //cy.get(locator._toastMsg).invoke('text').then(toastTxt => expect(toastTxt.trim()).to.eq(inputVal))
            cy.get(locator._toastMsg).should('have.text', inputVal)
        })
    })

    it("3. Chart with seriesTitle feature validation", function () {
        agHelper.SelectEntityByName("Input2")
        jsEditor.EnterJSContext("defaulttext", dataSet.bindingSeriesTitle + "}}");
        cy.get(locator._inputWidget).last().should("have.value", dsl.dsl.children[0].chartData[0].seriesName);
    });

});
