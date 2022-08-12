import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any, newStoreSecret: any;

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  table = ObjectsRegistry.Table,
  homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  deployMode = ObjectsRegistry.DeployMode;

describe("Validate MySQL Generate CRUD with JSON Form", () => {
  // beforeEach(function() {
  //   if (Cypress.env("MySQL") === 0) {
  //     cy.log("MySQL DB is not found. Using intercept");
  //     //dataSources.StartInterceptRoutesForMySQL();
  //   } else cy.log("MySQL DB is found, hence using actual DB");
  // });

  it("1. Create DS & then Add new Page and generate CRUD template using created datasource", () => {
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      ee.AddNewPage();
      agHelper.GetNClick(homePage._buildFromDataTableActionCard);
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);
    });

    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(
      dataSources._dropdownOption,
      "worldCountryInfo",
    );

    GenerateCRUDNValidateDeployPage("ABW", "Aruba", "North America", "Code");

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ActionContextMenuByEntityName("Page2", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);

    //Should not be able to delete ds until app is published again
    //coz if app is published & shared then deleting ds may cause issue, So!
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.DeleteDatasouceFromActiveTab(dsName as string, 409);
    });

    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.DeleteDatasouceFromActiveTab(dsName as string, 200);
    });
  });

  it("2. Create new app and Generate CRUD page using a new datasource", () => {
    homePage.NavigateToHome();
    homePage.CreateNewApplication();
    agHelper.GetNClick(homePage._buildFromDataTableActionCard);
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    agHelper.GetNClickByContains(
      dataSources._dropdownOption,
      "Connect New Datasource",
    );

    dataSources.CreateDataSource("MySql", false);

    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "customers");

    GenerateCRUDNValidateDeployPage(
      "103",
      "Atelier graphique",
      "Schmitt",
      "customerNumber",
    );

    deployMode.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("3. Generate CRUD page from datasource present in ACTIVE section", function() {
    dataSources.NavigateFromActiveDS(dsName, false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure");
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "employees");

    GenerateCRUDNValidateDeployPage(
      "1002",
      "Murphy",
      "Diane",
      "employeeNumber",
    );

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ExpandCollapseEntity("PAGES");
    ee.ActionContextMenuByEntityName("Employees", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it("4. Create new CRUD Table 'Productlines' and populate & refresh Entity Explorer to find the new table + Bug 14063", () => {
    let tableCreateQuery = `CREATE TABLE productlines (
      productLine varchar(50) NOT NULL,
      textDescription varchar(4000) DEFAULT NULL,
      htmlDescription mediumtext,
      image mediumblob,
      PRIMARY KEY (productLine)
    );

    insert  into productlines(productLine,textDescription,htmlDescription,image) values

('Classic Cars','Attention car enthusiasts: Make your wildest car ownership dreams come true. Whether you are looking for classic muscle cars, dream sports cars or movie-inspired miniatures, you will find great choices in this category. These replicas feature superb attention to detail and craftsmanship and offer features such as working steering system, opening forward compartment, opening rear trunk with removable spare wheel, 4-wheel independent spring suspension, and so on. The models range in size from 1:10 to 1:24 scale and include numerous limited edition and several out-of-production vehicles. All models include a certificate of authenticity from their manufacturers and come fully assembled and ready for display in the home or office.',NULL,NULL),

('Motorcycles','Our motorcycles are state of the art replicas of classic as well as contemporary motorcycle legends such as Harley Davidson, Ducati and Vespa. Models contain stunning details such as official logos, rotating wheels, working kickstand, front suspension, gear-shift lever, footbrake lever, and drive chain. Materials used include diecast and plastic. The models range in size from 1:10 to 1:50 scale and include numerous limited edition and several out-of-production vehicles. All models come fully assembled and ready for display in the home or office. Most include a certificate of authenticity.',NULL,NULL),

('Planes','Unique, diecast airplane and helicopter replicas suitable for collections, as well as home, office or classroom decorations. Models contain stunning details such as official logos and insignias, rotating jet engines and propellers, retractable wheels, and so on. Most come fully assembled and with a certificate of authenticity from their manufacturers.',NULL,NULL),

('Ships','The perfect holiday or anniversary gift for executives, clients, friends, and family. These handcrafted model ships are unique, stunning works of art that will be treasured for generations! They come fully assembled and ready for display in the home or office. We guarantee the highest quality, and best value.',NULL,NULL),

('Trains','Model trains are a rewarding hobby for enthusiasts of all ages. Whether you''re looking for collectible wooden trains, electric streetcars or locomotives, you''ll find a number of great choices for any budget within this category. The interactive aspect of trains makes toy trains perfect for young children. The wooden train sets are ideal for children under the age of 5.',NULL,NULL),

('Trucks and Buses','The Truck and Bus models are realistic replicas of buses and specialized trucks produced from the early 1920s to present. The models range in size from 1:12 to 1:50 scale and include numerous limited edition and several out-of-production vehicles. Materials used include tin, diecast and plastic. All models include a certificate of authenticity from their manufacturers and are a perfect ornament for the home and office.',NULL,NULL),

('Vintage Cars','Our Vintage Car models realistically portray automobiles produced from the early 1900s through the 1940s. Materials used include Bakelite, diecast, plastic and wood. Most of the replicas are in the 1:18 and 1:24 scale sizes, which provide the optimum in detail and accuracy. Prices range from $30.00 up to $180.00 for some special limited edition replicas. All models include a certificate of authenticity from their manufacturers and come fully assembled and ready for display in the home or office.',NULL,NULL);
`;

    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("CreateProductLines");
    dataSources.EnterQuery(tableCreateQuery);
    agHelper.FocusElement(locator._codeMirrorTextArea);
    //agHelper.VerifyEvaluatedValue(tableCreateQuery); //failing sometimes!

    dataSources.RunQueryNVerifyResponseViews();
    agHelper.ActionContextMenuWithInPane("Delete");

    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(ee._entityNameInExplorer("productlines"));
  });

  it("5. Verify Generate CRUD for the new table & Verify Deploy mode for table - Productlines", () => {
    dataSources.NavigateFromActiveDS(dsName, false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure");
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "productlines");
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.ValidateToastMessage("Successfully generated a page");
    agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.ValidateNetworkStatus("@getActions", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@updateLayout", 200);

    agHelper.GetNClick(dataSources._visibleTextSpan("GOT IT"));
    deployMode.DeployApp();

    //Validating loaded table
    agHelper.AssertElementExist(dataSources._selectedRow);
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("Classic Cars");
    });
    table.ReadTableRowColumnData(1, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("Motorcycles");
    });
    table.ReadTableRowColumnData(2, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("Planes");
    });
    table.ReadTableRowColumnData(3, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("Ships");
    });
    table.ReadTableRowColumnData(4, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("Trains");
    });
    table.ReadTableRowColumnData(5, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("Trucks and Buses");
    });
    table.ReadTableRowColumnData(6, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("Vintage Cars");
    });
    //Validating loaded JSON form
    cy.xpath(locator._spanButton("Update")).then((selector) => {
      cy.wrap(selector)
        .invoke("attr", "class")
        .then((classes) => {
          //cy.log("classes are:" + classes);
          expect(classes).not.contain("bp3-disabled");
        });
    });

    dataSources.AssertJSONFormHeader(0, 0, "productLine");

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    // //Delete the test data
    // ee.ActionContextMenuByEntityName("Productlines", "Delete", "Are you sure?");
    // agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it.skip("6. Verify Update/Delete row/Delete field data from Deploy page - on Productlines - existing record + Bug 14063", () => {
    ee.SelectEntityByName("update_form", "WIDGETS");
    propPane.ChangeJsonFormFieldType(
      "Text Description",
      "Multiline Text Input",
    );
    propPane.NavigateBackToPropertyPane();
    propPane.ChangeJsonFormFieldType(
      "Html Description",
      "Multiline Text Input",
    );
    propPane.NavigateBackToPropertyPane();
    deployMode.DeployApp();
    table.SelectTableRow(0); //to make JSON form hidden
    agHelper.AssertElementAbsence(locator._jsonFormWidget);
    table.SelectTableRow(3);
    agHelper.AssertElementVisible(locator._jsonFormWidget);

    dataSources.AssertJSONFormHeader(3, 0, "productLine");

    deployMode.EnterJSONTextAreaValue(
      "Html Description",
      "The largest cruise ship is twice the length of the Washington Monument. Some cruise ships have virtual balconies.",
    );
    agHelper.ClickButton("Update"); //Update does not work, Bug 14063
    agHelper.AssertElementAbsence(locator._toastMsg); //Validating fix for Bug 14063
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    table.AssertSelectedRow(3);

    //validating update happened fine!
    table.ReadTableRowColumnData(3, 2, 200).then(($cellData) => {
      expect($cellData).to.eq(
        "The largest cruise ship is twice the length of the Washington Monument. Some cruise ships have virtual balconies.",
      );
    });
  });

  it.skip("7. Verify Add/Update/Delete from Deploy page - on Productlines - new record + Bug 14063", () => {
    //To script aft bug fix!
  });

  it("8. Create new CRUD Table 'Stores' and populate & refresh Entity Explorer to find the new table", () => {
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
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("CreateStores");
    dataSources.EnterQuery(tableCreateQuery);
    agHelper.FocusElement(locator._codeMirrorTextArea);
    //agHelper.VerifyEvaluatedValue(tableCreateQuery);

    dataSources.RunQueryNVerifyResponseViews();
    agHelper.ActionContextMenuWithInPane("Delete");

    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(ee._entityNameInExplorer("Stores"));
  });

  it("9. Validate Select record from Postgress datasource & verify query response", () => {
    ee.ActionTemplateMenuByEntityName("Stores", "SELECT");
    dataSources.RunQueryNVerifyResponseViews(10);
    dataSources.ReadQueryTableResponse(5).then(($cellData) => {
      expect($cellData).to.eq("2112");
    });
    dataSources.ReadQueryTableResponse(6).then(($cellData) => {
      expect($cellData).to.eq("Mike's Liquors");
    });
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("10. Verify Generate CRUD for the new table & Verify Deploy mode for table - Stores", () => {
    dataSources.NavigateFromActiveDS(dsName, false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "Stores");
    GenerateCRUDNValidateDeployPage(
      "2106",
      "Hillstreet News and Tobacco",
      "A",
      "store_id",
    );

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
  });

  it("11. Verify Update data from Deploy page - on Stores - existing record", () => {
    ee.SelectEntityByName("update_form", "WIDGETS");

    updatingStoreJSONPropertyFileds();
    deployMode.DeployApp();
    table.SelectTableRow(0); //to make JSON form hidden
    agHelper.AssertElementAbsence(locator._jsonFormWidget);
    table.SelectTableRow(3);
    agHelper.AssertElementVisible(locator._jsonFormWidget);
    dataSources.AssertJSONFormHeader(3, 0, "store_id");
    generateStoresSecretInfo(3);
    cy.get("@secretInfo").then(($secretInfo) => {
      newStoreSecret = $secretInfo;
      cy.log("newStoreSecret is : " + newStoreSecret);
      updateNVerify(3, 4, newStoreSecret as string);
    });
    table.SelectTableRow(6);
    dataSources.AssertJSONFormHeader(6, 0, "store_id");

    generateStoresSecretInfo(6);
    cy.get("@secretInfo").then(($secretInfo) => {
      newStoreSecret = $secretInfo;
      cy.log("newStoreSecret is : " + newStoreSecret);
      updateNVerify(6, 4, newStoreSecret as string);
    });

    table.SelectTableRow(18);
    dataSources.AssertJSONFormHeader(18, 0, "store_id");
    generateStoresSecretInfo(18);
    cy.get("@secretInfo").then(($secretInfo) => {
      newStoreSecret = $secretInfo;
      cy.log("newStoreSecret is : " + newStoreSecret);
      updateNVerify(18, 4, newStoreSecret as string);
    });

    //Hidden field bug - to add here aft secret codes are updated for some fields!
  });

  it("12. Verify Delete field data from Deploy page - on Stores - existing record", () => {
    table.SelectTableRow(4);
    //Deleting field value from UI - since MYSQL - "" also considered a value & hence even though this field is NOT NULL - no validations
    dataSources.AssertJSONFormHeader(4, 0, "store_id");
    cy.xpath(deployMode._jsonFormFieldByName("Store Address", false))
      .clear()
      .wait(500);
    updateNVerify(4, 3, "");

    table.SelectTableRow(8);
    dataSources.AssertJSONFormHeader(8, 0, "store_id");
    cy.xpath(deployMode._jsonFormFieldByName("Store Address", false))
      .clear()
      .wait(500);
    updateNVerify(8, 3, "");
  });

  it("13. Verify Delete row from Deploy page - on Stores - existing record", () => {
    table.SelectTableRow(5);
    dataSources.AssertJSONFormHeader(5, 0, "store_id");
    agHelper.ClickButton("Delete", 5);
    agHelper.AssertElementVisible(locator._modal);
    agHelper.AssertElementVisible(
      dataSources._visibleTextSpan(
        "Are you sure you want to delete this item?",
      ),
    );
    agHelper.ClickButton("Cancel");
    dataSources.AssertJSONFormHeader(5, 0, "store_id");
    agHelper.ClickButton("Delete", 5);
    agHelper.AssertElementVisible(locator._modal);
    agHelper.AssertElementVisible(
      dataSources._visibleTextSpan(
        "Are you sure you want to delete this item?",
      ),
    );
    agHelper.ClickButton("Confirm");
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(2500); // for delete to take effect!
    table.AssertSelectedRow(0); //Control going back to 1st row in table
    dataSources.AssertJSONFormHeader(0, 0, "store_id");
  });

  it("14. Verify Refresh table from Deploy page - on Stores & verify all updates persists", () => {
    agHelper.GetNClick(dataSources._refreshIcon);

    //Store Address deletion remains
    table.ReadTableRowColumnData(4, 3, 2000).then(($cellData) => {
      expect($cellData).to.eq("");
    });
    table.ReadTableRowColumnData(7, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("");
    });

    table.ReadTableRowColumnData(5, 0, 200).then(($cellData) => {
      expect($cellData).not.eq("2132"); //Deleted record Store_ID
    });

    table.NavigateToNextPage(); //page 2
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitForTableEmpty(); //page 2
    agHelper.AssertElementAbsence(locator._jsonFormWidget); //JSON form also should not be present

    //Try to add via to Insert Modal - JSON fields not showing correct fields, Open bug 14122

    table.NavigateToPreviousPage();
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitUntilTableLoad();
  });

  it("15. Verify Add/Insert from Deploy page - on Stores - new record", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    ee.ExpandCollapseEntity("WIDGETS");
    ee.ExpandCollapseEntity("Insert_Modal");
    ee.SelectEntityByName("insert_form");
    agHelper.Sleep(2000);

    //Removing Default values & setting placeholder!
    propPane.UpdateJSONFormWithPlaceholders();

    //Updating JSON field properties similar to Update JSON!
    updatingStoreJSONPropertyFileds();

    deployMode.DeployApp();
    table.AssertSelectedRow(0);

    agHelper.GetNClick(dataSources._addIcon);
    agHelper.Sleep(1000); //time for new Modal to settle
    //agHelper.AssertElementVisible(locator._jsonFormWidget, 1); //Insert Modal at index 1
    agHelper.AssertElementVisible(locator._visibleTextDiv("Insert Row"));
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage("Column 'store_id' cannot be null");

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
    agHelper.ValidateToastMessage("Duplicate entry '2106' for key 'PRIMARY'");

    cy.xpath(deployMode._jsonFormFieldByName("Store Id", true))
      .clear()
      .wait(500);

    deployMode.EnterJSONInputValue("Store Id", "2105");
    agHelper.ClickButton("Submit");

    //asserting only Update JSON form is present, &  Insert Modal is closed
    agHelper.Sleep(2000); //for Insert to reflect!
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(3000); //for Insert to reflect!
    agHelper
      .GetElementLength(locator._jsonFormWidget)
      .then(($len) => expect($len).to.eq(1));
  });

  it("16. Verify Update fields/Delete from Deploy page - on Stores - newly inserted record", () => {
    table.SelectTableRow(0);

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

    table.NavigateToNextPage(); //page 2
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitUntilTableLoad(); //page 2 //newly inserted record would have pushed the existing record to next page!
    agHelper.AssertElementVisible(locator._jsonFormWidget); //JSON form should be present

    table.NavigateToPreviousPage();
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitUntilTableLoad();

    dataSources.AssertJSONFormHeader(0, 0, "store_id", "2105");
    agHelper.ClickButton("Delete", 0);
    agHelper.AssertElementVisible(locator._modal);
    agHelper.AssertElementVisible(
      dataSources._visibleTextSpan(
        "Are you sure you want to delete this item?",
      ),
    );
    agHelper.ClickButton("Confirm");
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(3000); //for Delete to reflect!
    table.AssertSelectedRow(0); //Control going back to 1st row in table
    table.ReadTableRowColumnData(0, 0, 200).then(($cellData) => {
      expect($cellData).not.eq("2105"); //Deleted record Store_ID
    });
  });

  it("17. Validate Deletion of the Newly Created Page - Stores", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ActionContextMenuByEntityName("Stores", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it("18. Validate Drop of the Newly Created - Stores - Table from MySQL datasource", () => {
    let deleteTblQuery = "DROP TABLE Stores;";
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("DropStores");
    dataSources.EnterQuery(deleteTblQuery);
    agHelper.FocusElement(locator._codeMirrorTextArea);
    //agHelper.VerifyEvaluatedValue(tableCreateQuery);

    dataSources.RunQueryNVerifyResponseViews();
    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementAbsence(ee._entityNameInExplorer("Stores"));
  });

  it("19. Verify application does not break when user runs the query with wrong table name", function() {
    ee.SelectEntityByName("DropStores", "QUERIES/JS");
    dataSources.RunQuery(false);
    agHelper
      .GetText(dataSources._queryError)
      .then(($errorText) =>
        expect($errorText).to.eq("Unknown table 'fakeapi.Stores'"),
      );
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("20. Verify Deletion of the datasource when Pages/Actions associated are not removed yet", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //ProductLines, Employees pages are still using this ds
  });

  function GenerateCRUDNValidateDeployPage(
    col1Text: string,
    col2Text: string,
    col3Text: string,
    jsonFromHeader: string,
  ) {
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.ValidateToastMessage("Successfully generated a page");
    agHelper.ValidateNetworkStatus("@getActions", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@updateLayout", 200);

    agHelper.GetNClick(dataSources._visibleTextSpan("GOT IT"));
    deployMode.DeployApp();

    //Validating loaded table
    agHelper.AssertElementExist(dataSources._selectedRow);
    table.ReadTableRowColumnData(0, 0, 2500).then(($cellData) => {
      expect($cellData).to.eq(col1Text);
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).to.eq(col2Text);
    });
    table.ReadTableRowColumnData(0, 2, 200).then(($cellData) => {
      expect($cellData).to.eq(col3Text);
    });

    //Validating loaded JSON form
    cy.xpath(locator._spanButton("Update")).then((selector) => {
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
    let secretInfo: string = "";
    table.ReadTableRowColumnData(rowIndex, 3, 200).then(($cellData: any) => {
      var points = $cellData.match(/((.*))/).pop(); //(/(?<=\()).+?(?=\))/g)
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
    agHelper.AssertElementAbsence(locator._toastMsg); //Validating fix for Bug 14063 - for common table columns
    agHelper.Sleep(2000); //for update to reflect!
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    table.AssertSelectedRow(rowIndex);

    //validating update happened fine!
    table.ReadTableRowColumnData(rowIndex, colIndex, 200).then(($cellData) => {
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
});
