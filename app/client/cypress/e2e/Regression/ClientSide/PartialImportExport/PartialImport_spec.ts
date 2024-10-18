import { partialImportExport } from "../../../../support/Objects/ObjectsCore";

describe(
  "Partial import functionality",
  { tags: ["@tag.ImportExport", "@tag.Git"] },
  () => {
    beforeEach(() => {
      partialImportExport.OpenImportModal();
    });

    it("1. Should import all the selected JsObjects", () => {
      partialImportExport.ImportPartiallyExportedFile(
        "JSExportedOnly.json",
        "JSObjects",
        ["JSObject1"],
      );
    });

    it("2. Should import all the selected queries", () => {
      partialImportExport.ImportPartiallyExportedFile(
        "QueriesExportedOnly.json",
        "Queries",
        ["DeleteQuery", "InsertQuery", "SelectQuery", "UpdateQuery"],
      );
    });

    it("3. Should import all the widgets", () => {
      partialImportExport.ImportPartiallyExportedFile(
        "WidgetsExportedOnly.json",
        "Widgets",
        [
          "Alert_text",
          "Text16",
          "add_btn",
          "refresh_btn",
          "Text12",
          "Button1",
          "Delete_Button",
          "insert_form",
          "data_table",
        ],
      );
    });

    it("4. Should import all the selected datasources", () => {
      partialImportExport.ImportPartiallyExportedFile(
        "DatasourceExportedOnly.json",
        "Data",
        ["Users"],
      );
    });

    it("5. Should import all the selected custom js libs", () => {
      partialImportExport.ImportPartiallyExportedFile(
        "CustomJsLibsExportedOnly.json",
        "Libraries",
        ["jsonwebtoken"],
      );
    });
  },
);
