import { ObjectsRegistry } from "../Objects/Registry";

type operation =
  | "Insert One"
  | "Insert Many"
  | "Update One"
  | "Update Many"
  | "Fetch Details"
  | "Fetch Many"
  | "Delete One";

export class GsheetHelper {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  private dataSources = ObjectsRegistry.DataSources;
  private entityExplorer = ObjectsRegistry.EntityExplorer;

  public AddNewSpreadsheetQuery(
    dataSourceName: string,
    spreadsheet: string,
    rowData: string,
  ) {
    this.entityExplorer.CreateNewDsQuery(dataSourceName);
    this.dataSources.ValidateNSelectDropdown(
      "Operation",
      "Fetch Many",
      "Insert One",
    );
    this.dataSources.ValidateNSelectDropdown(
      "Entity",
      "Sheet Row(s)",
      "Spreadsheet",
    );
    this.agHelper.EnterValue(spreadsheet, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Spreadsheet Name",
    });
    this.agHelper.RenameQuery("insert_spreadsheet");
    this.agHelper.EnterValue(rowData, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Row object(s)",
    });
    this.dataSources.RunQuery();
  }

  public DeleteSpreadsheetQuery(dataSourceName: string, spreadsheet: string) {
    this.entityExplorer.CreateNewDsQuery(dataSourceName);
    this.dataSources.ValidateNSelectDropdown(
      "Operation",
      "Fetch Many",
      "Delete One",
    );
    this.dataSources.ValidateNSelectDropdown(
      "Entity",
      "Sheet Row(s)",
      "Spreadsheet",
    );
    this.dataSources.ValidateNSelectDropdown("Spreadsheet", "", spreadsheet);
    this.agHelper.RenameQuery("delete_spreadsheet");
    this.dataSources.RunQuery();
  }

  public AddInsertOrUpdateQuery(
    operation: operation,
    dataSourceName: string,
    spreadSheet: string,
    rowData: string,
    executeQuery = true,
    sheetName = "Sheet1",
    headRowIndex = "1",
  ) {
    this.EnterBasicQueryValues(
      operation,
      dataSourceName,
      spreadSheet,
      true,
      "Sheet Row(s)",
      sheetName,
      headRowIndex,
    );
    let inputField = "";
    if (operation.includes("Insert")) {
      inputField = operation == "Insert One" ? "Row object" : "Row object(s)";
    } else if (operation.includes("Update")) {
      inputField =
        operation == "Update One"
          ? "Update row object"
          : "Update row object(s)";
    }

    this.agHelper.EnterValue(rowData, {
      propFieldName: "",
      directInput: false,
      inputFieldName: inputField,
    });
    if (executeQuery) this.dataSources.RunQuery();
  }

  public EnterBasicQueryValues(
    operation: operation,
    dataSourceName: string,
    spreadSheet: string,
    renameQuery = true,
    entity = "Sheet Row(s)",
    sheetName = "Sheet1",
    headRowIndex = "1",
  ) {
    this.entityExplorer.CreateNewDsQuery(dataSourceName);
    this.dataSources.ValidateNSelectDropdown(
      "Operation",
      "Fetch Many",
      operation,
    );
    this.dataSources.ValidateNSelectDropdown("Entity", "Sheet Row(s)", entity);
    this.agHelper.Sleep(500);
    this.dataSources.ValidateNSelectDropdown("Spreadsheet", "", spreadSheet);
    if (!entity.includes("Spreadsheet")) {
      this.dataSources.ValidateNSelectDropdown("Sheet name", "", sheetName);
      this.agHelper.EnterValue(headRowIndex, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Table heading row index",
      });
    }
    if (renameQuery) {
      this.agHelper.RenameQuery(
        operation.toLowerCase().replace(" ", "_") + "_query",
      );
    }
  }

  public SelectMultiDropDownValue(ddName: string, option: string) {
    this.agHelper.GetNClick(this.dataSources._multiSelectDropdown(ddName));
    this.agHelper.GetNClickByContains(this.dataSources._dropdownOption, option);
  }
}
