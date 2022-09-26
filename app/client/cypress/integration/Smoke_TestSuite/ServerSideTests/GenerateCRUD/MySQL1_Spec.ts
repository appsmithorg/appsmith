import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any;

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
    ee.ExpandCollapseEntity("Pages");
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
    ee.ExpandCollapseEntity("Pages");
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

    ee.ExpandCollapseEntity("Datasources");
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
    agHelper.AssertContains("Successfully generated a page");
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
  });

  it.skip("6. Verify Update/Delete row/Delete field data from Deploy page - on Productlines - existing record + Bug 14063", () => {
    ee.SelectEntityByName("update_form", "Widgets");
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
    table.SelectTableRow(0, 0, false); //to make JSON form hidden
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

  it("8. Validate Deletion of the Newly Created Page - Productlines", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ActionContextMenuByEntityName("Productlines", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it("9. Validate Drop of the Newly Created - Stores - Table from MySQL datasource", () => {
    let deleteTblQuery = "DROP TABLE productlines;";
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("DropProductlines");
    dataSources.EnterQuery(deleteTblQuery);
    agHelper.FocusElement(locator._codeMirrorTextArea);
    //agHelper.VerifyEvaluatedValue(tableCreateQuery);

    dataSources.RunQueryNVerifyResponseViews();
    ee.ExpandCollapseEntity("Datasources");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementAbsence(ee._entityNameInExplorer("Stores"));
  });

  it("10. Verify application does not break when user runs the query with wrong table name", function() {
    ee.SelectEntityByName("DropProductlines", "Queries/JS");
    dataSources.RunQuery(false);
    agHelper
      .GetText(dataSources._queryError)
      .then(($errorText) =>
        expect($errorText).to.eq("Unknown table 'fakeapi.productlines'"),
      );
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("11. Verify Deletion of the datasource when Pages/Actions associated are not removed yet", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409);//Customers page & queries still active
  });

  function GenerateCRUDNValidateDeployPage(
    col1Text: string,
    col2Text: string,
    col3Text: string,
    jsonFromHeader: string,
  ) {
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.AssertContains("Successfully generated a page");
    //agHelper.ValidateNetworkStatus("@getActions", 200);//Since failing sometimes
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@updateLayout", 200);

    agHelper.GetNClick(dataSources._visibleTextSpan("GOT IT"));
    deployMode.DeployApp();
    table.WaitUntilTableLoad();

    //Validating loaded table
    agHelper.AssertElementExist(dataSources._selectedRow);
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
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
});
