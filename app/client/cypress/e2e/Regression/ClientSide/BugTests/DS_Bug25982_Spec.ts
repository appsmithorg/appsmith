import { dataSources } from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Fix UQI query switching",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. The command of the query must be preserved and should not default to initial value after changed.", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreateDataSource("Mongo", false, false);
      dataSources.CreateQueryAfterDSSaved("", "MongoQuery");
      dataSources.ValidateNSelectDropdown(
        "Command",
        "Find document(s)",
        "Insert document(s)",
      );
      dataSources.NavigateToDSCreateNew();
      dataSources.CreateDataSource("S3", false, false);
      dataSources.CreateQueryAfterDSSaved("", "S3Query");
      dataSources.ValidateNSelectDropdown(
        "Command",
        "List files in bucket",
        "Create a new file",
      );
      EditorNavigation.SelectEntityByName("MongoQuery", EntityType.Query);
      dataSources.ValidateNSelectDropdown("Command", "Insert document(s)");

      EditorNavigation.SelectEntityByName("S3Query", EntityType.Query);
      dataSources.ValidateNSelectDropdown("Command", "Create a new file");
    });
  },
);
