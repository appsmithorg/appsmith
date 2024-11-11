const commonlocators = require("../../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../../locators/ViewWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  dataManager,
  deployMode,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Image Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Image", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("displayWidgetDsl");
    });

    it("1. Image Widget Functionality", function () {
      cy.openPropertyPane("imagewidget");
      /**
       * @param{Text} Random Text
       * @param{ImageWidget}Mouseover
       * @param{ImagePre Css} Assertion
       */
      cy.widgetText(
        "img",
        viewWidgetsPage.imageWidget,
        widgetsPage.widgetNameSpan,
      );
      cy.testJsontext("defaultimage", this.dataSet.defaultimage);
      cy.wait(1000);
      cy.focused().blur();
      /**
       * @param{URL} ImageUrl
       */
      cy.testCodeMirror(this.dataSet.NewImage);
      cy.get(viewWidgetsPage.imageinner)
        .invoke("attr", "src")
        .should("contain", this.dataSet.validateImage);
      cy.closePropertyPane();
    });

    it("2. No Zoom functionality check", function () {
      cy.openPropertyPane("imagewidget");
      //Zoom validation
      cy.changeZoomLevel("1x (No Zoom)");

      cy.get(commonlocators.imgWidget)
        .invoke("attr", "style")
        .should("not.contain", "zoom-in");
      deployMode.DeployApp(publish.imageWidget);
      // Image Widget Functionality To Validate Image
      cy.get(publish.imageWidget + " " + "img")
        .invoke("attr", "src")
        .should("contain", this.dataSet.NewImage);
    });

    it("3. Image Widget Functionality To Check/Uncheck Visible Widget", function () {
      deployMode.NavigateBacktoEditor();
      cy.openPropertyPane("imagewidget");
      agHelper.CheckUncheck(commonlocators.visibleCheckbox, false);
      deployMode.DeployApp();
      cy.get(publish.imageWidget).should("not.exist");
      deployMode.NavigateBacktoEditor();
      //Image Widget Functionality To Check Visible Widget", function () {
      cy.openPropertyPane("imagewidget");
      agHelper.CheckUncheck(commonlocators.visibleCheckbox);
      deployMode.DeployApp(publish.imageWidget);
      deployMode.NavigateBacktoEditor();
    });

    it("4. In case of an image loading error, show off the error message", () => {
      cy.openPropertyPane("imagewidget");
      // Invalid image url
      const invalidImageUrl =
        "http://host.docker.internal:4200/photo-not-exists.jpeg";
      cy.testCodeMirror(invalidImageUrl);

      // Show off error message
      cy.get(
        `${viewWidgetsPage.imageWidget} div[data-testid=styledImage]`,
      ).should("not.exist");
      cy.get(
        `${viewWidgetsPage.imageWidget} [data-testid="error-container"]`,
      ).contains("Unable to display the image");
    });
  },
);
