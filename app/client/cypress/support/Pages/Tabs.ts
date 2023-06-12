import { ObjectsRegistry } from "../Objects/Registry";

export class Tabs {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public propPane = ObjectsRegistry.PropertyPane;

  private _tabSelector = (tabId: string): string => `.t--tabid=${tabId}`;
  private _showTabsProperty = "showtabs";

  public selectTab(tabName: string, widgetName = "Tabs1") {
    this.agHelper.GetWidgetByName(widgetName).then(() => {
      cy.get(this._tabSelector(tabName)).click({ force: true });
    });
    this.agHelper.Sleep();
  }

  public toggleShowTabHeader(showTabs = true, widgetName = "Tabs1") {
    this.agHelper.GetWidgetByName(widgetName).then(() => {
      this.agHelper.Sleep();
      this.propPane.ToggleOnOrOff(
        this._showTabsProperty,
        showTabs ? "On" : "Off",
      );
      this.agHelper.Sleep();
    });
  }
}
