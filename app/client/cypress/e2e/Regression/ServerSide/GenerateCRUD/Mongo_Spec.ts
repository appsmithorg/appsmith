import { INTERCEPT } from "../../../../fixtures/variables";

import {
  agHelper,
  appSettings,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Validate Mongo CRUD with JSON Form",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  () => {
    let dsName: any;

    beforeEach(function () {
      if (INTERCEPT.MONGO) {
        cy.log("Mongo DB is not found. Using intercept");
        dataSources.StartInterceptRoutesForMongo();
      } else cy.log("Mongo DB is found, hence using actual DB");
    });

    it("1. Create DS & then Add new Page and generate CRUD template using created datasource", () => {
      appSettings.OpenPaneAndChangeTheme("Water Lily");

      dataSources.CreateDataSource("Mongo", true, false);
      cy.get("@dsName").then(($dsName: any) => {
        dsName = $dsName;
        PageList.AddNewPage();
        PageList.AddNewPage("Generate page with data");
        agHelper.GetNClick(dataSources._selectDatasourceDropdown);
        agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);
      });
      assertHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "pokemon");

      agHelper.GetNClick(dataSources._selectTableDropdown, 1, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "img");

      GenerateCRUDNValidateDeployPage(
        "http://www.serebii.net/pokemongo/pokemon/150.png",
        "150",
        `["Bug","Ghost","Dark"]`,
        10,
      );

      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");

      //Delete the test data
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
      });

      // deployMode.DeployApp();
      // agHelper.NavigateBacktoEditor();
    });

    //Update, delete, Add goes here

    function GenerateCRUDNValidateDeployPage(
      col1Text: string,
      col2Text: string,
      col3Text: string,
      idIndex: number,
    ) {
      agHelper.GetNClick(dataSources._generatePageBtn);
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.AssertContains("Successfully generated a page"); // Commenting this since FindQuery failure appears sometimes
      assertHelper.AssertNetworkStatus("@getActions", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));

      //Validating loaded table
      agHelper.AssertElementExist(dataSources._selectedRow);

      findTheDataRow(col1Text).then((rowIndex: number) => {
        cy.log(`This is the rowIndex of ${col1Text} : ${rowIndex}`);
        table
          .ReadTableRowColumnData(rowIndex, 0, "v2", 2000)
          .then(($cellData) => {
            expect($cellData).to.eq(col1Text);
          });
        table
          .ReadTableRowColumnData(rowIndex, 3, "v2", 200)
          .then(($cellData) => {
            expect($cellData).to.eq(col2Text);
          });
        table
          .ReadTableRowColumnData(rowIndex, 6, "v2", 200)
          .then(($cellData) => {
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
        dataSources.AssertJSONFormHeader(0, idIndex, "Id", "", true);
      });
    }

    function findTheDataRow(col1Text: string) {
      if (col1Text.length === 0) {
        return cy.wrap(0);
      }

      return agHelper
        .GetElement(table._tableColumnDataWithText(0, col1Text, "v2"))
        .closest(".tr")
        .then(($p1) => {
          return cy
            .wrap($p1)
            .parent()
            .children()
            .then(($children) => {
              let index = 0;
              $children.each((i, el) => {
                // Iterate through the children
                if (Cypress.$(el).is($p1)) {
                  // Check if the current child is p1
                  index = i; // Assign the index when found
                }
              });
              return index;
            });
        });
    }
  },
);
