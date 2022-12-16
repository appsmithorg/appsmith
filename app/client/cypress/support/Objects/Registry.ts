import { AggregateHelper } from "../Pages/AggregateHelper";
import { JSEditor } from "../Pages/JSEditor";
import { EntityExplorer } from "../Pages/EntityExplorer";
import { CommonLocators } from "./CommonLocators";
import { ApiPage } from "../Pages/ApiPage";
import { HomePage } from "../Pages/HomePage";
import { DataSources } from "../Pages/DataSources";
import { Table } from "../Pages/Table";
import { TableV2 } from "../Pages/TableV2";
import { PropertyPane } from "../Pages/PropertyPane";
import { DeployMode } from "../Pages/DeployModeHelper";
import { GitSync } from "../Pages/GitSync";
import { FakerHelper } from "../Pages/FakerHelper";
import { DebuggerHelper } from "../Pages/DebuggerHelper";
import { AppSettings } from "../Pages/AppSettings/AppSettings";
import { GeneralSettings } from "../Pages/AppSettings/GeneralSettings";
import { PageSettings } from "../Pages/AppSettings/PageSettings";
import { ThemeSettings } from "../Pages/AppSettings/ThemeSettings";

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

  private static tableV2__: TableV2;
  static get TableV2(): TableV2 {
    if (ObjectsRegistry.tableV2__ === undefined) {
      ObjectsRegistry.tableV2__ = new TableV2();
    }
    return ObjectsRegistry.tableV2__;
  }

  private static propertyPane__: PropertyPane;
  static get PropertyPane(): PropertyPane {
    if (ObjectsRegistry.propertyPane__ === undefined) {
      ObjectsRegistry.propertyPane__ = new PropertyPane();
    }
    return ObjectsRegistry.propertyPane__;
  }

  private static deployMode__: DeployMode;
  static get DeployMode(): DeployMode {
    if (ObjectsRegistry.deployMode__ === undefined) {
      ObjectsRegistry.deployMode__ = new DeployMode();
    }
    return ObjectsRegistry.deployMode__;
  }

  private static gitSync__: GitSync;
  static get GitSync(): GitSync {
    if (ObjectsRegistry.gitSync__ === undefined) {
      ObjectsRegistry.gitSync__ = new GitSync();
    }
    return ObjectsRegistry.gitSync__;
  }

  private static fakerHelper__: FakerHelper;
  static get FakerHelper(): FakerHelper {
    if (ObjectsRegistry.fakerHelper__ === undefined) {
      ObjectsRegistry.fakerHelper__ = new FakerHelper();
    }
    return ObjectsRegistry.fakerHelper__;
  }

  private static debuggerHelper__: DebuggerHelper;
  static get DebuggerHelper(): DebuggerHelper {
    if (ObjectsRegistry.debuggerHelper__ === undefined) {
      ObjectsRegistry.debuggerHelper__ = new DebuggerHelper();
    }
    return ObjectsRegistry.debuggerHelper__;
  }

  private static appSettings__: AppSettings;
  static get AppSettings(): AppSettings {
    if (ObjectsRegistry.appSettings__ === undefined) {
      ObjectsRegistry.appSettings__ = new AppSettings();
    }
    return ObjectsRegistry.appSettings__;
  }

  private static generalSettings__: GeneralSettings;
  static get GeneralSettings(): GeneralSettings {
    if (ObjectsRegistry.generalSettings__ === undefined) {
      ObjectsRegistry.generalSettings__ = new GeneralSettings();
    }
    return ObjectsRegistry.generalSettings__;
  }

  private static pageSettings__: PageSettings;
  static get PageSettings(): PageSettings {
    if (ObjectsRegistry.pageSettings__ === undefined) {
      ObjectsRegistry.pageSettings__ = new PageSettings();
    }
    return ObjectsRegistry.pageSettings__;
  }

  private static themeSettings__: ThemeSettings;
  static get ThemeSettings(): ThemeSettings {
    if (ObjectsRegistry.themeSettings__ === undefined) {
      ObjectsRegistry.themeSettings__ = new ThemeSettings();
    }
    return ObjectsRegistry.themeSettings__;
  }
}

export const initLocalstorageRegistry = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
  localStorage.setItem("inDeployedMode", "false");
};

declare namespace Cypress {
  namespace Cypress {
    interface Chainable {
      TypeTab: (shiftKey: boolean, ctrlKey: boolean) => void;
    }
  }
}
