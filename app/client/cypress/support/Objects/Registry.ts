import { AggregateHelper } from "../Pages/AggregateHelper";
import { JSEditor } from "../Pages/JSEditor";
import { EntityExplorer } from "../Pages/EntityExplorer";
import { CommonLocators } from "./CommonLocators";
import { ApiPage } from "../Pages/ApiPage";
import { AdminSettings } from "../Pages/AdminSettings";
import { HomePage } from "../Pages/HomePage";
import { DataSources } from "../Pages/DataSources";
import { Table } from "../Pages/Table";
import { PropertyPane } from "../Pages/PropertyPane";
import { DeployMode } from "../Pages/DeployModeHelper";
import { GitSync } from "../Pages/GitSync";
import { FakerHelper } from "../Pages/FakerHelper";
import { DebuggerHelper } from "../Pages/DebuggerHelper";
import { LibraryInstaller } from "../Pages/LibraryInstaller";
import { PeekOverlay } from "../Pages/PeekOverlay";
import { InviteModal } from "../Pages/InviteModal";
import { AppSettings } from "../Pages/AppSettings/AppSettings";
import { GeneralSettings } from "../Pages/AppSettings/GeneralSettings";
import { PageSettings } from "../Pages/AppSettings/PageSettings";
import { ThemeSettings } from "../Pages/AppSettings/ThemeSettings";
import { EmbedSettings } from "../Pages/AppSettings/EmbedSettings";
import { Templates } from "../Pages/Templates";
import { Onboarding } from "../Pages/Onboarding";
import { AutoLayout } from "../Pages/AutoLayout";
import { DataManager } from "./DataManager";
import { AssertHelper } from "../Pages/AssertHelper";
import { Tabs } from "../Pages/Tabs";
import { GsheetHelper } from "../Pages/GSheetHelper";
import { CommunityTemplates } from "../Pages/CommunityTemplates";
import { AnvilLayout } from "../Pages/Anvil/AnvilLayout";
import PartialImportExport from "../Pages/PartialImportExport";
import { WDSWidgets } from "../Pages/WDSWidgets";
import { AnvilSnapshot } from "../Pages/Anvil/AnvilSnapshot";

export class ObjectsRegistry {
  private static aggregateHelper__: AggregateHelper;

  static get AggregateHelper(): AggregateHelper {
    if (ObjectsRegistry.aggregateHelper__ === undefined) {
      ObjectsRegistry.aggregateHelper__ = new AggregateHelper();
    }
    return ObjectsRegistry.aggregateHelper__;
  }

  private static assertHelper__: AssertHelper;

