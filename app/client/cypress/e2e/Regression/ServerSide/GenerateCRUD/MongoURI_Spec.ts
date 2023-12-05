import {
  agHelper,
  appSettings,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe("Validate Mongo URI CRUD with JSON Form", () => {
  let dsName: any;

  it("1. Create DS & Generate CRUD template", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreatePlugIn("MongoDB");
      dsName = "Mongo" + uid;
      agHelper.RenameWithInPane(dsName, false);
      dataSources.FillMongoDatasourceFormWithURI();
      dataSources.TestSaveDatasource();
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageList.AddNewPage("Generate page with data");
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);

      assertHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "mongomart");
      GenerateCRUDNValidateDeployPage(
        "/img/products/mug.jpg",
        "Coffee Mug",
        `Kitchen`,
        4,
      );

      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
      //Should not be able to delete ds until app is published again
      //coz if app is published & shared then deleting ds may cause issue, So!
      dataSources.DeleteDatasourceFromWithinDS(dsName as string, 409);
    });
  });

  it("2. Verify Update data from Deploy page - on mongomart - existing record", () => {
    //Update documents query to handle the int _id data
    EditorNavigation.SelectEntityByName("UpdateQuery", EntityType.Query);
    agHelper.EnterValue(`{ _id: {{data_table.selectedRow._id}}}`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE_V1));
    agHelper.GetNAssertElementText(
      locators._textWidgetInDeployed,
      "mongomart Data",
    );
    //Validating loaded table
    table.SelectTableRow(2);
    agHelper.AssertElementExist(dataSources._selectedRow);
    table.ReadTableRowColumnData(2, 0, "v1", 200).then(($cellData) => {
      expect($cellData).to.be.empty;
    });
    table.ReadTableRowColumnData(2, 6, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("WiredTiger T-shirt");
    });
    table.ReadTableRowColumnData(2, 7, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Apparel");
    });

    table.SelectTableRow(8);
    deployMode.ClearJSONFieldValue("Slogan");
    deployMode.ClearJSONFieldValue("Category");

    agHelper.ClickButton("Update");
    agHelper.AssertElementAbsence(locators._toastMsg); //Validating fix for Bug 14063
    for (let i = 7; i <= 8; i++) {
      table.ReadTableRowColumnData(8, i, "v1").then(($cellData) => {
        expect($cellData).to.be.empty;
      });
    }
    deployMode.EnterJSONInputValue(
      "Slogan",
      "Write Your Story with Elegance: The Pen of Choice!",
    );
    agHelper.GetNClick(deployMode._jsonFormNumberFieldByName("Stars", "up")); //1
    agHelper.GetNClick(deployMode._jsonFormNumberFieldByName("Stars", "up")); //2
    agHelper.GetNClick(deployMode._jsonFormNumberFieldByName("Stars", "up")); //3

    agHelper.ClickButton("Update");
    agHelper.AssertElementAbsence(locators._toastMsg); //Validating fix for Bug 14063
    table.ReadTableRowColumnData(8, 8, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq(
        "Write Your Story with Elegance: The Pen of Choice!",
      );
    });
    table.ReadTableRowColumnData(8, 5, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
  });

  it("3. Verify Add/Insert from Deploy page - on MongoMart - new record - few validations", () => {
    agHelper.GetNClick(dataSources._addIcon);
    agHelper.Sleep();
    //agHelper.AssertElementVisibility(locators._jsonFormWidget, 1); //Insert Modal
    agHelper.AssertElementVisibility(
      locators._visibleTextDiv("Insert Document"),
    );

    agHelper.AssertElementEnabledDisabled(
      locators._buttonByText("Submit") + "/parent::div",
      0,
      false,
    );
    agHelper.ClickButton("Submit");
    for (let i = 0; i <= 1; i++) {
      table.ReadTableRowColumnData(i, 6, "v1").then(($cellData) => {
        expect($cellData).contains("Coffee Mug");
      });
    }
  });

  it("4. Verify Delete from Deploy page - on MongoMart - newly added record", () => {
    agHelper.ClickButton("Delete", 0);
    agHelper.AssertElementVisibility(locators._modal);
    agHelper.AssertElementVisibility(
      dataSources._visibleTextSpan(
        "Are you sure you want to delete this document?",
      ),
    );
    agHelper.ClickButton("Confirm");
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    table.ReadTableRowColumnData(0, 6, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Coffee Mug");
    });
    table.ReadTableRowColumnData(1, 6, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Track Jacket");
    });
  });

  it("5 Verify Filter & Search & Download from Deploy page - on MongoMart - existing record", () => {
    table.SearchTable("Swag");
    agHelper.Sleep(2500); //for search to load
    for (let i = 0; i <= 1; i++) {
      table.ReadTableRowColumnData(i, 6, "v1").then(($cellData) => {
        expect($cellData).to.eq("Swag");
      });
    }
    table.ResetSearch();

    table.OpenNFilterTable("title", "contains", "USB");
    for (let i = 0; i < 3; i++) {
      table.ReadTableRowColumnData(i, 6, "v1").then(($cellData) => {
        expect($cellData).contains("USB");
      });
    }
    table.CloseFilter();

    table.DownloadFromTable("Download as CSV");
    table.ValidateDownloadNVerify("data_table.csv", "USB Stick (Green)");

    table.DownloadFromTable("Download as Excel");
    table.ValidateDownloadNVerify("data_table.xlsx", "USB Stick (Leaf)");
    table.OpenFilter();
    table.RemoveFilter();
    agHelper
      .GetText(table._filtersCount)
      .then(($filters) => expect($filters).to.eq("Filters"));
  });

  it("6. Suggested Widget - Table", () => {
    table.SelectTableRow(8);
    agHelper.GetNClick(deployMode._jsonFormNumberFieldByName("Stars", "down")); //2
    agHelper.GetNClick(deployMode._jsonFormNumberFieldByName("Stars", "down")); //1
    agHelper.GetNClick(deployMode._jsonFormNumberFieldByName("Stars", "down")); //0
    agHelper.ClickButton("Update");

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    PageList.AddNewPage();
    dataSources.CreateQueryForDS(dsName);
    dataSources.ValidateNSelectDropdown("Collection", "", "mongomart");
    dataSources.RunQuery({ toValidateResponse: false });
    dataSources.AddSuggestedWidget(Widgets.Table);
    table.ReadTableRowColumnData(0, 3, "v2").then((cellData) => {
      expect(cellData).to.eq("1");
    });
  });
});

