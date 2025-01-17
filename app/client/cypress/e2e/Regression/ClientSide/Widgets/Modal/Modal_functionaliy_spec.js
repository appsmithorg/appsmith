import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgets = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Modal Widget Functionality",
  { tags: ["@tag.All", "@tag.Modal", "@tag.Binding"] },
  function () {
    afterEach(() => {
      _.agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      _.agHelper.RestoreLocalStorageCache();
      _.agHelper.AddDsl("ModalDsl");
    });

    it("1. Add new Modal", () => {
      cy.dragAndDropToCanvas("modalwidget", { x: 300, y: 300 });
      cy.get(".t--modal-widget").should("exist");
    });

    it("2. Open Existing Modal from created Widgets list", () => {
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
      cy.get(".t--modal-widget").should("exist");
      cy.CreateAPI("FirstAPI");
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
      cy.get(".t--modal-widget").should("exist");
    });

    it("3. Display toast on close action", () => {
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);

      cy.get(".t--property-control-onclose")
        .find(".t--js-toggle")
        .click({ force: true });
      cy.testJsontext("onclose", "{{showAlert('test','success')}}");
      cy.wait(1000); //make sure evaluated value disappears
      cy.get(widgets.modalCloseButton).click({ force: true });
      cy.get(commonlocators.toastmsg).contains("test");
    });

    it("4. Should paste modal widgets with main container as parentId", () => {
      const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);

      cy.wait(200);
      //cy.get("body").type(`{${modifierKey}}c`);
      _.agHelper.GetNClick(_.propPane._copyWidget);
      cy.get(commonlocators.toastBody).first().contains("Copied");

      cy.wait(1000); //make sure evaluated value disappears
      cy.get(widgets.modalCloseButton).click({ force: true });
      cy.get(".t--modal-widget").should("have.length", 0);

      cy.get("body").type(`{${modifierKey}}v`);

      PageLeftPane.assertPresence("Modal1Copy");
      //make sure modalis open on paste
      cy.get(".t--modal-widget").should("have.length", 1);
    });

    it("5. should select modal when clicked on modal label", () => {
      //open modal
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);

      cy.get(".t--modal-widget").should("exist");

      //select text widget inside the modal
      cy.get(".t--modal-widget").find(".t--widget-textwidget").click();
      cy.get(".t--modal-widget")
        .find(".t--widget-textwidget div[data-testid='t--selected']")
        .should("have.length", 1);

      //click on modal's widgetName Label
      cy.get(".t--modal-widget").click();
      cy.get(widgets.widgetNameSpan).click({
        force: true,
      });

      //verify the modal1 is selected
      cy.get(".t--property-pane-title").should("contain", "Modal1");
    });

    it("6. It should paste modal widget on main Container even when copied in group and paste when a container is selected", () => {
      const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

      //add an additional modal widget and a container widget
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.MODAL,
        300,
        300,
      );
      cy.get(widgets.modalCloseButton).click({ force: true }).wait(200);
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.CONTAINER,
        300,
        300,
      );
      PageLeftPane.switchSegment(PagePaneSegment.UI);

      //select all widgets and copy
      cy.get("body").type(`{${modifierKey}}a`);
      cy.get("body").type(`{${modifierKey}}c`);

      //select container widget
      cy.get(`#div-selection-0`).click({
        force: true,
      });
      EditorNavigation.SelectEntityByName("Container1", EntityType.Widget);

      //paste
      cy.get("body").type(`{${modifierKey}}v`);

      PageLeftPane.switchSegment(PagePaneSegment.UI);

      //verify that the two modal widget should have pasted on the main canvas
      PageLeftPane.assertPresence("Modal1");
      PageLeftPane.assertPresence("Modal1Copy");
    });
  },
);
