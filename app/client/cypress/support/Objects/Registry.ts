import { AggregateHelper } from "../Pages/AggregateHelper";
import { JSEditor } from "../Pages/JSEditor";
import { EntityExplorer } from "../Pages/EntityExplorer";
import { CommonLocators } from "./CommonLocators";
import { ApiPage } from "../Pages/ApiPage";
import { HomePage } from "../Pages/HomePage";
import { DataSources } from "../Pages/DataSources";
import { Table } from "../Pages/Table";

export class ObjectsRegistry {
  private static aggregateHelper__: AggregateHelper;
  static get AggregateHelper(): AggregateHelper {
    if (ObjectsRegistry.aggregateHelper__ === undefined) {
      ObjectsRegistry.aggregateHelper__ = new AggregateHelper();
    }
    return ObjectsRegistry.aggregateHelper__;
  }

  private static jsEditor__: JSEditor;
  static get JSEditor(): JSEditor {
    if (ObjectsRegistry.jsEditor__ === undefined) {
      ObjectsRegistry.jsEditor__ = new JSEditor();
    }
    return ObjectsRegistry.jsEditor__;
  }

  private static commonLocators__: CommonLocators;
  static get CommonLocators(): CommonLocators {
    if (ObjectsRegistry.commonLocators__ === undefined) {
      ObjectsRegistry.commonLocators__ = new CommonLocators();
    }
    return ObjectsRegistry.commonLocators__;
  }

  private static entityExplorer__: EntityExplorer;
  static get EntityExplorer(): EntityExplorer {
    if (ObjectsRegistry.entityExplorer__ === undefined) {
      ObjectsRegistry.entityExplorer__ = new EntityExplorer();
    }
    return ObjectsRegistry.entityExplorer__;
  }

  private static apiPage__: ApiPage;
  static get ApiPage(): ApiPage {
    if (ObjectsRegistry.apiPage__ === undefined) {
      ObjectsRegistry.apiPage__ = new ApiPage();
    }
    return ObjectsRegistry.apiPage__;
  }

  private static homePage__: HomePage;
  static get HomePage(): HomePage {
    if (ObjectsRegistry.homePage__ === undefined) {
      ObjectsRegistry.homePage__ = new HomePage();
    }
    return ObjectsRegistry.homePage__;
  }

  private static dataSources__: DataSources;
  static get DataSources(): DataSources {
    if (ObjectsRegistry.dataSources__ === undefined) {
      ObjectsRegistry.dataSources__ = new DataSources();
    }
    return ObjectsRegistry.dataSources__;
  }

  private static table__: Table;
  static get Table(): Table {
    if (ObjectsRegistry.table__ === undefined) {
      ObjectsRegistry.table__ = new Table();
    }
    return ObjectsRegistry.table__;
  }
}

export const initLocalstorageRegistry = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
  localStorage.setItem("inDeployedMode", "false");
};

declare global {
  namespace Cypress {
    interface Chainable {
      typeTab: (shiftKey: Boolean, ctrlKey: boolean) => void;
    }
  }
}
