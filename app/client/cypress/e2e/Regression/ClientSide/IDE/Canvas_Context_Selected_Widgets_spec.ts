import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const dsl = require("../../../../fixtures/editorContextdsl.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

const page1 = "Page1";
const page2 = "Page2";
const api1 = "API1";

describe(
  "Canvas context widget selection",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("editorContextdsl");
      cy.Createpage(page2);
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });
      EditorNavigation.SelectEntityByName(page1, EntityType.Page);
      cy.CreateAPI(api1);
      _.agHelper.Sleep(2000); // adding wait for page to load
      PageLeftPane.switchSegment(PagePaneSegment.UI);
    });

    beforeEach(() => {
      _.agHelper.RefreshPage();
      // Deselect all widgets
      cy.get("body").type("{esc}");
    });

    it("1. Widget should be selected while switching back and forth betw_.entityExplorer.n pages", function () {
      //select widget in page1
      EditorNavigation.SelectEntityByName("Camera1", EntityType.Widget);

      //verify the Camera1 is selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Camera1");

      //switch to page2
      EditorNavigation.SelectEntityByName(page2, EntityType.Page);

      //select widget in page2
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);

      //verify the widget is selected in page2
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

      //switch to page1
      EditorNavigation.SelectEntityByName(page1, EntityType.Page);
      cy.wait(500);

      //verify the Camera1 is selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Camera1");

      //Camera1 should be visible in ViewPort
      cy.isInViewport(`//*[@id="${dsl.dsl.children[0].widgetId}"]`);
    });

    it("2. Widget should be selected while switching back to page from API pane", function () {
      //select widget in page1
      EditorNavigation.SelectEntityByName("Camera1", EntityType.Widget);

      //verify the Camera1 is selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Camera1");

      //navigate to API1
      EditorNavigation.SelectEntityByName(api1, EntityType.Api);

      //navigate back to page1
      EditorNavigation.ShowCanvas();
      cy.wait(500);

      //verify the Camera1 is selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Camera1");

      //Camera1 should be visible in ViewPort
      //cy.isInViewport(`//*[@id="${dsl.dsl.children[0].widgetId}"]`);
    });

    it("3. Multiple widgets should be selected while switching back and forth betw_.entityExplorer.n pages", function () {
      //select widgets in page1
      _.agHelper
        .GetElement(PageLeftPane.listItemSelector("Camera1"))
        .click({ ctrlKey: true });
      _.agHelper
        .GetElement(PageLeftPane.listItemSelector("Button1"))
        .click({ ctrlKey: true });

      //verify the 2 widgets are selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
      cy.get(`.t--multi-selection-box`).should("have.length", 1);

      //switch to page2
      EditorNavigation.SelectEntityByName(page2, EntityType.Page);

      //select widget in page2
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);

      //verify the widget is selected in page2
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

      //switch to page1
      EditorNavigation.SelectEntityByName(page1, EntityType.Page);

      //verify the 2 widgets are selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
      cy.get(`.t--multi-selection-box`).should("have.length", 1);
    });

    it("4. Multiple widgets should be selected while switching back to page from API pane", function () {
      //select widgets in page1
      _.agHelper
        .GetElement(PageLeftPane.listItemSelector("Camera1"))
        .click({ ctrlKey: true });
      _.agHelper
        .GetElement(PageLeftPane.listItemSelector("Button1"))
        .click({ ctrlKey: true });

      //verify the 2 widgets are selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
      cy.get(`.t--multi-selection-box`).should("have.length", 1);

      //navigate to API1
      EditorNavigation.SelectEntityByName(api1, EntityType.Api);

      //navigate back to page1
      EditorNavigation.ShowCanvas();
      cy.wait(500);

      //verify the 2 widgets are selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
      cy.get(`.t--multi-selection-box`).should("have.length", 1);
    });

    it("5. Modal widget should be selected and open while switching back and forth betw_.entityExplorer.n pages", function () {
      //select widget in page1
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);

      //verify the Modal1 is selected and open in page1
      cy.get(".t--modal-widget").should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Modal1");

      //switch to page2
      EditorNavigation.SelectEntityByName(page2, EntityType.Page);

      //select widget in page2
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);

      //verify the widget is selected in page2
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

      //switch to page1
      EditorNavigation.SelectEntityByName(page1, EntityType.Page);

      //verify the Modal1 is selected and open in page1
      cy.get(".t--modal-widget").should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Modal1");
    });

    it("6. Modal widget should be selected and open while switching back to page from API pane", function () {
      //select widget in page1
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);

      //verify the Modal1 is selected and open in page1
      cy.get(".t--modal-widget").should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Modal1");

      //navigate to API1
      EditorNavigation.SelectEntityByName(api1, EntityType.Api);
      cy.wait(500);

      //navigate back to page1
      EditorNavigation.ShowCanvas();
      cy.wait(500);

      //verify the Modal1 is selected and open in page1
      cy.get(".t--modal-widget").should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Modal1");
    });

    it("7. Widget inside modal should be selected and modal should be open while switching back and forth betw_.entityExplorer.n pages", function () {
      //select widget in page1
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
        "Modal1",
      ]);

      //verify the Modal1 is open and Text1 is selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
      cy.get(".t--modal-widget").should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Text1");

      //switch to page2
      EditorNavigation.SelectEntityByName(page2, EntityType.Page);

      //select widget in page2
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);

      //verify the widget is selected in page2
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

      //switch to page1
      EditorNavigation.SelectEntityByName(page1, EntityType.Page);

      //verify the Modal1 is open and Text1 is selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
      cy.get(".t--modal-widget").should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Text1");
    });

    it("8. Widget inside modal should be selected and modal should be open while switching back to page from API pane", function () {
      //select widget in page1
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
        "Modal1",
      ]);

      //verify the Modal1 is open and Text1 is selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
      cy.get(".t--modal-widget").should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Text1");

      //navigate to API1
      EditorNavigation.SelectEntityByName(api1, EntityType.Api);
      cy.wait(500);

      //navigate back to page1
      EditorNavigation.ShowCanvas();
      cy.wait(500);

      //verify the Modal1 is open and Text1 is selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
      cy.get(".t--modal-widget").should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Text1");
    });

    it("9. Widget inside non default tab in tab widget should be selected and the given tab should be open while switching back and forth betw_.entityExplorer.n pages", function () {
      //switch to tab 2 and select widget a button inside tab 2 in page1
      cy.get(".t--tabid-tab2").click({ force: true });
      EditorNavigation.SelectEntityByName("Tabs1", EntityType.Widget);
      PageLeftPane.expandCollapseItem("Tabs1", true);
      PageLeftPane.expandCollapseItem("Tab 2", true);
      EditorNavigation.SelectEntityByName("Button4", EntityType.Widget);

      //verify the tab 2 is open and Button 4 is selected in page1
      cy.get(".is-selected").should("contain", "Tab 2");
      cy.get(".t--property-pane-title").should("contain", "Button4");

      //switch to page2
      EditorNavigation.SelectEntityByName(page2, EntityType.Page);

      //select widget in page2
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);

      //verify the widget is selected in page2
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

      //switch to page1
      EditorNavigation.SelectEntityByName(page1, EntityType.Page);

      //verify the tab 2 is open and Button 4 is selected in page1
      cy.get(".is-selected").should("contain", "Tab 2");
      cy.get(".t--property-pane-title").should("contain", "Button4");
    });

    it("10. Widget inside non default tab in tab widget should be selected and the given tab should be open while switching back to page from API pane", function () {
      //switch to tab 2 and select widget a button inside tab 2 in page1
      cy.get(".t--tabid-tab2").click({ force: true });
      EditorNavigation.SelectEntityByName("Tabs1", EntityType.Widget);
      PageLeftPane.expandCollapseItem("Tabs1", true);
      PageLeftPane.expandCollapseItem("Tab 2", true);
      EditorNavigation.SelectEntityByName("Button4", EntityType.Widget);

      //verify the tab 2 is open and Button 4 is selected in page1
      cy.get(".is-selected").should("contain", "Tab 2");
      cy.get(".t--property-pane-title").should("contain", "Button4");

      //navigate to API1
      EditorNavigation.SelectEntityByName(api1, EntityType.Api);
      cy.wait(500);

      //navigate back to page1
      EditorNavigation.ShowCanvas();
      cy.wait(500);

      //verify the tab 2 is open and Button 4 is selected in page1
      cy.get(".is-selected").should("contain", "Tab 2");
      cy.get(".t--property-pane-title").should("contain", "Button4");
    });

    it("11. Widgets inside modal widget should open when loaded from the URL", function () {
      //select widget in page1
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
        "Modal1",
      ]);

      //verify the Modal1 is open and Text1 is selected in page1
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
      cy.get(".t--modal-widget").should("have.length", 1);
      cy.get(".t--property-pane-title").should("contain", "Text1");

      // Get the current URL
      cy.url().then((url) => {
        //switch to page2
        EditorNavigation.SelectEntityByName(page2, EntityType.Page);

        //select widget in page2
        EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);

        //verify the widget is selected in page2
        cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

        // open the URL
        cy.visit(url);

        // wati for the page to load
        cy.wait(4000);

        //select widget in page1
        EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, [
          "Modal1",
        ]);

        //verify the Modal1 is open and Text1 is selected in page1
        cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
        cy.get(".t--modal-widget").should("have.length", 1);
        cy.get(".t--property-pane-title").should("contain", "Text1");
      });
    });
  },
);
