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

    it("1. Input widget test with default value for atob method", () => {
        agHelper.SelectEntityByName("WIDGETS")
        agHelper.SelectEntityByName("Input1")
        jsEditor.EnterJSContext("defaulttext", dataSet.atobInput + "}}");
        agHelper.ValidateNetworkCallRespPut('@updateLayout')
    });

    it("2. Input widget test with default value for btoa method", function () {
        agHelper.SelectEntityByName("Input2")
        jsEditor.EnterJSContext("defaulttext", dataSet.btoaInput + "}}");
        agHelper.ValidateNetworkCallRespPut('@updateLayout')
    });

    it("3. Publish and validate the data displayed in input widgets value for aToB and bToa", function () {
        agHelper.DeployApp()
        cy.get(locator._inputWidgetInDeployed).first().invoke("attr", "value")
            .should("contain", "A")
        cy.get(locator._inputWidgetInDeployed).last().invoke("attr", "value")
            .should("contain", "QQ==");
    });
});