import datasource from "../../locators/DatasourcesEditor.json";
import { ObjectsRegistry as _ } from "../Objects/Registry";
import ClickOptions = Cypress.ClickOptions;
import { Sidebar } from "./IDE/Sidebar";
import { LeftPane } from "./IDE/LeftPane";
import PageList from "./PageList";

export enum AppSidebarButton {
  Data = "Datasources",
  Editor = "Editor",
  Libraries = "Libraries",
  Settings = "Settings",
}

export const AppSidebar = new Sidebar(Object.values(AppSidebarButton));

export enum PagePaneSegment {
  UI = "UI",
  Queries = "Queries",
  JS = "JS",
}

export const editorTabSelector = (name: string) =>
  `[data-testid='t--ide-tab-${name.toLowerCase()}']`;

export enum EditorViewMode {
  FullScreen = "FullScreen",
  SplitScreen = "SplitScreen",
}

const pagePaneListItemSelector = (name: string) =>
  "//div[contains(@class, 't--entity-name')][text()='" + name + "']";

export const PageLeftPane = new LeftPane(
  pagePaneListItemSelector,
  ".ide-editor-left-pane",
  ".ide-editor-left-pane__content .active.t--entity-item",
  Object.values(PagePaneSegment),
);

export enum EntityType {
  Widget = "Widget",
  Datasource = "Datasource",
  Query = "Query",
  Api = "Api",
  JSObject = "JSObject",
  Page = "Page",
}

class EditorNavigation {
  public locators = {
    MaximizeBtn: "[data-testid='t--ide-maximize']",
    MinimizeBtn: "[data-testid='t--ide-minimize']",
    announcementCloseButton: "[data-testid='t--ide-close-announcement']",
  };

  NavigateToDatasource(name: string) {
    AppSidebar.navigate(AppSidebarButton.Data);
    cy.get(datasource.datasourceCard)
      .contains(name)
      .first()
      .scrollIntoView()
      .should("be.visible")
      .click()
      .parents(datasource.datasourceCard)
      .as("dsCard");
    cy.get("@dsCard").should("have.attr", "data-selected", "true");
  }

  NavigateToWidget(
    name: string,
    clickOptions?: Partial<ClickOptions>,
    hierarchy: string[] = [],
  ) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    hierarchy.forEach((level) => {
      PageLeftPane.expandCollapseItem(level);
    });
    PageLeftPane.selectItem(name, clickOptions);
    _.AggregateHelper.Sleep(); //for selection to settle
  }

  NavigateToQuery(name: string) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    PageLeftPane.switchSegment(PagePaneSegment.Queries);
    PageLeftPane.selectItem(name);
    _.AggregateHelper.Sleep(); //for selection to settle
  }

  NavigateToJSObject(name: string) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    PageLeftPane.selectItem(name);
    _.AggregateHelper.Sleep(); //for selection to settle
  }

  NavigateToPage(name: string, networkCallAlias = false) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    PageList.ShowList();
    PageLeftPane.selectItem(name, { multiple: true, force: true });
    _.AggregateHelper.Sleep(); //for selection to settle
    networkCallAlias && _.AssertHelper.AssertNetworkStatus("pageSnap");
  }

  SelectEntityByName(
    name: string,
    type: EntityType,
    clickOptions?: Partial<ClickOptions>,
    hierarchy?: string[],
  ) {
    switch (type) {
      case EntityType.Widget:
        this.NavigateToWidget(name, clickOptions, hierarchy);
        break;
      case EntityType.Datasource:
        this.NavigateToDatasource(name);
        break;
      case EntityType.Query:
        this.NavigateToQuery(name);
        break;
      case EntityType.Api:
        this.NavigateToQuery(name);
        break;
      case EntityType.JSObject:
        this.NavigateToJSObject(name);
        break;
      case EntityType.Page:
        this.NavigateToPage(name);
        break;
    }
  }

  ShowCanvas() {
    AppSidebar.navigate(AppSidebarButton.Editor);
    PageLeftPane.switchSegment(PagePaneSegment.UI);
  }

  SwitchScreenMode(mode: EditorViewMode) {
    if (mode === EditorViewMode.FullScreen) {
      _.AggregateHelper.GetNClick(this.locators.MaximizeBtn);
    } else {
      _.AggregateHelper.GetNClick(this.locators.MinimizeBtn);
      this.CloseAnnouncementModal();
    }
  }

  CloseAnnouncementModal() {
    cy.get("body").then(($body) => {
      if ($body.find(this.locators.announcementCloseButton).length > 0) {
        _.AggregateHelper.GetNClick(
          this.locators.announcementCloseButton,
          0,
          true,
        );
      }
    });
  }
}

export default new EditorNavigation();