function GenerateCRUDNValidateDeployPage(
  col1Text: string,
  col6Text: string,
  col7Text: string,
  idIndex: number,
) {
  agHelper.GetNClick(dataSources._generatePageBtn);
  assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
  agHelper.AssertContains("Successfully generated a page"); // Commenting this since FindQuery failure appears sometimes
  assertHelper.AssertNetworkStatus("@getActions", 200);
  assertHelper.AssertNetworkStatus("@postExecute", 200);
  agHelper.ClickButton("Got it");
  assertHelper.AssertNetworkStatus("@updateLayout", 200);
  appSettings.OpenPaneAndChangeTheme("Pacific");
  deployMode.DeployApp(locators._widgetInDeployed("tablewidget"));

  //Validating loaded table
  agHelper.AssertElementExist(dataSources._selectedRow);
  table.ReadTableRowColumnData(0, 1, "v1", 2000).then(($cellData) => {
    expect($cellData).to.eq(col1Text);
  });
  table.ReadTableRowColumnData(0, 6, "v1", 200).then(($cellData) => {
    expect($cellData).to.eq(col6Text);
  });
  table.ReadTableRowColumnData(0, 7, "v1", 200).then(($cellData) => {
    expect($cellData).to.eq(col7Text);
  });

  //Validating loaded JSON form
  cy.xpath(locators._buttonByText("Update")).then((selector) => {
    cy.wrap(selector)
      .invoke("attr", "class")
      .then((classes) => {
        //cy.log("classes are:" + classes);
        expect(classes).not.contain("bp3-disabled");
      });
  });
  dataSources.AssertJSONFormHeader(0, idIndex, "Id", "", true);
}
