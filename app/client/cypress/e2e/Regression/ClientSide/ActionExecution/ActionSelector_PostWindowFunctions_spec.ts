import {
  agHelper,
  apiPage,
  appSettings,
  assertHelper,
  dataManager,
  deployMode,
  draggableWidgets,
  entityExplorer,
  homePage,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "To verify action selector - PostWindow function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      homePage.NavigateToHome();
      homePage.ImportApp("setIntervalApp.json");
    });

    it("1. Verify that postWindowMessage() can successfully send a message to the parent application’s window.", () => {
      
    });

    it("2. Verify that postWindowMessage() can successfully send a message to a specified iframe embedded within Appsmith.", () => {
      
    });

    it("3. Verify the behavior of postWindowMessage() when sending an empty message.", () => {
     
    });

    it("4. Verify behavior when an invalid or malformed URL is provided as targetOrigin.", () => {
      
    });

    
  },
);
