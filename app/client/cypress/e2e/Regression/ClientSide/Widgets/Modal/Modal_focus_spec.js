import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../support/Pages/EditorNavigation";

const widgets = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Modal focus", { tags: ["@tag.Widget", "@tag.Modal", "@tag.Binding"] }, function () {
  const someInputText = "some text";

  function setupModalWithInputWidget() {
    //drag a button to open modal
    cy.dragAndDropToCanvas("buttonwidget", { x: 400, y: 550 });
    cy.openPropertyPane("buttonwidget");
    cy.get(widgets.toggleOnClick).click();

    cy.updateCodeInput(
      ".t--property-control-onclick",
      `{{showModal(Modal1.name)}}`,
    );
    //add modal
    EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
    cy.get(widgets.modalWidget).should("exist");

    PageLeftPane.switchToAddNew();

    cy.wait(500);
    //drag input field into modal
    cy.get(".t--widget-card-draggable-inputwidgetv2")
      .first()
      .trigger("dragstart", {
        force: true,
      });

    cy.get(widgets.modalWidget)
      .scrollIntoView()
      .trigger("mousemove", 50, 100, { eventConstructor: "MouseEvent" })
      .trigger("mousemove", 50, 100, { eventConstructor: "MouseEvent" })
      .trigger("mouseup", 50, 100, { eventConstructor: "MouseEvent" });
  }

  after(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  before(() => {
    _.agHelper.RestoreLocalStorageCache();
    _.agHelper.AddDsl("ModalDsl");
  });

  it("1. Should focus on the input field when autofocus for the input field is enabled", () => {
    setupModalWithInputWidget();
    cy.openPropertyPaneFromModal("inputwidgetv2");

    // autofocus for input field is enabled
    cy.get(".t--property-control-autofocus")
      .find(".ads-v2-switch")
      .click({ force: true });
    //enter some text to the input field
    cy.get(`${widgets.modalWidget} .t--widget-inputwidgetv2 input`)
      .click()
      .type(someInputText);

    //close Modal
    cy.get(widgets.modalCloseButton).click({ force: true });
    cy.get(widgets.modalCloseButton).should("not.be.visible");

    cy.wait(1500);
    //open the modal
    cy.get(widgets.widgetBtn).contains("Submit").click({ force: true });
    //check if the focus is on the input field
    cy.focused().should("have.value", someInputText);
  });
  it("2. Should not focus on the input field if autofocus is disabled", () => {
    cy.openPropertyPaneFromModal("inputwidgetv2");
    // autofocus for input field is disabled
    cy.get(".t--property-control-autofocus")
      .find(".ads-v2-switch")
      .click({ force: true });
    //close Modal
    cy.get(widgets.modalCloseButton).click({ force: true });
    cy.get(widgets.modalCloseButton).should("not.be.visible");

    //open the modal
    cy.get(widgets.modalWidget).should("not.exist");
    cy.get(widgets.widgetBtn).contains("Submit").click({ force: true });
    //check if the focus is not on the input field
    cy.focused().should("not.have.value", someInputText);
  });
});
