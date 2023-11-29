import { dataSources } from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Fix UQI query switching", function () {
  it(
    "excludeForAirgap",
    "1. The command of the Mongo query must be preserved and should not default to initial value after changed.",
    function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreateDataSource("Mongo", false, false);
      dataSources.CreateQueryAfterDSSaved("", "MongoQuery");
      dataSources.ValidateNSelectDropdown(
        "Commands",
        "Find document(s)",
        "Insert document(s)",
      );
      dataSources.NavigateToDSCreateNew();
      dataSources.CreateDataSource("Twilio", false, false);
      dataSources.CreateQueryAfterDSSaved("", "TwilioQuery");
      dataSources.ValidateNSelectDropdown("Commands", "", "Schedule message");
      EditorNavigation.SelectEntityByName("MongoQuery", EntityType.Query);
      dataSources.ValidateNSelectDropdown("Commands", "Insert document(s)");

      EditorNavigation.SelectEntityByName("TwilioQuery", EntityType.Query);
      dataSources.ValidateNSelectDropdown("Commands", "Schedule message");
    },
  );
});
