import { ObjectsRegistry } from "../../../../support/Objects/Registry"

let dataSet: any;
let agHelper = ObjectsRegistry.AggregateHelper,
    ee = ObjectsRegistry.EntityExplorer,
    propPane = ObjectsRegistry.PropertyPane,
    locator = ObjectsRegistry.CommonLocators,
    deployMode = ObjectsRegistry.DeployMode;

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
        ee.SelectEntityByName("Input1", 'WIDGETS')
        propPane.UpdatePropertyFieldValue("Default Text", dataSet.atobInput + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
        cy.get(locator._inputWidget).first().invoke("attr", "value").should("equal", 'A');//Before mapping JSObject value of input
    });

    it("2. Input widget test with default value for btoa method", function () {
        ee.SelectEntityByName("Input2")
        propPane.UpdatePropertyFieldValue("Default Text", dataSet.btoaInput + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
        cy.get(locator._inputWidget).last().invoke("attr", "value").should("equal", 'QQ==');//Before mapping JSObject value of input
    });

    it("3. Publish and validate the data displayed in input widgets value for aToB and bToa", function () {
        deployMode.DeployApp(locator._inputWidgetInDeployed)
        cy.get(locator._inputWidgetInDeployed).first().invoke("attr", "value")
            .should("contain", "A")
        cy.get(locator._inputWidgetInDeployed).last().invoke("attr", "value")
            .should("contain", "QQ==");
    });
});
