const dsl = require("../../../../fixtures/editorContextdsl.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

const page1 = "Page1";
const page2 = "Page2";
const api1 = "API1";

describe("Canvas context widget selection", function () {
  before(() => {
    _.agHelper.AddDsl("editorContextdsl");
    cy.Createpage(page2);
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });
    _.entityExplorer.SelectEntityByName(page1, "Pages");
    cy.CreateAPI(api1);
    _.agHelper.Sleep(2000); // adding wait for page to load
    _.entityExplorer.NavigateToSwitcher("Widgets");
  });

  beforeEach(() => {
    _.agHelper.RefreshPage();
    // Deselect all widgets
    cy.get(`#div-selection-0`).click({
      force: true,
    });
  });

  it("1. Widget should be selected while switching back and forth betw_.entityExplorer.n pages", function () {
    //select widget in page1
    _.entityExplorer.SelectEntityByName("Camera1", "Widgets");

    //verify the Camera1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Camera1");

    //switch to page2
    _.entityExplorer.SelectEntityByName(page2, "Pages");

    //select widget in page2
    _.entityExplorer.SelectEntityByName("Text1", "Widgets");

    //verify the widget is selected in page2
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //switch to page1
    _.entityExplorer.SelectEntityByName(page1, "Pages");
    cy.wait(500);

    //verify the Camera1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Camera1");

    //Camera1 should be visible in ViewPort
    cy.isInViewport(`//*[@id="${dsl.dsl.children[0].widgetId}"]`);
  });

  it("2. Widget should be selected while switching back to page from API pane", function () {
    //select widget in page1
    _.entityExplorer.SelectEntityByName("Camera1", "Widgets");

    //verify the Camera1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Camera1");

    //navigate to API1
    _.entityExplorer.SelectEntityByName(api1, "Queries/JS");

    //navigate back to page1
    cy.get(".t--close-editor").click();
    cy.wait(500);

    //verify the Camera1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Camera1");

    //Camera1 should be visible in ViewPort
    //cy.isInViewport(`//*[@id="${dsl.dsl.children[0].widgetId}"]`);
  });

  it("3. Multiple widgets should be selected while switching back and forth betw_.entityExplorer.n pages", function () {
    //select widgets in page1
    _.entityExplorer.SelectEntityByName("Camera1", "Widgets", true);
    _.entityExplorer.SelectEntityByName("Button1", "Widgets", true);

    //verify the 2 widgets are selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
    cy.get(`.t--multi-selection-box`).should("have.length", 1);

    //switch to page2
    _.entityExplorer.SelectEntityByName(page2, "Pages");

    //select widget in page2
    _.entityExplorer.SelectEntityByName("Text1", "Widgets");

    //verify the widget is selected in page2
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //switch to page1
    _.entityExplorer.SelectEntityByName(page1, "Pages");

    //verify the 2 widgets are selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
    cy.get(`.t--multi-selection-box`).should("have.length", 1);
  });

  it("4. Multiple widgets should be selected while switching back to page from API pane", function () {
    //select widgets in page1
    _.entityExplorer.SelectEntityByName("Camera1", "Widgets", true);
    _.entityExplorer.SelectEntityByName("Button1", "Widgets", true);

    //verify the 2 widgets are selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
    cy.get(`.t--multi-selection-box`).should("have.length", 1);

    //navigate to API1
    _.entityExplorer.SelectEntityByName(api1, "Queries/JS");

    //navigate back to page1
    cy.get(".t--close-editor").click();
    cy.wait(500);

    //verify the 2 widgets are selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
    cy.get(`.t--multi-selection-box`).should("have.length", 1);
  });

  it("5. Modal widget should be selected and open while switching back and forth betw_.entityExplorer.n pages", function () {
    //select widget in page1
    _.entityExplorer.SelectEntityByName("Modal1", "Widgets");

    //verify the Modal1 is selected and open in page1
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Modal1");

    //switch to page2
    _.entityExplorer.SelectEntityByName(page2, "Pages");

    //select widget in page2
    _.entityExplorer.SelectEntityByName("Text1", "Widgets");

    //verify the widget is selected in page2
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //switch to page1
    _.entityExplorer.SelectEntityByName(page1, "Pages");

    //verify the Modal1 is selected and open in page1
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Modal1");
  });

  it("6. Modal widget should be selected and open while switching back to page from API pane", function () {
    //select widget in page1
    _.entityExplorer.SelectEntityByName("Modal1", "Widgets");

    //verify the Modal1 is selected and open in page1
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Modal1");

    //navigate to API1
    _.entityExplorer.SelectEntityByName(api1, "Queries/JS");
    cy.wait(500);

    //navigate back to page1
    cy.get(".t--close-editor").click();
    cy.wait(500);

    //verify the Modal1 is selected and open in page1
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Modal1");
  });

  it("7. Widget inside modal should be selected and modal should be open while switching back and forth betw_.entityExplorer.n pages", function () {
    //select widget in page1
    _.entityExplorer.SelectEntityInModal("Modal1", "Widgets");

    //verify the Modal1 is open and Text1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Text1");

    //switch to page2
    _.entityExplorer.SelectEntityByName(page2, "Pages");

    //select widget in page2
    _.entityExplorer.SelectEntityByName("Text1", "Widgets");

    //verify the widget is selected in page2
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //switch to page1
    _.entityExplorer.SelectEntityByName(page1, "Pages");

    //verify the Modal1 is open and Text1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Text1");
  });

  it("8. Widget inside modal should be selected and modal should be open while switching back to page from API pane", function () {
    //select widget in page1
    _.entityExplorer.SelectEntityInModal("Modal1", "Widgets");

    //verify the Modal1 is open and Text1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Text1");

    //navigate to API1
    _.entityExplorer.SelectEntityByName(api1, "Queries/JS");
    cy.wait(500);

    //navigate back to page1
    cy.get(".t--close-editor").click();
    cy.wait(500);

    //verify the Modal1 is open and Text1 is selected in page1
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--property-pane-title").should("contain", "Text1");
  });

  it("9. Widget inside non default tab in tab widget should be selected and the given tab should be open while switching back and forth betw_.entityExplorer.n pages", function () {
    //switch to tab 2 and select widget a button inside tab 2 in page1
    cy.get(".t--tabid-tab2").click({ force: true });
    _.entityExplorer.SelectEntityByName("Tabs1", "Widgets");
    _.entityExplorer.ExpandCollapseEntity("Tabs1", true);
    _.entityExplorer.ExpandCollapseEntity("Tab 2", true);
    _.entityExplorer.SelectEntityByName("Button4", "Widgets");

    //verify the tab 2 is open and Button 4 is selected in page1
    cy.get(".is-selected").should("contain", "Tab 2");
    cy.get(".t--property-pane-title").should("contain", "Button4");

    //switch to page2
    _.entityExplorer.SelectEntityByName(page2, "Pages");

    //select widget in page2
    _.entityExplorer.SelectEntityByName("Text1", "Widgets");

    //verify the widget is selected in page2
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //switch to page1
    _.entityExplorer.SelectEntityByName(page1, "Pages");

    //verify the tab 2 is open and Button 4 is selected in page1
    cy.get(".is-selected").should("contain", "Tab 2");
    cy.get(".t--property-pane-title").should("contain", "Button4");
  });

  it("10. Widget inside non default tab in tab widget should be selected and the given tab should be open while switching back to page from API pane", function () {
    //switch to tab 2 and select widget a button inside tab 2 in page1
    cy.get(".t--tabid-tab2").click({ force: true });
    _.entityExplorer.SelectEntityByName("Tabs1", "Widgets");
    _.entityExplorer.ExpandCollapseEntity("Tabs1", true);
    _.entityExplorer.ExpandCollapseEntity("Tab 2", true);
    _.entityExplorer.SelectEntityByName("Button4", "Widgets");

    //verify the tab 2 is open and Button 4 is selected in page1
    cy.get(".is-selected").should("contain", "Tab 2");
    cy.get(".t--property-pane-title").should("contain", "Button4");

    //navigate to API1
    _.entityExplorer.SelectEntityByName(api1, "Queries/JS");
    cy.wait(500);

    //navigate back to page1
    cy.get(".t--close-editor").click();
    cy.wait(500);

    //verify the tab 2 is open and Button 4 is selected in page1
    cy.get(".is-selected").should("contain", "Tab 2");
    cy.get(".t--property-pane-title").should("contain", "Button4");
  });
});
