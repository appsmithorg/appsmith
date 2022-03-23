import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { JSEditor } from "../../../../support/Pages/JSEditor";
import { CommonLocators } from "../../../../support/Objects/CommonLocators";

const agHelper = new AggregateHelper();
const jsEditor = new JSEditor();
const locator = new CommonLocators();

let dataSet: any;

describe("Loadash basic test with input Widget", () => {

    before(() => {
        cy.fixture('inputBindingdsl').then((val: any) => {
            agHelper.AddDsl(val)
        });

        cy.fixture("testdata").then(function (data: any) {
            dataSet = data;
        });
    });

    it("1. Input widget test with default value for atob method", () => {
        agHelper.expandCollapseEntity("WIDGETS")
        agHelper.SelectEntityByName("Input1")
        jsEditor.EnterJSContext("defaulttext", dataSet.defaultInputBinding + "}}");
        agHelper.ValidateNetworkCallRespPut('@updateLayout')
    });

    it("2. Input widget test with default value for btoa method", function () {
        agHelper.SelectEntityByName("Input2")
        jsEditor.EnterJSContext("defaulttext", dataSet.loadashInput + "}}");
        agHelper.ValidateNetworkCallRespPut('@updateLayout')
    });

    it("3. Publish and validate the data displayed in input widgets value for aToB and bToa", function () {
        agHelper.DeployApp()
        cy.get(locator._inputWidgetInDeployed).first().invoke("attr", "value")
            .should("contain", "7")
        cy.get(locator._inputWidgetInDeployed).last().invoke("attr", "value")
            .should("contain", "7");
    });
});