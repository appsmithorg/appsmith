const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "DatePicker",
  { tags: ["@tag.All", "@tag.Datepicker", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("newFormDsl");

      cy.openPropertyPane("datepickerwidget");
    });

    it("1. Datepicker default date validation with js binding", function () {
      cy.get(".t--property-control-defaultdate input").clear();
      cy.get(formWidgetsPage.toggleJsDefaultDate).click();
      cy.testJsontext(
        "defaultdate",
        "{{moment('14/02/2021', 'DD/MM/YYYY').format('DD/MM/YYYY')}}",
      );
      cy.get(formWidgetsPage.toggleJsMinDate).click();
      cy.testJsontext(
        "mindate",
        "{{moment('12/02/2021', 'DD/MM/YYYY').format('DD/MM/YYYY')}}",
      );
      cy.get(formWidgetsPage.toggleJsMaxDate).click();
      cy.testJsontext(
        "maxdate",
        "{{moment('17/02/2021', 'DD/MM/YYYY').format('DD/MM/YYYY')}}",
      );
      cy.get(formWidgetsPage.datepickerWidget + " .bp3-input").should(
        "contain.value",
        "14/02/2021",
      );
      _.deployMode.DeployApp();
      cy.get(publishPage.datepickerWidget + " .bp3-input").should(
        "contain.value",
        "14/02/2021",
      );
    });

    afterEach(() => {
      _.deployMode.NavigateBacktoEditor();
    });
  },
);
