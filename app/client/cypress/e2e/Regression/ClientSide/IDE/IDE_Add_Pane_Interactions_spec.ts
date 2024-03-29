import EditorNavigation, {
  EditorViewMode,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import IDELocators from "../../../../locators/IdeLocators.json";

describe("IDE add pane interactions", { tags: ["@tag.IDE"] }, () => {
  it("1. UI tab add interactions", () => {
    // check add pane is open
    cy.selectByTestId(IDELocators.UiAddPane).should("have.length", 1);
    // close add pane to show blank state
    cy.selectByTestId(IDELocators.AddPaneCloseButton).click();
    // click on add button and check add state
    cy.selectByTestId(IDELocators.BlankStateAddBtn).click();
    // check add pane
    cy.selectByTestId(IDELocators.UiAddPane).should("have.length", 1);
    // drag and drop a widget and list view should be opened
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });
    // check listing ui
    cy.selectByTestId(IDELocators.UiWidgetListing).should("have.length", 1);
    // click add button
    cy.selectByTestId(IDELocators.UiWidgetListingAddBtn).click();
    // check add pane is open
    cy.selectByTestId(IDELocators.UiAddPane).should("have.length", 1);
    // close add pane
    cy.selectByTestId(IDELocators.AddPaneCloseButton).click();
    // click on canvas and check add pane visible or not
    cy.selectByTestId(IDELocators.UiCanvas).click();
    // check add pane
    cy.selectByTestId(IDELocators.UiAddPane).should("have.length", 1);
  });

  it("2. JS tab add interactions", () => {
    /** Fullscreen  */
    //  switch to JS  tab from UI
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    // check and click on blank state add button
    cy.selectByTestId(IDELocators.BlankStateAddBtn).click();
    // check listing UI
    cy.selectByTestId(IDELocators.JsObjectsListing).should("have.length", 1);
    // click on add btn in the listing UI
    cy.selectByTestId(IDELocators.JsObjectsAddBtn).click();
    // check item got added or not
    cy.selectByTestId(IDELocators.JsObjectListItem).should("have.length", 2);
    /** Splitscreen  */
    // switch to splitscreen
    EditorNavigation.SwitchScreenMode(EditorViewMode.SplitScreen);
    // click on add
    cy.selectByTestId(IDELocators.SplitscreenAddBtn).click();
    // check tabs count to verify js added or not
    cy.selectByTestId(IDELocators.EditorTabs)
      .children(".editor-tab")
      .should("have.length", 3);
    // switch back to full screen
    EditorNavigation.SwitchScreenMode(EditorViewMode.FullScreen);
    // delete all js objects and check add screen
    cy.get(".editor-tab").each(($ele) => {
      cy.selectByTestId("more-action-trigger").click();
      cy.get(".t--apiFormDeleteBtn").click();
      cy.get(".t--apiFormDeleteBtn").click();
    });
    cy.selectByTestId(IDELocators.JsObjectsAddPane).should("have.length", 1);
  });

  it("3. Queries tab add interactions", () => {
    /** Fullscreen  */
    //  switch to Query  tab from JS
    PageLeftPane.switchSegment(PagePaneSegment.Queries);
    // check and click on blank state add button
    cy.selectByTestId(IDELocators.BlankStateAddBtn).click();
    // check add pane
    cy.selectByTestId(IDELocators.QueryAddPane).should("have.length", 1);
    // close add pane
    cy.selectByTestId(IDELocators.AddPaneCloseButton).click();
    // open add pane to add item
    cy.selectByTestId(IDELocators.BlankStateAddBtn).click();
    // add item
    cy.get(".t--new-blank-api").children("div").first().click();
    // check item added or not
    cy.selectByTestId("t--entity-item-Api1").should("have.length", 1);
    /** Splitscreen  */
    // switch to splitscreen
    EditorNavigation.SwitchScreenMode(EditorViewMode.SplitScreen);
    // click on add
    cy.selectByTestId(IDELocators.SplitscreenAddBtn).click();
    // check add pane
    cy.selectByTestId(IDELocators.QueryAddPane).should("have.length", 1);
    // add item
    cy.get(".t--new-blank-api").children("div").first().click();
    // check tabs count to verify js added or not
    cy.selectByTestId(IDELocators.EditorTabs)
      .children(".editor-tab")
      .should("have.length", 2);
    // switch back to full screen
    EditorNavigation.SwitchScreenMode(EditorViewMode.FullScreen);
    // delete all queries and check add screen
    cy.get(".editor-tab").each(($ele) => {
      cy.selectByTestId("more-action-trigger").click();
      cy.get(".t--apiFormDeleteBtn").click();
      cy.get(".t--apiFormDeleteBtn").click();
    });
    cy.selectByTestId(IDELocators.QueryAddPane).should("have.length", 1);
  });
});
