import EditorNavigation, {
  EntityType,
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
  { tags: ["@tag.Widget", "@tag.List"] },
  function () {
    before(() => {
      agHelper.AddDsl("Listv2/simpleLargeListv2");
    });

    const allowed = [
      ["audiowidget", "Audio1"],
      ["buttongroupwidget", "ButtonGroup1"],
      ["buttonwidget", "Button1"],
      ["chartwidget", "Chart1"],
      ["checkboxwidget", "Checkbox1"],
      ["checkboxgroupwidget", "CheckboxGroup1"],
      ["dividerwidget", "Divider1"],
      ["iconbuttonwidget", "IconButton1"],
      ["iframewidget", "Iframe1"],
      ["imagewidget", "Image1"],
      ["inputwidgetv2", "Input1"],
      ["mapchartwidget", "MapChart1"],
      ["mapwidget", "Map1"],
      ["menubuttonwidget", "MenuButton1"],
      ["progresswidget", "Progress1"],
      ["statboxwidget", "Statbox1"],
      ["switchwidget", "Switch1"],
      ["switchgroupwidget", "SwitchGroup1"],
      ["textwidget", "Text1"],
      ["videowidget", "Video1"],
      ["containerwidget", "Container2"],
      ["tablewidgetv2", "Table1"],
      ["radiogroupwidget", "RadioGroup1"],
      ["tabswidget", "Tabs1"],
      ["richtexteditorwidget", "RichTextEditor1"],
      ["datepickerwidget2", "DatePicker1"],
      ["formwidget", "Form1"],
      ["filepickerwidgetv2", "FilePicker1"],
      ["audiorecorderwidget", "AudioRecorder1"],
      ["documentviewerwidget", "DocumentViewer1"],
      ["multiselecttreewidget", "MultiSelectTree1"],
      ["singleselecttreewidget", "SelectTree1"],
      ["camerawidget", "Camera1"],
      ["selectwidget", "Select1"],
      ["multiselectwidgetv2", "MultiSelect1"],
      ["phoneinputwidget", "PhoneInput1"],
      ["currencyinputwidget", "CurrencyInput1"],
      ["listwidgetv2", "List1"],
    ];

    it(
      "should validate that all widgets can be added to List",
      { tags: ["@tag.excludeForAirgap"] },
      () => {
        PageLeftPane.switchSegment(PagePaneSegment.UI);
        allowed.forEach(([widget, widgetName]) => {
          entityExplorer.DragDropWidgetNVerify(widget);
          EditorNavigation.SelectEntityByName(
            widgetName,
            EntityType.Widget,
            {},
            ["List1", "Container1"],
          );
          agHelper.GetNClick(propPane._deleteWidget);
          cy.wait("@updateLayout");
        });
      },
    );

    it(
      "airgap",
      "should validate that all widgets can be added to List except mapwidget - airgap",
      () => {
        PageLeftPane.switchSegment(PagePaneSegment.UI);
        const airgapAllowed = allowed.filter(
          ([widget]) => widget !== "mapwidget",
        );
        airgapAllowed.forEach(([widget, widgetName]) => {
          entityExplorer.DragDropWidgetNVerify(widget);
          EditorNavigation.SelectEntityByName(widgetName, EntityType.Widget);
          //cy.dragAndDropToWidget(widget, "listwidgetv2", { x: 350, y: 50 });
          cy.assertPageSave();
          cy.get(`.t--draggable-${widget}`).should("exist");
          cy.get(widgetsPage.removeWidget).click({ force: true });
          cy.wait("@updateLayout");
        });
      },
    );
  },
);
