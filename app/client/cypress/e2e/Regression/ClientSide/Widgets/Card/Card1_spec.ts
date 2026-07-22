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
const deployedCardArticle = `${locators._widgetInDeployed(
  "card1",
)} [data-card-zone="card"]`;

// Expected assertion values, named to avoid inline strings in assertions.
const DEFAULT_TITLE = "Card title";
const DEFAULT_SUBTITLE = "Card subtitle";
const UPDATED_TITLE = "Customer profile";
const UPDATED_SUBTITLE = "Acme Inc";
const UPDATED_BADGE = "Active";
const CLICK_TOAST = "Card clicked";
const ARIA_PRESSED_UNSELECTED = "false";
const ARIA_PRESSED_SELECTED = "true";
const ARIA_EXPANDED_OPEN = "true";
const ARIA_EXPANDED_COLLAPSED = "false";

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
    agHelper.GetNAssertElementText(cardHeader, DEFAULT_TITLE, "contain.text");
    agHelper.GetNAssertElementText(
      cardHeader,
      DEFAULT_SUBTITLE,
      "contain.text",
    );
  });

  it("2. Update title, subtitle and badge from the property pane", () => {
    EditorNavigation.SelectEntityByName("Card1", EntityType.Widget);
    propPane.UpdatePropertyFieldValue("Title", UPDATED_TITLE);
    propPane.UpdatePropertyFieldValue("Subtitle", UPDATED_SUBTITLE);
    propPane.UpdatePropertyFieldValue("Badge text", UPDATED_BADGE);
    agHelper.GetNAssertElementText(cardHeader, UPDATED_TITLE, "contain.text");
    agHelper.GetNAssertElementText(
      cardHeader,
      UPDATED_SUBTITLE,
      "contain.text",
    );
    agHelper.GetNAssertElementText(cardHeader, UPDATED_BADGE, "contain.text");
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
    agHelper.ValidateToastMessage(CLICK_TOAST);
    deployMode.NavigateBacktoEditor();
  });

  it("5. Toggle selection on click when selection is enabled", () => {
    EditorNavigation.SelectEntityByName("Card1", EntityType.Widget);
    propPane.TogglePropertyState("Enable selection", "On");
    deployMode.DeployApp(locators._widgetInDeployed("card1"));
    agHelper.AssertAttribute(
      deployedCardArticle,
      "aria-pressed",
      ARIA_PRESSED_UNSELECTED,
    );
    agHelper.GetNClick(cardHeader);
    agHelper.AssertAttribute(
      deployedCardArticle,
      "aria-pressed",
      ARIA_PRESSED_SELECTED,
    );
    deployMode.NavigateBacktoEditor();
  });

  it("6. Collapse the card body with the header chevron", () => {
    EditorNavigation.SelectEntityByName("Card1", EntityType.Widget);
    propPane.TogglePropertyState("Enable selection", "Off");
    propPane.TogglePropertyState("Enable expand and collapse", "On");
    agHelper.AssertElementExist(expandToggle);
    deployMode.DeployApp(locators._widgetInDeployed("card1"));
    agHelper.AssertAttribute(expandToggle, "aria-expanded", ARIA_EXPANDED_OPEN);
    agHelper.AssertElementExist(cardBody);
    agHelper.GetNClick(expandToggle);
    agHelper.AssertAttribute(
      expandToggle,
      "aria-expanded",
      ARIA_EXPANDED_COLLAPSED,
    );
    agHelper.AssertElementAbsence(cardBody);
    deployMode.NavigateBacktoEditor();
  });
});
