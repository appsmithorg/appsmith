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
  "To verify action selector - action selector general functions",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      homePage.NavigateToHome();
      homePage.ImportApp("setIntervalApp.json");
    });

    it("1. Verify that callbacks can be configured with a success event", () => {
      
    });

    it("2. Verify that callbacks can be configured with a failure event", () => {
      
    });

    it("3. Verify that callbacks can be chained", () => {
      
    });

    it("4. Verify that callbacks can be deleted", () => {
      
    });

    it("5. Verify that the Callbacks section reflects the number of active callbacks accurately", () => {
      
    });

    it("6. Verify that configured actions on existing apps are intact", () => {
      
    });

    it("7. Verify that configured actions stay intact on import of an app", () => {
      
    });

    it("8. Verify that configured actions stay intact on partial import of a page", () => {
      
    });

    it("9. Verify that configured actions stay intact on forking an app", () => {
      
    });
    
    it("10. Verify that configured actions stay intact on navigating between pages", () => {
      
    });
    
  },
);
