import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Verify various Table property bugs",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tablev1NewDsl");
    });

    it("1. Adding Data to Table Widget", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        JSON.stringify(this.dataSet.TableURLColumnType),
      );
      _.assertHelper.AssertNetworkStatus("@updateLayout", 200);
      _.agHelper.PressEscape();
      //Bug 13299 - Verify Display Text does not contain garbage value for URL column type when empty
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.table.ChangeColumnType("image", "URL");
      _.propPane.UpdatePropertyFieldValue(
        "Display text",
        `{{currentRow.image.toString().includes('7') ? currentRow.image.toString().split('full/')[1] : "" }}`,
      );

      _.deployMode.DeployApp();

      //_.table.SelectTableRow(1)
      _.table.ReadTableRowColumnData(0, 0).then(($cellData) => {
        expect($cellData).contains("cube-logo_S50__hLNq.jpeg");
      });

      _.table.ReadTableRowColumnData(1, 0).then(($cellData) => {
        expect($cellData).to.eq(
          "https://docs.appsmith.com/img/Appsmith-Login-Screen-Shows-SAML.jpg",
        );
      });

      _.table.ReadTableRowColumnData(2, 0).then(($cellData) => {
        expect($cellData).contains("zapier-logo_odZ9wZQ3vY.jpeg");
      });

      _.table.ReadTableRowColumnData(3, 0).then(($cellData) => {
        expect($cellData).to.eq(
          "https://docs.appsmith.com/img/replyto-logo_6yaZHFIeU.jpeg",
        );
      });

      _.table.AssertURLColumnNavigation(
        0,
        0,
        "https://docs.appsmith.com/img/cube-logo_S50__hLNq.jpeg",
      );

      _.deployMode.NavigateBacktoEditor();
    });

    it("2. Bug 13299 - Verify Display Text does not contain garbage value for URL column type when null", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.agHelper.GetNClick(_.table._columnSettings("image", "Edit"));

      _.propPane.UpdatePropertyFieldValue(
        "Display text",
        `{{currentRow.image.toString().includes('7') ? currentRow.image.toString().split('full/')[1] : null }}`,
      );

      _.deployMode.DeployApp();

      _.table.ReadTableRowColumnData(0, 0).then(($cellData) => {
        expect($cellData).contains("cube-logo_S50__hLNq.jpeg");
      });

      _.table.ReadTableRowColumnData(1, 0).then(($cellData) => {
        expect($cellData).to.eq(
          "https://docs.appsmith.com/img/Appsmith-Login-Screen-Shows-SAML.jpg",
        );
      });

      _.table.ReadTableRowColumnData(2, 0).then(($cellData) => {
        expect($cellData).contains("zapier-logo_odZ9wZQ3vY.jpeg");
      });

      _.table.ReadTableRowColumnData(3, 0).then(($cellData) => {
        expect($cellData).to.eq(
          "https://docs.appsmith.com/img/replyto-logo_6yaZHFIeU.jpeg",
        );
      });

      _.table.AssertURLColumnNavigation(
        1,
        0,
        "https://docs.appsmith.com/img/Appsmith-Login-Screen-Shows-SAML.jpg",
      );

      _.deployMode.NavigateBacktoEditor();
    });

    it("3. Bug 13299 - Verify Display Text does not contain garbage value for URL column type when undefined", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.agHelper.GetNClick(_.table._columnSettings("image", "Edit"));

      _.propPane.UpdatePropertyFieldValue(
        "Display text",
        `{{currentRow.image.toString().includes('7') ? currentRow.image.toString().split('full/')[1] : undefined }}`,
      );

      _.deployMode.DeployApp();

      _.table.ReadTableRowColumnData(0, 0).then(($cellData) => {
        expect($cellData).contains("cube-logo_S50__hLNq.jpeg");
      });

      _.table.ReadTableRowColumnData(1, 0).then(($cellData) => {
        expect($cellData).to.eq(
          "https://docs.appsmith.com/img/Appsmith-Login-Screen-Shows-SAML.jpg",
        );
      });

      _.table.ReadTableRowColumnData(2, 0).then(($cellData) => {
        expect($cellData).contains("zapier-logo_odZ9wZQ3vY.jpeg");
      });

      _.table.ReadTableRowColumnData(3, 0).then(($cellData) => {
        expect($cellData).to.eq(
          "https://docs.appsmith.com/img/replyto-logo_6yaZHFIeU.jpeg",
        );
      });

      _.table.AssertURLColumnNavigation(
        0,
        0,
        "https://docs.appsmith.com/img/cube-logo_S50__hLNq.jpeg",
      );

      _.deployMode.NavigateBacktoEditor();
    });

    it("4. should allow ISO 8601 format date and not throw a disallowed validation error", () => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        '[{ "dateValue": "2023-02-02T13:39:38.367857Z" }]',
      );
      cy.wait(500);

      _.propPane.OpenTableColumnSettings("dateValue");
      // select date option from column type setting field

      _.propPane.SelectPropertiesDropDown("Column type", "Date");

      // select ISO 8601 date format
      cy.get(".t--property-control-originaldateformat").click();
      cy.contains("ISO 8601").click();

      cy.get(".t--property-control-originaldateformat")
        .find(".t--js-toggle")
        .click();
      // we should not see an error after ISO 8061 is selected
      cy.get(
        ".t--property-control-originaldateformat .t--codemirror-has-error",
      ).should("not.exist");
      //check the selected format value
      cy.get(".t--property-control-originaldateformat").contains(
        "YYYY-MM-DDTHH:mm:ss.SSSZ",
      );
      //give a corrupted date format

      _.propPane.UpdatePropertyFieldValue(
        "Original Date Format",
        "YYYY-MM-DDTHH:mm:ss.SSSsZ",
      );
      //we should now see an error with an incorrect date format
      cy.get(
        ".t--property-control-originaldateformat .t--codemirror-has-error",
      ).should("exist");
    });
  },
);
