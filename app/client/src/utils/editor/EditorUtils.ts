import { registerWidgets } from "../WidgetRegistry";
import PropertyControlRegistry from "../PropertyControlRegistry";
import { generateReactKey } from "../../widgets/WidgetUtils";

export const editorInitializer = async () => {
  registerWidgets();
  PropertyControlRegistry.registerPropertyControlBuilders();
};

type TabData = { [tabId: string]: string };

const LOCAL_STORAGE_KEY = "EDITOR_TABS_DATA";

const getCurrentTabs = (): TabData => {
  const currentTabsJSON = localStorage.getItem(LOCAL_STORAGE_KEY) || "{}";
  const currentTabs: TabData = JSON.parse(currentTabsJSON);
  return currentTabs;
};

const setCurrentTabs = (tabs: TabData) => {
  const currentTabsJSON = JSON.stringify(tabs);
  localStorage.setItem(LOCAL_STORAGE_KEY, currentTabsJSON);
};

let tabId: string;
export const trackOpenEditorTabs = (appId: string): boolean => {
  // Check if a tab id is created or else create one
  if (!tabId) {
    tabId = generateReactKey({ prefix: "tab:" });
    // add event listener for closing tab and remove entry from local storage
    window.addEventListener("beforeunload", () => {
      // Remove entry from local storage
      const currentTabs = getCurrentTabs();
      delete currentTabs[tabId];
      setCurrentTabs(currentTabs);
    });
  }
  const currentTabs = getCurrentTabs();
  // Update tabs data
  const newTabs = {
    ...currentTabs,
    [tabId]: appId,
  };
  setCurrentTabs(newTabs);
  // Return if current app is open in any other open tabs
  return !!Object.values(currentTabs).indexOf(appId);
};
