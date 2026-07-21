import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const cardHeader = '[data-card-zone="header"]';
const cardFooter = '[data-card-zone="footer"]';
const cardBody = '[data-card-zone="body"]';
const expandToggle = "[data-testid='t--card-expand-toggle']";
const deployedCardArticle = `${locators._widgetInDeployed("card1")} article`;

describe("Card widget spec", { tags: ["@tag.Widget", "@tag.Binding"] }, () => {
  before(() => {
    /**
     * On the canvas we have a Card widget
     */
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.CARD, 329, 124);
  });

  it("1. Validate the card zones render with default content", () => {
    agHelper.AssertElementExist(cardHeader);
    agHelper.AssertElementExist(cardBody);
    agHelper.AssertElementExist(cardFooter);
    agHelper.GetNAssertElementText(cardHeader, "Card title", "contain.text");
    agHelper.GetNAssertElementText(cardHeader, "Card subtitle", "contain.text");
  });

  it("2. Update title, subtitle and badge from the property pane", () => {
    EditorNavigation.SelectEntityByName("Card1", EntityType.Widget);
    propPane.UpdatePropertyFieldValue("Title", "Customer profile");
    propPane.UpdatePropertyFieldValue("Subtitle", "Acme Inc");
    propPane.UpdatePropertyFieldValue("Badge text", "Active");
    agHelper.GetNAssertElementText(
      cardHeader,
      "Customer profile",
      "contain.text",
    );
    agHelper.GetNAssertElementText(cardHeader, "Acme Inc", "contain.text");
    agHelper.GetNAssertElementText(cardHeader, "Active", "contain.text");
  });

  it("3. Toggle header and footer visibility", () => {
    EditorNavigation.SelectEntityByName("Card1", EntityType.Widget);
    propPane.TogglePropertyState("Show header", "Off");
    agHelper.AssertElementAbsence(cardHeader);
    propPane.TogglePropertyState("Show footer", "Off");
    agHelper.AssertElementAbsence(cardFooter);
    propPane.TogglePropertyState("Show header", "On");
    agHelper.AssertElementExist(cardHeader);
    propPane.TogglePropertyState("Show footer", "On");
    agHelper.AssertElementExist(cardFooter);
  });

  it("4. Fire onCardClick when clickable and the card chrome is clicked", () => {
    EditorNavigation.SelectEntityByName("Card1", EntityType.Widget);
    propPane.TogglePropertyState("Clickable", "On");
    propPane.EnterJSContext(
      "onCardClick",
      "{{showAlert('Card clicked','success')}}",
      true,
      true,
    );
    deployMode.DeployApp(locators._widgetInDeployed("card1"));
    // Clicking the header (card chrome) fires the event; the body
    // canvas and footer are excluded by design.
    agHelper.GetNClick(cardHeader);
    agHelper.ValidateToastMessage("Card clicked");
    deployMode.NavigateBacktoEditor();
  });

  it("5. Toggle selection on click when selection is enabled", () => {
    EditorNavigation.SelectEntityByName("Card1", EntityType.Widget);
    propPane.TogglePropertyState("Enable selection", "On");
    deployMode.DeployApp(locators._widgetInDeployed("card1"));
    agHelper.AssertAttribute(deployedCardArticle, "aria-pressed", "false");
    agHelper.GetNClick(cardHeader);
    agHelper.AssertAttribute(deployedCardArticle, "aria-pressed", "true");
    deployMode.NavigateBacktoEditor();
  });

  it("6. Collapse the card body with the header chevron", () => {
    EditorNavigation.SelectEntityByName("Card1", EntityType.Widget);
    propPane.TogglePropertyState("Enable selection", "Off");
    propPane.TogglePropertyState("Enable expand and collapse", "On");
    agHelper.AssertElementExist(expandToggle);
    deployMode.DeployApp(locators._widgetInDeployed("card1"));
    agHelper.AssertAttribute(expandToggle, "aria-expanded", "true");
    agHelper.AssertElementExist(cardBody);
    agHelper.GetNClick(expandToggle);
    agHelper.AssertAttribute(expandToggle, "aria-expanded", "false");
    agHelper.AssertElementAbsence(cardBody);
    deployMode.NavigateBacktoEditor();
  });
});
