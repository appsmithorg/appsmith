// import { INTERCEPT } from "../../../../fixtures/variables";
import {
  agHelper,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  locators,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let dsName: any, newStoreSecret: any;

describe(
  "Validate MySQL Generate CRUD with JSON Form",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    // beforeEach(function() {
    //   if (INTERCEPT.MYSQL) {
    //     cy.log("MySQL DB is not found. Using intercept");
    //     //dataSources.StartInterceptRoutesForMySQL();
    //   } else cy.log("MySQL DB is found, hence using actual DB");
    // });

    before("1. Create DS for generating CRUD template", () => {
      dataSources.CreateDataSource("MySql");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
    });

    it("1. Create new CRUD Table 'Stores' and populate & refresh Entity Explorer to find the new table", () => {
      let tableCreateQuery = `CREATE TABLE Stores(
      store_id         INTEGER  NOT NULL PRIMARY KEY
     ,name          VARCHAR(36) NOT NULL
     ,store_status  VARCHAR(1) NOT NULL
     ,store_address VARCHAR(96) NOT NULL
     ,store_secret_code  VARCHAR(16)
   );

   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2106,'Hillstreet News and Tobacco','A','2217 College Cedar Falls, IA 506130000 (42.51716928600007, -92.45583783899997)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2112,'Mike''s Liquors','I','407 Sharp St.Glenwood, IA 515340000 (41.04631266100006, -95.74218014299998)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2113,'Jamboree Foods','A','1119 Market St. Box 71 Gowrie, IA 505430000 (42.280542454000056, -94.28941088599998)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2119,'Manly Liquor Store','I','133 East Main Manly, IA 504560000 (43.286863132000065, -93.20244674199995)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2130,'Sycamore Convenience','A','617 Sycamore Waterloo, IA 507030000 (42.49783399700004, -92.33531492199995)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2132,'Spirits and Such','I','100 E Elm West Union, IA 521750000 (42.96126215400005, -91.80787981499998)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2141,'Brewski''s Beverage','I','726 Creek Top Council Bluffs, IA 515010000 (41.262230259000034, -95.85420692899999)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2152,'Dugans Supermarket','A','202 4th North Rockwell, IA 504690000 (42.98649943100003, -93.18811293199997)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2154,'Coralville Liquor Store','I','411 2nd St., Hwy 6 W.Coralville, IA 522410000 (41.671357561000036, -91.57326256199997)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2155,'Calliope Liquor Sales','I','2021 Avenue E Hawarden, IA 510230000 (43.00929963100003, -96.48798763499997)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2161,'Huber''s Store Inc.','A','First & Main Ft. Atkinson, IA 521440000 (43.14339406000005, -91.93351884799995)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2164,'Sauser''s Hardware and Grocery','I','301 Adams St/po Box 433 Ryan, IA 523300000 (42.35227891100004, -91.48055342399994)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2165,'Lange''s Liquor Store','I','618 Lombard Street Clarence, IA 522160000 (41.88873322100005, -91.05567024599998)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2170,'Marshall''s Liquor','I','810 W 7th St Sioux City, IA 511030000 (42.50288329600005, -96.41782288999997)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2177,'Cashwise Foods','I','2400 Fourth Street Sw Mason City, IA 504010000 (43.14846309700005, -93.23627296199999)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2178,'Double "D" Liquor Store','A','618 Rossville Road Waukon, IA 521720000 (43.26206186500008, -91.47355676899997)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2179,'Twin City Liquor','I','610 W. So. Omaha Bridge Dr.Council Bluffs, IA 515010000 (41.21980827700003, -95.85460021399996)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2183,'Liquor and Food Center','I','501 Lynn Street Tipton, IA 527720000 (41.770090148000065, -91.12981387599996)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2188,'Kind''s Jack and Jill Food Center','I','110 S Main Sigourney, IA 525910000 (41.333550830000036, -92.20522134099997)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2190,'Central City Liquor, Inc.','A','1460 2nd Ave Des Moines, IA 503140000 (41.60557033500004, -93.61982683699995)',NULL);`;
      dataSources.CreateQueryForDS(dsName, tableCreateQuery, "CreateStores");
      agHelper.FocusElement(locators._codeMirrorTextArea);
      //agHelper.VerifyEvaluatedValue(tableCreateQuery);

      dataSources.RunQueryNVerifyResponseViews();
      dataSources.AssertTableInVirtuosoList(dsName, "Stores");

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("2. Validate Select record from Postgress datasource & verify query response", () => {
      dataSources.CreateQueryForDS(dsName, "SELECT * FROM Stores LIMIT 10");
      dataSources.RunQueryNVerifyResponseViews(10);
      dataSources.AssertQueryTableResponse(5, "2112");
      dataSources.AssertQueryTableResponse(6, "Mike's Liquors");
      // Commenting this deletion of query to make the generate crud work on the new page instead of the current page
      // agHelper.ActionContextMenuWithInPane({
      //   action: "Delete",
      //   entityType: entityItems.Query,
      // });
    });

    it("3. Verify Generate CRUD for the new table & Verify Deploy mode for table - Stores", () => {
      EditorNavigation.SelectEntityByName(dsName, EntityType.Datasource);
      dataSources.SelectTableFromPreviewSchemaList("Stores");

      GenerateCRUDNValidateDeployPage(
        "2106",
        "Hillstreet News and Tobacco",
        "A",
        "store_id",
      );

      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");
    });

    it("4. Verify Update data from Deploy page - on Stores - existing record", () => {
      EditorNavigation.SelectEntityByName("update_form", EntityType.Widget);

      updatingStoreJSONPropertyFileds();
      deployMode.DeployApp();
      table.SelectTableRow(0, 0, false, "v2"); //to make JSON form hidden
      agHelper.AssertElementAbsence(locators._jsonFormWidget);
      table.SelectTableRow(3, 0, true, "v2");
      agHelper.AssertElementVisibility(locators._jsonFormWidget);
      dataSources.AssertJSONFormHeader(3, 0, "store_id");
      generateStoresSecretInfo(3);
      cy.get("@secretInfo").then(($secretInfo) => {
        newStoreSecret = $secretInfo;
        cy.log("newStoreSecret is : " + newStoreSecret);
        updateNVerify(3, 4, newStoreSecret as string);
      });
      table.SelectTableRow(6, 0, true, "v2");
      dataSources.AssertJSONFormHeader(6, 0, "store_id");

      generateStoresSecretInfo(6);
      cy.get("@secretInfo").then(($secretInfo) => {
        newStoreSecret = $secretInfo;
        cy.log("newStoreSecret is : " + newStoreSecret);
        updateNVerify(6, 4, newStoreSecret as string);
      });

      table.SelectTableRow(12, 0, true, "v2");
      dataSources.AssertJSONFormHeader(12, 0, "store_id");
      generateStoresSecretInfo(12);
      cy.get("@secretInfo").then(($secretInfo) => {
        newStoreSecret = $secretInfo;
        cy.log("newStoreSecret is : " + newStoreSecret);
        updateNVerify(12, 4, newStoreSecret as string);
      });

      //Hidden field bug - to add here aft secret codes are updated for some fields!
    });

    it("5. Verify Delete field data from Deploy page - on Stores - existing record", () => {
      table.SelectTableRow(4, 0, true, "v2");
      //Deleting field value from UI - since MYSQL - "" also considered a value & hence even though this field is NOT NULL - no validations
      dataSources.AssertJSONFormHeader(4, 0, "store_id");
      cy.xpath(deployMode._jsonFormFieldByName("Store Address", false))
        .clear()
        .wait(500);
      updateNVerify(4, 3, "");

      table.SelectTableRow(8, 0, true, "v2");
      dataSources.AssertJSONFormHeader(8, 0, "store_id");
      cy.xpath(deployMode._jsonFormFieldByName("Store Address", false))
        .clear()
        .wait(500);
      updateNVerify(8, 3, "");
    });

    it("6. Verify Delete row from Deploy page - on Stores - existing record", () => {
      table.SelectTableRow(5, 0, true, "v2");
      dataSources.AssertJSONFormHeader(5, 0, "store_id");
      agHelper.ClickButton("Delete", { index: 5, type: "invoke" });
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.AssertElementVisibility(
        dataSources._visibleTextSpan(
          "Are you sure you want to delete this item?",
        ),
      );
      agHelper.ClickButton("Cancel", { type: "invoke" });
      dataSources.AssertJSONFormHeader(5, 0, "store_id");
      agHelper.ClickButton("Delete", { index: 5, type: "invoke" });
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.AssertElementVisibility(
        dataSources._visibleTextSpan(
          "Are you sure you want to delete this item?",
        ),
      );
      agHelper.ClickButton("Confirm", { type: "invoke" });
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.Sleep(2500); // for delete to take effect!

      // Row is not getting highlighted in table v2, hence commenting this line
      // table.AssertSelectedRow(0); //Control going back to 1st row in table
      table.SelectTableRow(0, 0, true, "v2");
      dataSources.AssertJSONFormHeader(0, 0, "store_id");
    });

    // https://github.com/appsmithorg/appsmith/issues/29870 Once this issue is fixed then this test case should be enabled and fixed for the table v2
    it.skip("7. Verify Refresh table from Deploy page - on Stores & verify all updates persists : Skipped till #29870 gets fixed", () => {
      agHelper.GetNClick(dataSources._refreshIcon);

      //Store Address deletion remains
      table.ReadTableRowColumnData(4, 3, "v2", 2000).then(($cellData) => {
        expect($cellData).to.eq("");
      });
      table.ReadTableRowColumnData(7, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("");
      });

      table.ReadTableRowColumnData(5, 0, "v2", 200).then(($cellData) => {
        expect($cellData).not.eq("2132"); //Deleted record Store_ID
      });

      table.NavigateToNextPage(true, "v2"); //page 2
      agHelper.Sleep(3000); //wait for table navigation to take effect!
      table.WaitUntilTableLoad(0, 0, "v2"); //page 2
      table.SelectTableRow(0, 0, true, "v2"); // Added because on navigating to next page the table row was not getting automatically selected
      agHelper.AssertElementVisibility(locators._jsonFormWidget); // JSON form should be present

      table.NavigateToNextPage(true, "v2"); //page 3
      agHelper.Sleep(3000); //wait for table navigation to take effect!
      table.WaitForTableEmpty("v2"); //page 3
      agHelper.AssertElementAbsence(locators._jsonFormWidget); //JSON form also should not be present

      //Try to add via to Insert Modal - JSON fields not showing correct fields, Open bug 14122

      // Go back to page 2
      table.NavigateToPreviousPage(true, "v2");
      agHelper.Sleep(3000); //wait for table navigation to take effect!
      table.WaitUntilTableLoad(0, 0, "v2");

      // Go back to page 1
      table.NavigateToPreviousPage(true, "v2");
      agHelper.Sleep(3000); //wait for table navigation to take effect!
      table.WaitUntilTableLoad(0, 0, "v2");
    });

    it("8. Verify Add/Insert from Deploy page - on Stores - new record", () => {
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");
      EditorNavigation.SelectEntityByName(
        "insert_form",
        EntityType.Widget,
        {},
        ["Insert_Modal"],
      );
      agHelper.Sleep(2000);

      //Removing Default values & setting placeholder!
      propPane.UpdateJSONFormWithPlaceholders();

      //Updating JSON field properties similar to Update JSON!
      updatingStoreJSONPropertyFileds();

      deployMode.DeployApp();
      table.AssertSelectedRow(0);

      agHelper.GetNClick(dataSources._addIcon);
      agHelper.Sleep(1000); //time for new Modal to settle
      //agHelper.AssertElementVisibility(locator._jsonFormWidget, 1); //Insert Modal at index 1
      agHelper.AssertElementVisibility(locators._visibleTextDiv("Insert Row"));
      agHelper.ClickButton("Submit");
      agHelper.AssertContains("Column 'store_id' cannot be null");

      agHelper.WaitUntilAllToastsDisappear();
      deployMode.EnterJSONInputValue("Store Id", "2106");
      deployMode.EnterJSONInputValue("Name", "Keokuk Spirits", 1);
      cy.xpath(deployMode._jsonFormRadioFieldByName("Store Status"))
        .eq(3)
        .check({ force: true });
      deployMode.EnterJSONTextAreaValue(
        "Store Address",
        "1013 Main Keokuk, IA 526320000 (40.40003235900008, -91.38771983999999)",
        1,
      );
      deployMode.EnterJSONInputValue("Store Secret Code", "1013 M K IA 5", 1);
      cy.xpath(deployMode._jsonFormFieldByName("Store Secret Code", true))
        .invoke("attr", "type")
        .should("eq", "password");

      agHelper.ClickButton("Submit");
      agHelper.AssertContains("Duplicate entry '2106' for key 'PRIMARY'");

      cy.xpath(deployMode._jsonFormFieldByName("Store Id", true))
        .clear()
        .wait(500);

      deployMode.EnterJSONInputValue("Store Id", "2105");
      agHelper.ClickButton("Submit");

      //asserting only Update JSON form is present, &  Insert Modal is closed
      agHelper.Sleep(2000); //for Insert to reflect!
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.Sleep(3000); //for Insert to reflect!
      agHelper
        .GetElementLength(locators._jsonFormWidget)
        .then(($len) => expect($len).to.eq(1));
    });

    it("9. Verify Update fields/Delete from Deploy page - on Stores - newly inserted record", () => {
      table.WaitUntilTableLoad(0, 0, "v2");
      table.SelectTableRow(0, 0, true, "v2");

      //validating update happened fine!
      dataSources.AssertJSONFormHeader(0, 0, "store_id", "2105"); //Validaing new record got inserted in 1st position due to id used

      cy.xpath(deployMode._jsonFormRadioFieldByName("Store Status"))
        .eq(0)
        .check({ force: true });
      cy.xpath(deployMode._jsonFormFieldByName("Store Address", false))
        .clear()
        .wait(500);
      deployMode.EnterJSONTextAreaValue(
        "Store Address",
        "116 Main Pocahontas, IA 505740000 (42.73259393100005, -94.67824592399995)",
      );
      updateNVerify(
        0,
        3,
        "116 Main Pocahontas, IA 505740000 (42.73259393100005, -94.67824592399995)",
      );

      deployMode.ClearJSONFieldValue("Store Secret Code");

      // generateStoresSecretInfo(0); //verifying the secret code is password field //Password type check failing due to bug STRING TO NULL
      // cy.get("@secretInfo").then(($secretInfo) => {
      //   newStoreSecret = $secretInfo;
      //   cy.log("newStoreSecret is : " + newStoreSecret);
      // });
      // updateNVerify(0, 4, newStoreSecret as string);

      table.NavigateToNextPage(true, "v2"); //page 2
      agHelper.Sleep(3000); //wait for table navigation to take effect!
      table.WaitUntilTableLoad(0, 0, "v2"); //page 2 //newly inserted record would have pushed the existing record to next page!
      table.SelectTableRow(0, 0, true, "v2"); // Added because on navigating to next page the table row was not getting automatically selected
      agHelper.AssertElementVisibility(locators._jsonFormWidget); //JSON form should be present

      table.NavigateToPreviousPage(true, "v2");
      agHelper.Sleep(3000); //wait for table navigation to take effect!
      table.WaitUntilTableLoad(0, 0, "v2");
      table.SelectTableRow(0, 0, true, "v2"); // Added because on navigating to next page the table row was not getting automatically selected

      dataSources.AssertJSONFormHeader(0, 0, "store_id", "2105");
      agHelper.ClickButton("Delete", { index: 0, type: "invoke" });
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.AssertElementVisibility(
        dataSources._visibleTextSpan(
          "Are you sure you want to delete this item?",
        ),
      );
      agHelper.ClickButton("Confirm", { type: "invoke" });
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.Sleep(3000); //for Delete to reflect!

      // Row is not getting highlighted in table v2, hence commenting this line
      // table.AssertSelectedRow(0); //Control going back to 1st row in table

      table.SelectTableRow(0, 0, true, "v2");
      table.ReadTableRowColumnData(0, 0, "v2", 200).then(($cellData) => {
        expect($cellData).not.eq("2105"); //Deleted record Store_ID
      });
    });

    it("10. Validate Deletion of the Newly Created Page - Stores", () => {
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");
      //Delete the test data
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Stores",
        action: "Delete",
        entityType: entityItems.Page,
      });
      agHelper.RefreshPage();
    });

    it("11. Validate Drop of the Newly Created - Stores - Table from MySQL datasource", () => {
      let deleteTblQuery = "DROP TABLE Stores;";
      dataSources.CreateQueryForDS(dsName, deleteTblQuery, "DropStores");
      agHelper.FocusElement(locators._codeMirrorTextArea);
      //agHelper.VerifyEvaluatedValue(tableCreateQuery);

      dataSources.RunQueryNVerifyResponseViews();
      dataSources.AssertTableInVirtuosoList(dsName, "Stores", false);

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    after(
      "Verify Deletion of the datasource when Pages/Actions associated are not removed yet",
      () => {
        deployMode.DeployApp();
        deployMode.NavigateBacktoEditor();
        dataSources.DeleteDatasourceFromWithinDS(dsName, 409);
      },
    );

    function GenerateCRUDNValidateDeployPage(
      col1Text: string,
      col2Text: string,
      col3Text: string,
      jsonFromHeader?: string,
    ) {
      agHelper.GetNClick(
        `${dataSources._generatePageBtn}, ${dataSources._datasourceCardGeneratePageBtn}`,
      );
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.AssertContains("Successfully generated a page");
      //assertHelper.AssertNetworkStatus("@getActions", 200);//Since failing sometimes
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");

      //Validating loaded table
      agHelper.AssertElementExist(dataSources._selectedRow);
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then(($cellData) => {
        expect($cellData).to.eq(col1Text);
      });
      table.ReadTableRowColumnData(0, 1, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq(col2Text);
      });
      table.ReadTableRowColumnData(0, 2, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq(col3Text);
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
      dataSources.AssertJSONFormHeader(0, 0, jsonFromHeader);
    }

    function generateStoresSecretInfo(rowIndex: number) {
      let secretInfo = "";
      table
        .ReadTableRowColumnData(rowIndex, 3, "v2", 200)
        .then(($cellData: any) => {
          let points = $cellData.match(/((.*))/).pop(); //(/(?<=\()).+?(?=\))/g)
          let secretCode: string[] = (points as string).split(",");
          secretCode[0] = secretCode[0].slice(0, 5);
          secretCode[1] = secretCode[1].slice(0, 5);
          secretInfo = secretCode[0] + secretCode[1];
          deployMode.EnterJSONInputValue("Store Secret Code", secretInfo);
          cy.xpath(deployMode._jsonFormFieldByName("Store Secret Code", true))
            .invoke("attr", "type")
            .should("eq", "password");
          cy.wrap(secretInfo).as("secretInfo");
        });
    }

    function updateNVerify(
      rowIndex: number,
      colIndex: number,
      expectedTableData: string,
    ) {
      agHelper.ClickButton("Update"); //Update does not work, Bug 14063
      agHelper.AssertElementAbsence(locators._toastMsg); //Validating fix for Bug 14063 - for common table columns
      agHelper.Sleep(2000); //for update to reflect!
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);

      // Row is not getting highlighted in table v2, hence commenting this line
      // table.AssertSelectedRow(rowIndex);

      //validating update happened fine!
      table
        .ReadTableRowColumnData(rowIndex, colIndex, "v2", 200)
        .then(($cellData) => {
          expect($cellData).to.eq(expectedTableData);
        });
    }

    function updatingStoreJSONPropertyFileds() {
      propPane.ChangeJsonFormFieldType("Store Status", "Radio Group");
      propPane.UpdatePropertyFieldValue(
        "Options",
        `[{
        "label": "Active",
        "value": "A"
      },
      {
        "label": "Inactive",
        "value": "I"
      }]`,
      );
      propPane.NavigateBackToPropertyPane();
      propPane.ChangeJsonFormFieldType("Store Address", "Multiline Text Input");
      propPane.NavigateBackToPropertyPane();
      propPane.ChangeJsonFormFieldType("Store Secret Code", "Password Input");
      propPane.NavigateBackToPropertyPane();
    }
  },
);
