import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
import {
  encodedWordDoc,
  encodedXlsxDoc,
} from "../../../../../fixtures/exampleEncodedDocs";
const ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane;

describe("DocumentViewer Widget Functionality", () => {
  it("1. Add new DocumentViewer and verify in canvas", () => {
    ee.DragDropWidgetNVerify("documentviewerwidget", 300, 300);
  });

  it("2. Modify visibility & Publish app & verify", () => {
    ee.NavigateToSwitcher("explorer");
    ee.SelectEntityByName("DocumentViewer1", "Widgets");
    propPane.ToggleOnOrOff("Visible", "Off");
    deployMode.DeployApp();
    cy.get(locator._widgetInDeployed("documentviewerwidget")).should(
      "not.exist",
    );
    deployMode.NavigateBacktoEditor();
  });

  it("3. Change visibility & Publish app & verify again", () => {
    ee.SelectEntityByName("DocumentViewer1", "Widgets");
    propPane.ToggleOnOrOff("Visible", "On");
    deployMode.DeployApp();
    cy.get(locator._widgetInDeployed("documentviewerwidget")).should("exist");
    deployMode.NavigateBacktoEditor();
  });

  it("4. Should show a word document correctly", () => {
    ee.SelectEntityByName("DocumentViewer1", "Widgets");
    propPane.UpdatePropertyFieldValue("Document Link", encodedWordDoc);
    deployMode.DeployApp();
    //"Some doc content" is pressent in the encoded word doc
    cy.get(locator._widgetInDeployed("documentviewerwidget")).should(
      "contain",
      "Some doc content",
    );
    deployMode.NavigateBacktoEditor();
  });
  it("5. Should show an errored state when a malformed docx input is provided", () => {
    ee.SelectEntityByName("DocumentViewer1", "Widgets");
    const someGarbageString = "+dsds";
    // previously the document is set as "Some doc content"
    // give a corrupted docx string
    propPane.UpdatePropertyFieldValue(
      "Document Link",
      encodedWordDoc + someGarbageString,
    );
    deployMode.DeployApp();
    // now the doc should not contain "Some doc content" after a malformed input is provided
    cy.get(locator._widgetInDeployed("documentviewerwidget")).should(
      "not.contain",
      "Some doc content",
    );
    cy.get(locator._widgetInDeployed("documentviewerwidget")).should(
      "contain",
      "invalid base64 data",
    );
    deployMode.NavigateBacktoEditor();
  });
  it("6. Should show a xlsx document correctly", () => {
    ee.SelectEntityByName("DocumentViewer1", "Widgets");
    propPane.UpdatePropertyFieldValue("Document Link", encodedXlsxDoc);
    deployMode.DeployApp();
    //"456" is pressent in the encoded xlsx doc
    cy.get(locator._widgetInDeployed("documentviewerwidget")).should(
      "contain",
      "456",
    );
    deployMode.NavigateBacktoEditor();
  });
  it("7. Should show an errored state when a malformed xlsx input is provided", () => {
    ee.SelectEntityByName("DocumentViewer1", "Widgets");
    // previously the document contains the number "456"
    const someGarbageString = "+dsds";
    //give a corrupted xlsx doc string
    propPane.UpdatePropertyFieldValue(
      "Document Link",
      encodedXlsxDoc + someGarbageString,
    );
    deployMode.DeployApp();
    // now the doc should not contain "456" after a malformed input is provided
    cy.get(locator._widgetInDeployed("documentviewerwidget")).should(
      "not.contain",
      "456",
    );
    cy.get(locator._widgetInDeployed("documentviewerwidget")).should(
      "contain",
      "invalid base64 data",
    );
  });
});
