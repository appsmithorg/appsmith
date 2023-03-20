const dsl = require("../../../../../fixtures/Listv2/simpleLargeListv2.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("List Widget V2 Functionality", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("should validate that all widgets can be added to List", () => {
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

    allowed.forEach((widget) => {
      cy.dragAndDropToWidget(widget, "listwidgetv2", { x: 350, y: 50 });
      cy.assertPageSave();
      cy.get(`.t--draggable-${widget}`).should("exist");
      cy.get(widgetsPage.removeWidget).click({ force: true });
      cy.wait("@updateLayout");
    });
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });
});
