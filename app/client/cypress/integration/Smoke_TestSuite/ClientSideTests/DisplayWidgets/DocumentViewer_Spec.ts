import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { CommonLocators } from "../../../../support/Objects/CommonLocators";

const agHelper = new AggregateHelper();
const locator = new CommonLocators();

describe("DocumentViewer Widget Functionality", () => {

    it("1. Add new DocumentViewer and verify in canvas", () => {
        agHelper.DragDropWidgetNVerify("documentviewerwidget", 300, 300)
    });

    it("2. Modify visibility & Publish app & verify", () => {
        agHelper.NavigateToExplorer()
        agHelper.SelectEntityByName("WIDGETS")//to expand widgets
        agHelper.SelectEntityByName("DocumentViewer1")
        agHelper.ToggleOrDisable('visible', false)
        agHelper.DeployApp()
        cy.get(locator._widgetInDeployed('documentviewerwidget')).should('not.exist')
        agHelper.NavigateBacktoEditor()
    });

    it("3. Change visibility & Publish app & verify again", () => {
        agHelper.SelectEntityByName("WIDGETS")//to expand widgets
        agHelper.SelectEntityByName("DocumentViewer1")
        agHelper.ToggleOrDisable('visible')
        agHelper.DeployApp()
        cy.get(locator._widgetInDeployed('documentviewerwidget')).should('exist')
    });
});