const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const testdata = require("../../../../../fixtures/testdata.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget property pane feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableNewDslWithPagination");
    });

    // To be done:
    // Column Data type: Video
    it("1. Check open section and column data in property pane", function () {
      cy.openPropertyPane("tablewidget");

      // Validate the columns are visible in the property pane
      cy.tableColumnDataValidation("id");
      cy.tableColumnDataValidation("email");
      cy.tableColumnDataValidation("userName");
      cy.tableColumnDataValidation("productName");
      cy.tableColumnDataValidation("orderAmount");

      // Updating the column name ; "id" > "TestUpdated"
      cy.tableColumnPopertyUpdate("id", "TestUpdated");

      // Add new column in the table with name "CustomColumn"
      cy.addColumn("CustomColumn");

      cy.tableColumnDataValidation("customColumn1"); //To be updated later

      // Hide all other columns
      cy.hideColumn("email");
      cy.hideColumn("userName");
      cy.hideColumn("productName");
      cy.hideColumn("orderAmount");

      // Verifying the newly added column
      cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
    });

    it("2. Column Detail - Edit column name and validate test for computed value based on column type selected (Email, Number, Date)", function () {
      cy.wait(1000);
      cy.makeColumnVisible("email");
      cy.makeColumnVisible("userName");
      cy.makeColumnVisible("productName");
      cy.makeColumnVisible("orderAmount");
      cy.openPropertyPane("tablewidget");

      // Open column detail to be edited by draggable id
      cy.editColumn("id");
      // Change the column name
      cy.editColName("updatedId");
      // Reading single cell value of the table and verify it's value.
      cy.readTabledataPublish("1", "1").then((tabData) => {
        const tabValue = tabData;
        cy.log(tabData);
        expect(tabData).to.not.equal("2736212");
        // Changing the Computed value from "id" to "Email"
        cy.updateComputedValue(testdata.currentRowEmail);
        // Reading single cell value of the table and verify it's value.
        cy.readTabledataPublish("1", "0").then((tabData2) => {
          cy.log(tabData2);
          expect(tabData2).to.be.equal(tabValue);
          cy.log("computed value of plain text " + tabData2);
        });
      });

      // Changing Column data type from "Plain text" to "Number"
      cy.changeColumnType("Number", false);
      cy.readTabledataPublish("1", "4").then((tabData) => {
        cy.log(tabData);
        expect(tabData).to.not.equal("lindsay.ferguson@reqres.in");
        // Email to "orderAmount"
        cy.updateComputedValue(testdata.currentRowOrderAmt);
        cy.readTabledataPublish("1", "0").then((tabData2) => {
          cy.log(tabData2);
          expect(tabData2).to.be.equal(tabData);
          cy.log("computed value of number is " + tabData2);
        });
      });

      // Changing Column data type from "Number" to "Date"
      cy.changeColumnType("Date", false);
      // orderAmout to "Moment Date"
      cy.updateComputedValue(testdata.momentDate);
      cy.readTabledataPublish("1", "1").then((tabData) => {
        expect(tabData).to.not.equal("9.99");
        cy.log("computed value of Date is " + tabData);
      });

      // Changing Column data type from "URL" to "Video"
      /* const videoVal = 'https://youtu.be/Sc-m3ceZyfk';
    cy.changeColumnType("Video", false);
    // "Moement "date" to "Video"
    cy.updateComputedValue(videoVal);
    // cy.testJson  text("computedvalue", videoVal, )
    // Verifying the href of the Video added.
    cy.readTableLinkPublish("1", "1").then((hrefVal) => {
      expect(hrefVal).to.be.equal(videoVal);
    });*/
    });

    it("3. Column Detail - Edit column name and validate test for computed value based on column type selected (image, button , url)", function () {
      // Changing Column data type from "Date" to "Image"
      const imageVal = "http://host.docker.internal:4200/453-200x300.jpg";

      cy.changeColumnType("Image", false);
      // "Moement "date" to "Image"
      cy.updateComputedValue(imageVal);
      // Verifying the href of the image added.
      cy.readTableLinkPublish("1", "0").then((hrefVal) => {
        expect(hrefVal).to.be.contains(imageVal);
      });

      // change column data type to "icon button"
      cy.changeColumnType("Icon button", false);
      cy.wait(400);
      cy.get(commonlocators.selectedIcon).should("have.text", "add");

      cy.getTableDataSelector("0", "0").then((selector) => {
        cy.get(selector + " button.bp3-button [data-icon=add]").should("exist");
      });

      // Changing Column data type from "Date" to "URl"
      cy.readTabledataPublish("1", "1").then((actualEmail) => {
        cy.changeColumnType("URL", false);
        // "Image" to "url"
        cy.updateComputedValue(testdata.currentRowEmail);
        cy.readTabledataPublish("1", "0").then((tabData2) => {
          expect(tabData2)
            .to.equal("lindsay.ferguson@reqres.in")
            .to.eq(actualEmail);
          cy.log("computed value of URL is " + tabData2);
        });
      });
    });

    it("4. Test to validate text alignment", function () {
      // Verifying Center Alignment
      cy.xpath(widgetsPage.textCenterAlign).first().click({ force: true });
      cy.readTabledataValidateCSS("1", "0", "justify-content", "center", true);

      // Verifying Right Alignment
      cy.xpath(widgetsPage.rightAlign).first().click({ force: true });
      cy.readTabledataValidateCSS(
        "1",
        "0",
        "justify-content",
        "flex-end",
        true,
      );

      // Verifying Left Alignment
      cy.xpath(widgetsPage.leftAlign).first().click({ force: true });
      cy.readTabledataValidateCSS(
        "0",
        "0",
        "justify-content",
        "flex-start",
        true,
      );
    });

    it("5. Test to validate vertical alignment", function () {
      // Validate vertical alignemnt of Cell text to TOP
      cy.get(widgetsPage.verticalTop).click({ force: true });
      cy.readTabledataValidateCSS("1", "0", "align-items", "flex-start", true);
      // Validate vertical alignemnt of Cell text to Center
      cy.get(widgetsPage.verticalCenter).last().click({ force: true });
      cy.readTabledataValidateCSS("1", "0", "align-items", "center", true);
      // Validate vertical alignemnt of Cell text to Bottom
      cy.get(widgetsPage.verticalBottom).last().click({ force: true });
      cy.readTabledataValidateCSS("0", "0", "align-items", "flex-end", true);
    });

    it("6. Test to validate text color and text background", function () {
      cy.openPropertyPane("tablewidget");

      // Changing text color to rgb(219, 234, 254) and validate
      cy.selectColor("textcolor");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(5000);
      cy.wait("@updateLayout");
      cy.readTabledataValidateCSS("1", "0", "color", "rgb(219, 234, 254)");

      // Changing text color to PURPLE and validate using JS
      cy.get(widgetsPage.toggleJsColor).click({ force: true });
      cy.wait(500);
      cy.testCodeMirrorLast("purple");
      cy.wait("@updateLayout");
      cy.readTabledataValidateCSS("1", "0", "color", "rgb(128, 0, 128)");
      cy.get(commonlocators.editPropBackButton).click();
      // Changing Cell backgroud color to rgb(219, 234, 254) and validate
      cy.selectColor("cellbackgroundcolor");
      cy.readTabledataValidateCSS(
        "0",
        "0",
        "background",
        "rgb(219, 234, 254) none repeat scroll 0% 0% / auto padding-box border-box",
        true,
      );
      // Changing Cell backgroud color to PURPLE and validate using JS
      _.propPane.EnterJSContext("Cell background color", "purple");
      cy.wait("@updateLayout");
      cy.readTabledataValidateCSS(
        "0",
        "0",
        "background",
        "rgb(128, 0, 128) none repeat scroll 0% 0% / auto padding-box border-box",
        true,
      );
      // close property pane
      cy.closePropertyPane();
    });

    it("7. Table-Delete Verification", function () {
      // Open property pane
      cy.openPropertyPane("tablewidget");
      // Delete the Table widget
      cy.deleteWidget(widgetsPage.tableWidget);
      _.deployMode.DeployApp();
      // Verify the Table widget is deleted
      cy.get(widgetsPage.tableWidget).should("not.exist");
    });
  },
);
