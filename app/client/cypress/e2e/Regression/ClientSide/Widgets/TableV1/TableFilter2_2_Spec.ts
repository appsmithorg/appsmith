import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Verify various Table_Filter combinations",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tablev1NewDsl");
    });

    it("1. Verify Full table data - download csv and download Excel", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        JSON.stringify(this.dataSet.TableInput),
      );
      _.assertHelper.AssertNetworkStatus("@updateLayout", 200);
      _.agHelper.PressEscape();
      _.deployMode.DeployApp();

      _.table.DownloadFromTable("Download as CSV");
      //This plugin works only from cypress ^9.2
      //cy.verifyDownload("Table1.csv")
      _.table.ValidateDownloadNVerify("Table1.csv", "Michael Lawson");

      _.table.DownloadFromTable("Download as Excel");
      _.table.ValidateDownloadNVerify("Table1.xlsx", "Michael Lawson");
    });

    it("2. Verify Searched data - download csv and download Excel", function () {
      _.table.SearchTable("7434532");
      _.table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
        expect(afterSearch).to.eq("Byron Fields");
      });

      _.table.DownloadFromTable("Download as CSV");
      //This plugin works only from cypress ^9.2
      //cy.verifyDownload("Table1.csv")
      _.table.ValidateDownloadNVerify("Table1.csv", "byron.fields@reqres.in");

      _.table.DownloadFromTable("Download as Excel");
      _.table.ValidateDownloadNVerify("Table1.xlsx", "Ryan Holmes");

      _.table.RemoveSearchTextNVerify("2381224");

      _.table.DownloadFromTable("Download as CSV");
      _.table.ValidateDownloadNVerify("Table1.csv", "2736212");

      _.table.DownloadFromTable("Download as Excel");
      _.table.ValidateDownloadNVerify("Table1.xlsx", "Beef steak");
    });

    it("3. Verify Filtered data - download csv and download Excel", function () {
      _.table.OpenNFilterTable("id", "starts with", "6");
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Tobias Funke");
      });
      _.table.CloseFilter();

      _.table.DownloadFromTable("Download as CSV");
      //This plugin works only from cypress ^9.2
      //cy.verifyDownload("Table1.csv")
      _.table.ValidateDownloadNVerify("Table1.csv", "Beef steak");

      _.table.DownloadFromTable("Download as Excel");
      _.table.ValidateDownloadNVerify("Table1.xlsx", "tobias.funke@reqres.in");

      _.agHelper.GetNClick(_.table._filterBtn);
      _.table.RemoveFilterNVerify("2381224", true, false);

      _.table.DownloadFromTable("Download as CSV");
      _.table.ValidateDownloadNVerify("Table1.csv", "Tuna Salad");

      _.table.DownloadFromTable("Download as Excel");
      _.table.ValidateDownloadNVerify("Table1.xlsx", "Avocado Panini");
    });

    it("4. Import TableFilter application & verify all filters for same FirstName (one word column) + Bug 13334", () => {
      _.deployMode.NavigateBacktoEditor();
      _.table.WaitUntilTableLoad();
      _.homePage.NavigateToHome();
      _.homePage.ImportApp("TableFilterImportApp.json");
      _.homePage.AssertImportToast();
      _.deployMode.DeployApp();
      _.table.WaitUntilTableLoad();

      //Contains
      _.table.OpenNFilterTable("FirstName", "contains", "Della");
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Alvarado");
      });

      filterOnlyCondition("does not contain", "49");
      filterOnlyCondition("starts with", "1");

      //Ends with - Open Bug 13334
      filterOnlyCondition("ends with", "1");

      filterOnlyCondition("is exactly", "1");
      filterOnlyCondition("empty", "0");
      filterOnlyCondition("not empty", "50");
      filterOnlyCondition("starts with", "3", "ge");
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Chandler");
      });

      _.table.OpenNFilterTable("FullName", "ends with", "ross", "OR", 1);
      _.agHelper
        .GetText(_.table._showPageItemsCount)
        .then(($count) => expect($count).contain("4"));
      _.table.CloseFilter();
      _.agHelper
        .GetText(_.table._filtersCount)
        .then(($count) => expect($count).contain("2"));

      _.table.OpenFilter();
      _.table.RemoveFilterNVerify("1", true, false);
    });

    it("5. Verify all filters for same FullName (two word column) + Bug 13334", () => {
      //Contains
      _.table.OpenNFilterTable("FullName", "contains", "torres");
      _.table.ReadTableRowColumnData(0, 2).then(($cellData) => {
        expect($cellData).to.eq("Virgie");
      });

      filterOnlyCondition("does not contain", "49");
      filterOnlyCondition("starts with", "0");
      filterOnlyCondition("ends with", "1");
      filterOnlyCondition("is exactly", "0");
      filterOnlyCondition("empty", "0");
      filterOnlyCondition("not empty", "50");
      filterOnlyCondition("contains", "1", "wolf");
      _.table.ReadTableRowColumnData(0, 2).then(($cellData) => {
        expect($cellData).to.eq("Teresa");
      });

      _.table.OpenNFilterTable("FirstName", "starts with", "wa", "OR", 1);
      _.agHelper.Sleep();
      _.agHelper
        .GetText(_.table._showPageItemsCount)
        .then(($count) => expect($count).contain("3"));

      _.table.OpenNFilterTable("LastName", "ends with", "son", "OR", 2);
      _.agHelper
        .GetText(_.table._showPageItemsCount)
        .then(($count) => expect($count).contain("10"));
      _.table.CloseFilter();
      _.agHelper
        .GetText(_.table._filtersCount)
        .then(($count) => expect($count).contain("3"));

      _.table.OpenFilter();
      _.table.RemoveFilterNVerify("1", true, false);
    });

    function filterOnlyCondition(
      condition: string,
      expectedCount: string,
      input: string | "" = "",
    ) {
      _.agHelper.GetNClick(_.table._filterConditionDropdown);
      cy.get(_.table._dropdownText).contains(condition).click();
      if (input)
        _.agHelper
          .GetNClick(_.table._filterInputValue, 0)
          .type(input)
          .wait(500);
      _.agHelper.ClickButton("APPLY");
      _.agHelper
        .GetText(_.table._showPageItemsCount)
        .then(($count) => expect($count).contain(expectedCount));
    }
  },
);
