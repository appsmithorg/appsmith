import {
  agHelper,
  entityExplorer,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import IDELocators from "../../../../locators/IdeLocators.json";

describe("IDE add pane interactions", { tags: ["@tag.IDE"] }, () => {
  it("1. UI tab add interactions", () => {
    // check add pane is open
    cy.selectByTestId(IDELocators.UiAddPane).should("have.length", 1);
    // check for close icon
    cy.selectByTestId(IDELocators.UiCloseButton).should("have.length", 1);
    // close add pane to show blank state
    cy.selectByTestId(IDELocators.UiCloseButton).click();
    // check blank state add button
    cy.selectByTestId(IDELocators.BlankStateAddBtn).should("have.length", 1);
    // click on add button and check add state
    cy.selectByTestId(IDELocators.BlankStateAddBtn).click();
    // check add pane
    cy.selectByTestId(IDELocators.UiAddPane).should("have.length", 1);
    // drag and drop a widget and list view should be opened
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });
    // check listing ui
    cy.selectByTestId(IDELocators.UiWidgetListing).should("have.length", 1);
    // click on canvas and check add pane visible or not
    cy.selectByTestId(IDELocators.UiCanvas).click();
    // check add pane
    cy.selectByTestId(IDELocators.UiAddPane).should("have.length", 1);
  });
});
