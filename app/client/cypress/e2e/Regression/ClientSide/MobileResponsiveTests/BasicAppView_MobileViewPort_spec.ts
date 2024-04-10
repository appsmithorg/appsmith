import {
  agHelper,
  autoLayout,
  entityExplorer,
  deployMode,
  draggableWidgets,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe("Validating Mobile View", () => {
  before(() => {
    autoLayout.ConvertToAutoLayoutAndVerify(false);
  });

  beforeEach(() => {
    // Cleanup the canvas before each test
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    PageLeftPane.switchToAddNew();
    agHelper.SelectAllWidgets();
    agHelper.PressDelete();
    agHelper.SetCanvasViewportWidth(808);
  });

  it(`1.  Verify if elements are visible in Mobile view`, () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    deployMode.DeployApp();
    cy.viewport("iphone-4");
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed("buttonwidget"),
    );
  });
});
