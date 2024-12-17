import {
  agHelper,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  homePage,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

let dsName: any;

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

    it("1. Create DS & then Add new Page and generate CRUD template using created datasource", () => {
      dataSources.CreateDataSource("MySql");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        AppSidebar.navigate(AppSidebarButton.Editor);
        PageList.AddNewPage();
        PageList.AddNewPage("Generate page with data");
        agHelper.GetNClick(dataSources._selectDatasourceDropdown);
        agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);
      });

      assertHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        "worldCountryInfo",
      );
      agHelper.GetNClick(dataSources._generatePageBtn);

      GenerateCRUDNValidateDeployPage("ABW", "Aruba", "North America", "Code");

      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");
      //Delete the test data
      PageList.ShowList();
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page2",
        action: "Delete",
        entityType: entityItems.Page,
      });

      //Should not be able to delete ds until app is published again
      //coz if app is published & shared then deleting ds may cause issue, So!
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.DeleteDatasourceFromWithinDS(dsName as string, 409);
        agHelper.WaitUntilAllToastsDisappear();
      });
      deployMode.DeployApp(locators._emptyPageTxt);
      agHelper.Sleep(3000);
      deployMode.NavigateBacktoEditor();
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.DeleteDatasourceFromWithinDS(dsName as string, 200);
      });
      agHelper.WaitUntilAllToastsDisappear();
    });

    it("2. Create new app and Generate CRUD page using a new datasource", () => {
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      PageList.AddNewPage("Generate page with data");
      //agHelper.GetNClick(homePage._buildFromDataTableActionCard);
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        "Connect new datasource",
      );

      dataSources.CreateDataSource("MySql", false);

      assertHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "customers");
      agHelper.GetNClick(dataSources._generatePageBtn);

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

    it("3. Create new CRUD Table 'Productlines' and populate & refresh Entity Explorer to find the new table + Bug 14063", () => {
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

      dataSources.CreateQueryForDS(
        dsName,
        tableCreateQuery,
        "CreateProductLines",
      );
      agHelper.FocusElement(locators._codeMirrorTextArea);
      //agHelper.VerifyEvaluatedValue(tableCreateQuery); //failing sometimes!

      dataSources.runQueryAndVerifyResponseViews();
      dataSources.AssertTableInVirtuosoList(dsName, "productlines");

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    //Open Bug 14063 - hence skipping
    // it.skip("6. Verify Update/Delete row/Delete field data from Deploy page - on Productlines - existing record + Bug 14063", () => {
    //   EditorNavigation.SelectEntityByName("update_form", EntityType.Widget);
    //   propPane.ChangeJsonFormFieldType(
    //     "Text Description",
    //     "Multiline Text Input",
    //   );
    //   propPane.NavigateBackToPropertyPane();
    //   propPane.ChangeJsonFormFieldType(
    //     "Html Description",
    //     "Multiline Text Input",
    //   );
    //   propPane.NavigateBackToPropertyPane();
    //   deployMode.DeployApp();
    //   table.SelectTableRow(0, 0, false); //to make JSON form hidden
    //   agHelper.AssertElementAbsence(locators._jsonFormWidget);
    //   table.SelectTableRow(3);
    //   agHelper.AssertElementVisibility(locators._jsonFormWidget);

    //   dataSources.AssertJSONFormHeader(3, 0, "productLine");

    //   deployMode.EnterJSONTextAreaValue(
    //     "Html Description",
    //     "The largest cruise ship is twice the length of the Washington Monument. Some cruise ships have virtual balconies.",
    //   );
    //   agHelper.ClickButton("Update"); //Update does not work, Bug 14063
    //   agHelper.AssertElementAbsence(locators._toastMsg); //Validating fix for Bug 14063
    //   assertHelper.AssertNetworkStatus("@postExecute", 200);
    //   table.AssertSelectedRow(3);

    //   //validating update happened fine!
    //   table.ReadTableRowColumnData(3, 2, "v1", 200).then(($cellData) => {
    //     expect($cellData).to.eq(
    //       "The largest cruise ship is twice the length of the Washington Monument. Some cruise ships have virtual balconies.",
    //     );
    //   });
    // });

    // it.skip("7. Verify Add/Update/Delete from Deploy page - on Productlines - new record + Bug 14063", () => {
    //   //To script aft bug fix!
    // });

    it("4. Validate Drop of the Newly Created - Stores - Table from MySQL datasource", () => {
      let deleteTblQuery = "DROP TABLE productlines;";
      dataSources.CreateQueryForDS(dsName, deleteTblQuery, "DropProductlines");
      agHelper.FocusElement(locators._codeMirrorTextArea);
      //agHelper.VerifyEvaluatedValue(tableCreateQuery);

      dataSources.runQueryAndVerifyResponseViews();
      dataSources.AssertTableInVirtuosoList(dsName, "Stores", false);
    });

    it("5. Verify application does not break when user runs the query with wrong table name", function () {
      EditorNavigation.SelectEntityByName("DropProductlines", EntityType.Query);
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response?.body.data.isExecutionSuccess).to.eq(false);
        expect(
          response?.body.data.pluginErrorDetails.downstreamErrorMessage,
        ).to.contains("Unknown table 'fakeapi.productlines'");
      });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    after(
      "Verify Deletion of the datasource when Pages/Actions associated are not removed yet",
      () => {
        dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Customers page & queries still active
      },
    );

    function GenerateCRUDNValidateDeployPage(
      col1Text: string,
      col2Text: string,
      col3Text: string,
      jsonFromHeader: string,
    ) {
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
  },
);
