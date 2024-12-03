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
  "To verify action selector - StopWatchGeoLocation function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      homePage.NavigateToHome();
      homePage.ImportApp("setIntervalApp.json");
    });

    it("1. Verify that calling geolocation.clearWatch() when no geolocation watch is active throws an error.", () => {
      
    });

    it("2. Verify that geolocation.clearWatch() allows clearing the current watch, and a new geolocation watch can be started immediately after.", () => {
      
    });

    
  },
);