  static get AssertHelper(): AssertHelper {
    if (ObjectsRegistry.assertHelper__ === undefined) {
      ObjectsRegistry.assertHelper__ = new AssertHelper();
    }
    return ObjectsRegistry.assertHelper__;
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

  private static adminSettings__: AdminSettings;

  static get AdminSettings(): AdminSettings {
    if (ObjectsRegistry.adminSettings__ === undefined) {
      ObjectsRegistry.adminSettings__ = new AdminSettings();
    }
    return ObjectsRegistry.adminSettings__;
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

  private static tabs__: Tabs;

  static get Tabs(): Tabs {
    if (ObjectsRegistry.tabs__ === undefined) {
      ObjectsRegistry.tabs__ = new Tabs();
    }
    return ObjectsRegistry.tabs__;
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

  private static embedSettings__: EmbedSettings;

  static get EmbedSettings(): EmbedSettings {
    if (ObjectsRegistry.embedSettings__ === undefined) {
      ObjectsRegistry.embedSettings__ = new EmbedSettings();
    }
    return ObjectsRegistry.embedSettings__;
  }

  private static LibraryInstaller__: LibraryInstaller;

  static get LibraryInstaller(): LibraryInstaller {
    if (ObjectsRegistry.LibraryInstaller__ === undefined) {
      ObjectsRegistry.LibraryInstaller__ = new LibraryInstaller();
    }
    return ObjectsRegistry.LibraryInstaller__;
  }

  private static peekOverlay__: PeekOverlay;

  static get PeekOverlay(): PeekOverlay {
    if (ObjectsRegistry.peekOverlay__ === undefined) {
      ObjectsRegistry.peekOverlay__ = new PeekOverlay();
    }
    return ObjectsRegistry.peekOverlay__;
  }

  private static inviteModal__: InviteModal;

  static get InviteModal(): InviteModal {
    if (ObjectsRegistry.inviteModal__ === undefined) {
      ObjectsRegistry.inviteModal__ = new InviteModal();
    }
    return ObjectsRegistry.inviteModal__;
  }

  private static templates__: Templates;

  static get Templates(): Templates {
    if (ObjectsRegistry.templates__ === undefined) {
      ObjectsRegistry.templates__ = new Templates();
    }
    return ObjectsRegistry.templates__;
  }

  private static onboarding__: Onboarding;

  static get Onboarding(): Onboarding {
    if (ObjectsRegistry.onboarding__ === undefined) {
      ObjectsRegistry.onboarding__ = new Onboarding();
    }
    return ObjectsRegistry.onboarding__;
  }

  private static autoLayout__: AutoLayout;

  static get AutoLayout(): AutoLayout {
    if (ObjectsRegistry.autoLayout__ === undefined) {
      ObjectsRegistry.autoLayout__ = new AutoLayout();
    }
    return ObjectsRegistry.autoLayout__;
  }

  private static anvilLayout__: AnvilLayout;

  static get AnvilLayout(): AnvilLayout {
    if (ObjectsRegistry.anvilLayout__ === undefined) {
      ObjectsRegistry.anvilLayout__ = new AnvilLayout();
    }
    return ObjectsRegistry.anvilLayout__;
  }

  private static wdsWidgets__: WDSWidgets;

  static get WDSWidgets(): WDSWidgets {
    if (ObjectsRegistry.wdsWidgets__ === undefined) {
      ObjectsRegistry.wdsWidgets__ = new WDSWidgets();
    }
    return ObjectsRegistry.wdsWidgets__;
  }

  private static anvilSnapshot__: AnvilSnapshot;

  static get AnvilSnapshot(): AnvilSnapshot {
    if (ObjectsRegistry.anvilSnapshot__ === undefined) {
      ObjectsRegistry.anvilSnapshot__ = new AnvilSnapshot();
    }
    return ObjectsRegistry.anvilSnapshot__;
  }

  private static dataManager__: DataManager;

  static get DataManager(): DataManager {
    if (ObjectsRegistry.dataManager__ === undefined) {
      ObjectsRegistry.dataManager__ = new DataManager();
    }
    return ObjectsRegistry.dataManager__;
  }

  private static gsheetHelper__: GsheetHelper;

  static get GSheetHelper(): GsheetHelper {
    if (ObjectsRegistry.gsheetHelper__ === undefined) {
      ObjectsRegistry.gsheetHelper__ = new GsheetHelper();
    }
    return ObjectsRegistry.gsheetHelper__;
  }

  private static communityTemplates__: CommunityTemplates;

  static get CommunityTemplates(): CommunityTemplates {
    if (ObjectsRegistry.communityTemplates__ === undefined) {
      ObjectsRegistry.communityTemplates__ = new CommunityTemplates();
    }
    return ObjectsRegistry.communityTemplates__;
  }

  private static partialImportExport__: PartialImportExport;

  static get PartialImportExport(): PartialImportExport {
    if (ObjectsRegistry.partialImportExport__ === undefined) {
      ObjectsRegistry.partialImportExport__ = new PartialImportExport();
    }
    return ObjectsRegistry.partialImportExport__;
  }
}

export const initLocalstorageRegistry = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
    window.localStorage.setItem("NUDGE_SHOWN_SPLIT_PANE", "true");
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
