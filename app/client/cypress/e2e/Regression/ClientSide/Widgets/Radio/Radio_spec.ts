import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import {
  agHelper,
  propPane,
  deployMode,
  locators,
  draggableWidgets,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Radio Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Radio", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("newFormDsl");
    });

    it("1. Radio Widget Functionality", function () {
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.expandCollapseItem("Container3");
      propPane.RenameWidget("RadioGroup1", "RGtest");
      /**
       * @param{IndexValue} Provide Input Index Value
       * @param{Text} Index Text Value.
       *
       */
      cy.radioInput(0, this.dataSet.radio1);
      cy.get(formWidgetsPage.labelradio).eq(0).should("have.text", "test1");
      cy.radioInput(1, "1");
      cy.radioInput(2, this.dataSet.radio2);
      cy.get(formWidgetsPage.labelradio)
        .eq(1)
        .should("have.text", this.dataSet.radio2);
      cy.radioInput(3, "2");
      agHelper.ClickButton("Add option");
      cy.radioInput(4, this.dataSet.radio4);
      cy.get(formWidgetsPage.deleteradiovalue).eq(1).click({ force: true });
      cy.get(formWidgetsPage.labelradio).should("not.have.value", "test2");
      /**
       * @param{Show Alert} Css for InputChange
       */
      cy.getAlert("onSelectionChange");
      cy.get(formWidgetsPage.defaultSelect);
      cy.get(".t--add-action-onSelectionChange")
        .scrollIntoView()
        .click({ force: true })
        .type("2");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      );
      agHelper.AssertExistingCheckedState(
        locators._checkboxTypeByOption("test1"),
      );
      agHelper.CheckUncheck(locators._checkboxTypeByOption("test4"));
      agHelper.ValidateToastMessage("hello");
      deployMode.NavigateBacktoEditor();
    });

    it("2. Radio Functionality To Check/Uncheck Visible property", function () {
      cy.openPropertyPane("radiogroupwidget");
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      cy.get(publish.radioWidget + " " + "input").should("not.exist");
      deployMode.NavigateBacktoEditor();
      //Radio Functionality To Check Visible Widget
      cy.openPropertyPane("radiogroupwidget");
      propPane.TogglePropertyState("Visible", "On");
      deployMode.DeployApp();
      agHelper.AssertExistingCheckedState(
        locators._checkboxTypeByOption("test1"),
      );
    });
  },
);
