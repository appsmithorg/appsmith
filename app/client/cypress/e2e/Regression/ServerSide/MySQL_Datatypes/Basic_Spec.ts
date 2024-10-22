import {
  agHelper,
  appSettings,
  dataSources,
  deployMode,
  entityExplorer,
  entityItems,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import inputData from "../../../../support/Objects/mySqlData";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

let dsName: any, query: string;

describe(
  "MySQL Datatype tests",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    before("Load dsl, Change theme, Create Mysql DS", () => {
      agHelper.AddDsl("Datatypes/mySQLdsl");

      appSettings.OpenPaneAndChangeTheme("Moon");
      dataSources.CreateDataSource("MySql");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("1. Creating mysqlDTs table & queries", () => {
      //IF NOT EXISTS can be used - which creates tabel if it does not exist and donot throw any error if table exists.
      //But if we add this option then next case could fail inn that case.
      query = inputData.query.createTable;

      dataSources.CreateQueryFromOverlay(dsName, query, "createTable"); //Creating query from EE overlay
      dataSources.RunQuery();

      //Other queries
      query = inputData.query.insertRecord;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        inputData.tableName,
        "Insert",
      );
      agHelper.RenameWithInPane("insertRecord");
      dataSources.EnterQuery(query);

      query = inputData.query.dropTable;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        inputData.tableName,
        "Delete",
      );
      agHelper.RenameWithInPane("dropTable");
      dataSources.EnterQuery(query);

      //Creating SELECT query
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        inputData.tableName,
        "Select",
      );
      agHelper.RenameWithInPane("selectRecords");
      dataSources.RunQuery();
      agHelper
        .GetText(dataSources._noRecordFound)
        .then(($noRecMsg) =>
          expect($noRecMsg).to.eq("No data records to show"),
        );
    });

    //Insert valid/true values into datasource
    it("2. Inserting record", () => {
      deployMode.DeployApp();
      table.WaitForTableEmpty(); //asserting table is empty before inserting!
      agHelper.ClickButton("Run InsertQuery");
      inputData.input.forEach((valueArr, i) => {
        agHelper.ClickButton("Run InsertQuery");
        valueArr.forEach((value, index) => {
          if (value !== "")
            agHelper.EnterInputText(inputData.inputFieldName[index], value);
        });
        i % 2 && agHelper.ToggleSwitch("Bool_column");
        agHelper.ClickButton("insertRecord");
        agHelper.Sleep(2000); //for the modal to close after entering all values & value to reflect in table
        agHelper.AssertElementVisibility(
          locators._buttonByText("Run InsertQuery"),
        );
        agHelper.Sleep(3000);
      });
    });

    //Verify weather expected value is present in each cell
    //i.e. weather right data is pushed and fetched from datasource.
    it("3. Validating values in each cell", () => {
      cy.wait(2000);
      inputData.result.forEach((res_array, i) => {
        res_array.forEach((value, j) => {
          table.ReadTableRowColumnData(j, i, "v1", 0).then(($cellData) => {
            if (i === inputData.result.length - 1) {
              const obj = JSON.parse($cellData);
              expect(JSON.stringify(obj)).to.eq(JSON.stringify(value));
            } else {
              expect($cellData).to.eq(value);
            }
          });
        });
      });
    });

    //null will be displayed as empty string in tables
    //So test null we have to intercept execute request.
    //And check response payload.
    it("4. Testing null value", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("selectRecords", EntityType.Query);
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then((intercept) => {
        expect(
          typeof intercept.response?.body.data.body[5].varchar_column,
        ).to.be.equal("object");
        expect(
          intercept.response?.body.data.body[5].varchar_column,
        ).to.be.equal(null);
      });
    });

    after(
      "Verify Drop of tables & Deletion of the datasource after all created queries are deleted",
      () => {
        EditorNavigation.SelectEntityByName("dropTable", EntityType.Query);
        dataSources.RunQuery();
        dataSources.AssertQueryTableResponse(0, "0"); //Success response for dropped table!
        dataSources.AssertTableInVirtuosoList(
          dsName,
          inputData.tableName,
          false,
        );

        //DS deletion
        dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Since all queries exists
        AppSidebar.navigate(AppSidebarButton.Editor);
        PageLeftPane.switchSegment(PagePaneSegment.Queries);
        ["createTable", "dropTable", "insertRecord", "selectRecords"].forEach(
          (type) => {
            entityExplorer.ActionContextMenuByEntityName({
              entityNameinLeftSidebar: type,
              action: "Delete",
              entityType: entityItems.Query,
            });
          },
        );
        deployMode.DeployApp();
        deployMode.NavigateBacktoEditor();
        dataSources.DeleteDatasourceFromWithinDS(dsName, 200);
      },
    );
  },
);
