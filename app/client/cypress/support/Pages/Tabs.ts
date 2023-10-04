import { ObjectsRegistry } from "../Objects/Registry";

export class Tabs {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public propPane = ObjectsRegistry.PropertyPane;

  private _tabSelector = (tabId: string): string => `.t--tabid-${tabId}`;
  private _tabsWidgetNameSelector = (widgetName: string): string =>
    `.t--widget-${widgetName?.toLowerCase()}`;
  private _showTabsProperty = "showtabs";
  public _addTab = ".t--add-tab-btn";
  public _placeholderTabTitle = "[placeholder='Tab title']";
  public _tabsWidgetStyle =
    "(//div[contains(@class,'t--draggable-tabswidget')]//div)[6]";

  public toggleShowTabHeader(showTabs = true, selector: string) {
    this.agHelper.GetNClick(selector).then(() => {
      this.propPane.TogglePropertyState(
        this._showTabsProperty,
        showTabs ? "On" : "Off",
      );
      this.agHelper.Sleep();
    });
  }

  public getTabSelectorByWidgetName(widgetName = "Tabs1", tabId = "tab1") {
    return `${this._tabsWidgetNameSelector(widgetName)} ${this._tabSelector(
      tabId,
    )}`;
  }

  public getWidgetSelectorByNameComponent(widgetName = "Tabs1") {
    return `${this._tabsWidgetNameSelector(widgetName)} .t--widget-name`;
  }
}
