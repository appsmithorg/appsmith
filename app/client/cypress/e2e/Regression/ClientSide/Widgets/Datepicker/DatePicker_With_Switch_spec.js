import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const dayjs = require("dayjs");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Switch Widget within Form widget Functionality",
  { tags: ["@tag.Widget", "@tag.Datepicker", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("datepicker_switchDsl");
    });
    it("Switch Widget Functionality check with success message", function () {
      cy.openPropertyPane("switchwidget");
      cy.widgetText(
        "Toggler",
        formWidgetsPage.switchWidget,
        widgetsPage.widgetNameSpan,
      );
      cy.testCodeMirror(this.dataSet.switchInputName);
      cy.get(widgetsPage.switchLabel).should("have.text", "Switch1");
      _.agHelper.CheckUncheck(widgetsPage.defaultcheck);
      cy.getAlert("onChange");
      cy.closePropertyPane();
    });
    // Skipping tests due to issue - https://www.notion.so/appsmith/f353d8c6bd664f79ad858a42010cdfc8?v=f04cde23f6424aeb9d5a6e389cd172bd&p=0717892d43684c40bae4e2c87b8308cb&pm=s
    it.skip("Date Widget with Reset widget being switch widget", function () {
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);

      cy.get(formWidgetsPage.defaultDate).click();
      cy.SetDateToToday();
      cy.setDate(1, "ddd MMM DD YYYY");
      const nextDay = dayjs().format("DD/MM/YYYY");
      cy.log(nextDay);
      cy.selectResetWidget("onDateSelected");
      cy.selectWidgetForReset("Toggler");
      cy.closePropertyPane();
      cy.get(widgetsPage.switchWidget).click();
      cy.get(widgetsPage.toastMsg)
        .last()
        .invoke("text")
        .then((text) => {
          const toasttext = text;
          cy.log(toasttext);
          expect(text.trim()).to.equal(toasttext.trim());
        });
      cy.get(widgetsPage.switchWidgetInactive).should("be.visible");
    });

    it.skip("DatePicker-Date change and validate switch widget status", function () {
      cy.get(widgetsPage.datepickerInput).click({ force: true });
      cy.SetDateToToday();
      cy.get(widgetsPage.switchWidgetActive).should("be.visible");
      cy.get(".t--toast-action span")
        .last()
        .invoke("text")
        .then((text) => {
          const toasttext = text;
          cy.log(toasttext);
          expect(text.trim()).to.equal(toasttext.trim());
        });
    });
  },
);

afterEach(() => {
  // put your clean up code if any
});
