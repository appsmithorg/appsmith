const dsl = require("../../../../../fixtures/EmptyListWidget.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("List Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("should validate that restricted widgets cannot be added to List", () => {
    cy.get(explorer.widgetSwitchId).click();

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
    ];

    const disallowed = [
      "containerwidget",
      "tablewidgetv2",
      "radiogroupwidget",
      "tabswidget",
      "richtexteditorwidget",
      "datepickerwidget2",
      "formwidget",
      "listwidget",
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
    ];

    allowed.forEach((widget) => {
      cy.dragAndDropToWidget(widget, "listwidget", { x: 50, y: 50 });
      cy.assertPageSave();
      cy.get(`.t--draggable-${widget}`).should("exist");
      cy.get(widgetsPage.removeWidget).click({ force: true });
      cy.wait("@updateLayout");
    });

    disallowed.forEach((widget) => {
      cy.dragAndDropToWidget(widget, "listwidget", { x: 50, y: 50 });
      cy.validateToastMessage(
        "This widget cannot be used inside the list widget.",
      );
    });
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });
});
