import datasource from "../../locators/DatasourcesEditor.json";
import { ObjectsRegistry as _ } from "../Objects/Registry";
import ClickOptions = Cypress.ClickOptions;
import { Sidebar } from "./IDE/Sidebar";
export enum SidebarButton {
  Data = "Data",
  Pages = "Pages",
  Libraries = "Libraries",
  Settings = "Settings",
}

export enum EntityType {
  Widget = "Widget",
  Datasource = "Datasource",
  Query = "Query",
  Api = "Api",
  JSObject = "JSObject",
  Page = "Page",
}

class EditorNavigation {
  sidebar: Sidebar;
  ViaSidebar(button: SidebarButton) {
    this.sidebar.navigate(button);
  }

  constructor() {
    this.sidebar = new Sidebar(Object.values(SidebarButton));
  }

  NavigateToDatasource(name: string) {
    this.ViaSidebar(SidebarButton.Data);
    cy.get(datasource.datasourceCard)
      .contains(name)
      .first()
      .scrollIntoView()
      .should("be.visible")
      .click()
      .parents(datasource.datasourceCard)
      .should("have.attr", "data-selected", "true");
  }

  NavigateToWidget(
    name: string,
    clickOptions?: Partial<ClickOptions>,
    hierarchy: string[] = [],
  ) {
    this.ViaSidebar(SidebarButton.Pages);
    _.EntityExplorer.NavigateToSwitcher("Explorer");
    _.EntityExplorer.ExpandCollapseEntity("Widgets");
    hierarchy.forEach((level) => {
      _.EntityExplorer.ExpandCollapseEntity(level);
    });
    cy.xpath(_.EntityExplorer._entityNameInExplorer(name))
      .first()
      .click(
        clickOptions?.ctrlKey
          ? { ctrlKey: true, force: true }
          : { multiple: true, force: true },
      );
    _.AggregateHelper.Sleep(); //for selection to settle
  }

  NavigateToQuery(name: string) {
    this.ViaSidebar(SidebarButton.Pages);
    _.EntityExplorer.NavigateToSwitcher("Explorer");
    _.EntityExplorer.ExpandCollapseEntity("Queries/JS");
    cy.xpath(_.EntityExplorer._entityNameInExplorer(name))
      .first()
      .click({ multiple: true, force: true });
    _.AggregateHelper.Sleep(); //for selection to settle
  }

  NavigateToJSObject(name: string) {
    this.ViaSidebar(SidebarButton.Pages);
    _.EntityExplorer.NavigateToSwitcher("Explorer");
    _.EntityExplorer.ExpandCollapseEntity("Queries/JS");
    cy.xpath(_.EntityExplorer._entityNameInExplorer(name))
      .first()
      .click({ multiple: true, force: true });
    _.AggregateHelper.Sleep(); //for selection to settle
  }

  NavigateToPage(name: string) {
    this.ViaSidebar(SidebarButton.Pages);
    _.EntityExplorer.NavigateToSwitcher("Explorer");
    _.EntityExplorer.ExpandCollapseEntity("Pages");
    cy.xpath(_.EntityExplorer._entityNameInExplorer(name))
      .first()
      .click({ multiple: true, force: true });
    _.AggregateHelper.Sleep(); //for selection to settle
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
}

export default new EditorNavigation();
