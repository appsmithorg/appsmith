import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "List Widget V2 Functionality",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("Listv2/simpleLargeListv2");
    });

    const allowed = [
      "audiowidget",
      "buttongroupwidget",
      "buttonwidget",
      "chartwidget",
      "checkboxwidget",
      "checkboxgroupwidget",
      "dividerwidget",
      "iconbuttonwidget",
      "iframewidget",
      "imagewidget",
      "inputwidgetv2",
      "mapchartwidget",
      "mapwidget",
      "menubuttonwidget",
      "progresswidget",
      "statboxwidget",
      "switchwidget",
      "switchgroupwidget",
      "textwidget",
      "videowidget",
      "containerwidget",
      "tablewidgetv2",
      "radiogroupwidget",
      "tabswidget",
      "richtexteditorwidget",
      "datepickerwidget2",
      "formwidget",
      "filepickerwidgetv2",
      "audiorecorderwidget",
      "documentviewerwidget",
      "multiselecttreewidget",
      "singleselecttreewidget",
      "camerawidget",
      "selectwidget",
      "multiselectwidgetv2",
      "phoneinputwidget",
      "currencyinputwidget",
      "listwidgetv2",
    ];

    it(
      "should validate that all widgets can be added to List",
      { tags: ["@tag.excludeForAirgap"] },
      () => {
        PageLeftPane.switchSegment(PagePaneSegment.UI);
        allowed.forEach((widget) => {
          entityExplorer.DragDropWidgetNVerify(widget);
          //cy.dragAndDropToWidget(widget, "listwidgetv2", { x: 350, y: 50 });
          agHelper.GetNClick(propPane._deleteWidget);
          agHelper.AssertAutoSave();
          cy.wait(800);
        });
      },
    );

    it(
      "airgap",
      "should validate that all widgets can be added to List except mapwidget - airgap",
      () => {
        PageLeftPane.switchSegment(PagePaneSegment.UI);
        const airgapAllowed = allowed.filter(
          (widget) => widget !== "mapwidget",
        );
        airgapAllowed.forEach((widget) => {
          entityExplorer.DragDropWidgetNVerify(widget);

          //cy.dragAndDropToWidget(widget, "listwidgetv2", { x: 350, y: 50 });
          agHelper.AssertAutoSave();
          cy.get(`.t--draggable-${widget}`).should("exist");
          cy.get(widgetsPage.removeWidget).click({ force: true });
          agHelper.AssertAutoSave();
          cy.wait(800);
        });
      },
    );
  },
);
