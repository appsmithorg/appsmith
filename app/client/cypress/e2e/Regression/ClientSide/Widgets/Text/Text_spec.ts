const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Text Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Text", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("displayWidgetDsl");
    });

    beforeEach(() => {
      cy.openPropertyPane("textwidget");
    });

    it("1. Text-TextStyle Heading, Text Name Validation", function () {
      //changing the Text Name and verifying
      cy.widgetText(
        this.dataSet.TextName,
        widgetsPage.textWidget,
        widgetsPage.widgetNameSpan,
      );
      //Changing the text label
      _.propPane.UpdatePropertyFieldValue("Text", this.dataSet.TextLabelValue);
      _.propPane.MoveToTab("Style");
      _.propPane.SelectPropertiesDropDown("Font size", "M");
      cy.wait("@updateLayout");
      _.deployMode.DeployApp();
      cy.get(commonlocators.headingTextStyle)
        .should("have.text", this.dataSet.TextLabelValue)
        .should("have.css", "font-size", "16px");
    });

    it("2. Text Email Parsing Validation", function () {
      cy.testCodeMirror("ab.end@domain.com");
      cy.wait("@updateLayout");
      _.deployMode.DeployApp();
      cy.get(commonlocators.headingTextStyle + " a").should(
        "have.attr",
        "href",
        "mailto:ab.end@domain.com",
      );
    });

    it("3. Text-TextStyle Label Validation", function () {
      cy.testCodeMirror(this.dataSet.TextLabelValue);
      cy.moveToStyleTab();
      //Changing the Text Style's and validating
      cy.ChangeTextStyle(
        this.dataSet.TextLabel,
        commonlocators.labelTextStyle,
        this.dataSet.TextLabelValue,
      );
      _.deployMode.DeployApp();
      cy.get(commonlocators.labelTextStyle)
        .should("have.text", this.dataSet.TextLabelValue)
        .should("have.css", "font-size", "14px");
    });

    it("4. Text-TextStyle Body Validation", function () {
      cy.moveToStyleTab();
      cy.ChangeTextStyle(
        this.dataSet.TextBody,
        commonlocators.bodyTextStyle,
        this.dataSet.TextLabelValue,
      );
      _.deployMode.DeployApp();
      cy.get(commonlocators.bodyTextStyle)
        .should("have.text", this.dataSet.TextLabelValue)
        .should("have.css", "font-size", "20px");
    });

    it("5. Text widget depends on itself", function () {
      cy.testJsontext("text", `{{${this.dataSet.TextName}}}`);
      cy.get(commonlocators.toastBody).first().contains("Cyclic");
      _.deployMode.DeployApp();
      cy.get(commonlocators.bodyTextStyle).should(
        "have.text",
        `{{${this.dataSet.TextName}}}`,
      );
    });

    afterEach(() => {
      _.deployMode.NavigateBacktoEditor();
    });
  },
);
