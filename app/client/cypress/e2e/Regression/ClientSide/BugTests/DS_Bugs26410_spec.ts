import { dataSources } from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Fix UQI query switching",
  {
    tags: [
      "@tag.Datasource",
      "@tag.excludeForAirgap",
      "@tag.Git",
      "@tag.AccessControl",
    ],
  },
  function () {
    it("1. The command of the Mongo query must be preserved and should not default to initial value after changed.", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreateDataSource("Mongo", false, false);
      dataSources.CreateQueryAfterDSSaved("", "MongoQuery");
      dataSources.ValidateNSelectDropdown(
        "Command",
        "Find document(s)",
        "Insert document(s)",
      );
      dataSources.NavigateToDSCreateNew();
      dataSources.CreateDataSource("Twilio", false, false);
      dataSources.CreateQueryAfterDSSaved("", "TwilioQuery");
      dataSources.ValidateNSelectDropdown("Command", "", "Schedule message");
      EditorNavigation.SelectEntityByName("MongoQuery", EntityType.Query);
      dataSources.ValidateNSelectDropdown("Command", "Insert document(s)");

      EditorNavigation.SelectEntityByName("TwilioQuery", EntityType.Query);
      dataSources.ValidateNSelectDropdown("Command", "Schedule message");
    });
  },
);
