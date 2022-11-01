import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dsl = require("../../../../fixtures/editorContextdsl.json");

const page1 = "Page1";
const page2 = "Page2";
const api1 = "API1";

const agHelper = ObjectsRegistry.AggregateHelper;
const ee = ObjectsRegistry.EntityExplorer;

describe("Canvas context widget selection", function() {
  before(() => {
    cy.addDsl(dsl);
    cy.Createpage(page2);
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });
    ee.SelectEntityByName(page1, "Pages");
    cy.CreateAPI(api1);
    cy.get(".t--close-editor").click();
    cy.get(".t--back-button").click();
    agHelper.RefreshPage();
  });

  beforeEach(() => {
    agHelper.RefreshPage();
  });

  it("widget should be selected while switching back and forth between pages", function() {
    //select widget in page1
    ee.SelectEntityByName("Camera1", "Widgets");

    //verify the Camera1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Camera1");

    //switch to page2
    ee.SelectEntityByName(page2, "Pages");

    //select widget in page2
    ee.SelectEntityByName("Text1", "Widgets");

    //verify the widget is selected in page2
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //switch to page1
    ee.SelectEntityByName(page1, "Pages");
    cy.wait(500);

    //verify the Camera1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Camera1");

    //Camera1 should be visible in ViewPort
    cy.isInViewport(`//*[@id="${dsl.dsl.children[0].widgetId}"]`);
  });

  it("widget should be selected while switching back to page from API pane", function() {
    //select widget in page1
    ee.SelectEntityByName("Camera1", "Widgets");

    //verify the Camera1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Camera1");

    //navigate to API1
    ee.SelectEntityByName(api1, "Queries/JS");

    //navigate back to page1
    cy.get(".t--close-editor").click();
    cy.wait(500);

    //verify the Camera1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Camera1");

    //Camera1 should be visible in ViewPort
    //cy.isInViewport(`//*[@id="${dsl.dsl.children[0].widgetId}"]`);
  });

  it("multiple widgets should be selected while switching back and forth between pages", function() {
    //select widgets in page1
    ee.SelectEntityByName("Camera1", "Widgets", true);
    ee.SelectEntityByName("Button1", "Widgets", true);

    //verify the 2 widgets are selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
    cy.get(`.t--multi-selection-box`).should("have.length", 1);

    //switch to page2
    ee.SelectEntityByName(page2, "Pages");

    //select widget in page2
    ee.SelectEntityByName("Text1", "Widgets");

    //verify the widget is selected in page2
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //switch to page1
    ee.SelectEntityByName(page1, "Pages");

    //verify the 2 widgets are selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
    cy.get(`.t--multi-selection-box`).should("have.length", 1);
  });

  it("multiple widgets should be selected while switching back to page from API pane", function() {
    //select widgets in page1
    ee.SelectEntityByName("Camera1", "Widgets", true);
    ee.SelectEntityByName("Button1", "Widgets", true);

    //verify the 2 widgets are selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
    cy.get(`.t--multi-selection-box`).should("have.length", 1);

    //navigate to API1
    ee.SelectEntityByName(api1, "Queries/JS");

    //navigate back to page1
    cy.get(".t--close-editor").click();
    cy.wait(500);

    //verify the 2 widgets are selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
    cy.get(`.t--multi-selection-box`).should("have.length", 1);
  });

  it("Modal widget should be selected and open while switching back and forth between pages", function() {
    //select widget in page1
    ee.SelectEntityByName("Modal1", "Widgets");

    //verify the Modal1 is selected and open in page1
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Modal1");

    //switch to page2
    ee.SelectEntityByName(page2, "Pages");

    //select widget in page2
    ee.SelectEntityByName("Text1", "Widgets");

    //verify the widget is selected in page2
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //switch to page1
    ee.SelectEntityByName(page1, "Pages");

    //verify the Modal1 is selected and open in page1
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Modal1");
  });

  it("Modal widget should be selected and open while switching back to page from API pane", function() {
    //select widget in page1
    ee.SelectEntityByName("Modal1", "Widgets");

    //verify the Modal1 is selected and open in page1
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Modal1");

    //navigate to API1
    ee.SelectEntityByName(api1, "Queries/JS");
    cy.wait(500);

    //navigate back to page1
    cy.get(".t--close-editor").click();
    cy.wait(500);

    //verify the Modal1 is selected and open in page1
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Modal1");
  });

  it("widget inside modal should be selected and modal should be open while switching back and forth between pages", function() {
    //select widget in page1
    ee.SelectEntityInModal("Modal1", "Widgets");

    //verify the Modal1 is open and Text1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Text1");

    //switch to page2
    ee.SelectEntityByName(page2, "Pages");

    //select widget in page2
    ee.SelectEntityByName("Text1", "Widgets");

    //verify the widget is selected in page2
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //switch to page1
    ee.SelectEntityByName(page1, "Pages");

    //verify the Modal1 is open and Text1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Text1");
  });

  it("widget inside modal should be selected and modal should be open while switching back to page from API pane", function() {
    //select widget in page1
    ee.SelectEntityInModal("Modal1", "Widgets");

    //verify the Modal1 is open and Text1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Text1");

    //navigate to API1
    ee.SelectEntityByName(api1, "Queries/JS");
    cy.wait(500);

    //navigate back to page1
    cy.get(".t--close-editor").click();
    cy.wait(500);

    //verify the Modal1 is open and Text1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Text1");
  });
});
