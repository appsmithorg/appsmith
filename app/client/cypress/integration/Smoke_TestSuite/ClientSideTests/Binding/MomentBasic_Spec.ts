import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { JSEditor } from "../../../../support/Pages/JSEditor";
import { CommonLocators } from "../../../../support/Objects/CommonLocators";

const agHelper = new AggregateHelper();
const jsEditor = new JSEditor();
const locator = new CommonLocators();

let dataSet: any;

describe("Validate basic binding of Input widget to Input widget", () => {

    before(() => {
        cy.fixture('inputBindingdsl').then((val: any) => {
            agHelper.AddDsl(val)
        });

        cy.fixture("testdata").then(function (data: any) {
            dataSet = data;
        });
    });

    it("1. Input widget test with default value from another Input widget", () => {
        agHelper.expandCollapseEntity("WIDGETS")
        agHelper.SelectEntityByName("Input1")
        jsEditor.EnterJSContext("defaulttext", dataSet.defaultInputBinding + "}}");
        agHelper.ValidateNetworkCallRespPut('@updateLayout')
    });

    it("2. Binding second input widget with first input widget and validating", function () {
        agHelper.SelectEntityByName("Input2")
        jsEditor.EnterJSContext("defaulttext", dataSet.momentInput + "}}");
        agHelper.ValidateNetworkCallRespPut('@updateLayout')
    });

    it("3. Publish widget and validate the data displayed in input widgets", function () {
        var currentTime = new Date();
        agHelper.DeployApp()
        cy.get(locator._inputWidgetInDeployed).first()
            .should("contain.value", currentTime.getFullYear());
        cy.get(locator._inputWidgetInDeployed).last()
            .should("contain.value", currentTime.getFullYear());
    });
});