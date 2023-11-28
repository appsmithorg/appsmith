export * from "ce/entities/URLRedirect/URLAssembly";
import type { URLBuilderParams as CE_URLBuilderParams } from "ce/entities/URLRedirect/URLAssembly";
import { URLBuilder as CE_URLBuilderClass } from "ce/entities/URLRedirect/URLAssembly";
import { generatePath } from "react-router";
import {
  MODULE_EDITOR_PATH,
  PACKAGE_EDITOR_PATH,
} from "@appsmith/constants/routes/packageRoutes";
import type { APP_MODE } from "entities/App";
import { WORKFLOW_EDITOR_URL } from "@appsmith/constants/routes/workflowRoutes";

export enum EDITOR_TYPE {
  PKG = "PKG",
  APP = "APP",
  WORKFLOW = "WORKFLOW",
}

type ID = string;

export type URLBuilderParams = CE_URLBuilderParams & {
  moduleId?: string;
  workflowId?: string;
  generateEditorPath?: boolean;
};

export interface PackageParams {
  packageId?: string;
  packageSlug?: string;
}

export interface ModuleParams {
  moduleId?: string;
  moduleSlug?: string;
}

export type ModulesParams = Record<ID, ModuleParams | undefined>;

interface StateParams {
  shouldGenerateEditorPath?: boolean;
}

export class URLBuilder extends CE_URLBuilderClass {
  static _ee_instance: URLBuilder;
  /**
   * stateParams is used to set a particular value/flag that can be
   * used by any functions during the url building process which cannot
   * be passed through the regular function as props.
   * These stateParams are considered as transient i.e it get's set
   * when the build starts using the builderParams passed to the build
   * function and then is reset/unset when the path gets generated.
   */
  private stateParams: StateParams;
  private packageParams: PackageParams;
  private modulesParams: ModulesParams;
  private currentModuleId?: string | null;
  private workflowId?: string | null;
  private editorType?: EDITOR_TYPE | null;

  constructor() {
    super();
    this.stateParams = {};
    this.packageParams = {};
    this.modulesParams = {};
  }

  static getInstance() {
    if (URLBuilder._ee_instance) return URLBuilder._ee_instance;
    URLBuilder._ee_instance = new URLBuilder();
    return URLBuilder._ee_instance;
  }

  setStateParams(builderParams: URLBuilderParams) {
    this.stateParams.shouldGenerateEditorPath =
      builderParams.generateEditorPath;
  }

  unsetStateParams() {
    this.stateParams = {};
  }

  setEditorType(builderParams: URLBuilderParams) {
    this.editorType = this.getDefaultEditorType(builderParams);
  }

  unsetEditorType() {
    this.editorType = null;
  }

  setPackageParams(params: PackageParams) {
    this.packageParams = params;
  }

  setModulesParams(updateCb: (currentParams: ModulesParams) => ModulesParams) {
    const newParams = updateCb(this.modulesParams);
    this.modulesParams = newParams;
  }

  setCurrentModuleId(moduleId: URLBuilder["currentModuleId"]) {
    this.currentModuleId = moduleId;
  }

  setCurrentWorkflowId(workflowId: URLBuilder["workflowId"]) {
    this.workflowId = workflowId;
  }

  getCurrentModuleId() {
    return this.currentModuleId;
  }

  getCurrentWorkflowId() {
    return this.workflowId;
  }

  getPackageParams() {
    return this.packageParams;
  }

  getModulesParams() {
    return this.modulesParams;
  }

  getDefaultEditorType(builderParams?: URLBuilderParams) {
    /**
     * Fallback for this is always the app. If a user visits an unknown route,
     * which does not start with /app or /pkg this should return APP as the editor
     * by default. The ternary condition satisfies the above condition.
     */
    if (
      location.pathname.startsWith("/pkg") ||
      builderParams?.hasOwnProperty("moduleId")
    ) {
      return EDITOR_TYPE.PKG;
    }

    if (
      location.pathname.startsWith("/workflow") ||
      builderParams?.hasOwnProperty("workflowId")
    ) {
      return EDITOR_TYPE.WORKFLOW;
    }

    return EDITOR_TYPE.APP;
  }

  generateBasePath(entityId: string, mode: APP_MODE) {
    const editorType = this.editorType || this.getDefaultEditorType();

    switch (editorType) {
      case EDITOR_TYPE.PKG:
        return this.generateBasePathForPkg(entityId);

      case EDITOR_TYPE.WORKFLOW:
        return this.generateBasePathForWorkflow(entityId);

      default:
        return this.generateBasePathForApp(entityId, mode);
    }
  }

  /**
   * Generates base url for a package based route.
   * Looks into the url with the default pattern of the path and extracts the
   * packageId and moduleId. If the passed moduleId takes preference over the
   * default moduleId found in the current url.
   *
   * @param moduleId
   * @returns string
   */
  generateBasePathForPkg(moduleId?: string) {
    const currentModuleId = moduleId || this.getCurrentModuleId();
    const modulesParams = this.getModulesParams();
    const packageParams = this.getPackageParams();

    if (!packageParams?.packageId) return "";

    const formattedParams: Record<string, string> = {
      packageId: packageParams.packageId,
      packageSlug: packageParams.packageSlug || "",
    };

    if (!currentModuleId || this.stateParams.shouldGenerateEditorPath) {
      return generatePath(PACKAGE_EDITOR_PATH, formattedParams);
    }

    const moduleParams = modulesParams[currentModuleId];

    formattedParams.moduleId = currentModuleId;
    formattedParams.moduleSlug = moduleParams?.moduleSlug || "";

    return generatePath(MODULE_EDITOR_PATH, formattedParams);
  }
  /**
   * Generates base url for a workflow based route.
   * Creates a url with the default pattern of the path and extracts the
   * workflowId and workflowSlug.
   *
   * @param workflowId
   * @returns string
   */
  generateBasePathForWorkflow(workflowId: string) {
    const formattedParams = {
      workflowId,
      // workflowSlug: match.params.workflowSlug, // TODO (Workflows): Add workflow slug
    };

    return generatePath(WORKFLOW_EDITOR_URL, formattedParams);
  }

  resolveEntityId(builderParams: URLBuilderParams) {
    const editorType =
      this.editorType || this.getDefaultEditorType(builderParams);

    if (EDITOR_TYPE.PKG === editorType) {
      return this.resolveEntityIdForPkg(builderParams);
    }

    if (editorType === EDITOR_TYPE.WORKFLOW) {
      return this.resolveEntityIdForWorkflow(builderParams);
    }

    return this.resolveEntityIdForApp(builderParams);
  }

  resolveEntityIdForPkg(builderParams: URLBuilderParams) {
    return builderParams.moduleId || this.getCurrentModuleId() || "";
  }

  resolveEntityIdForWorkflow(builderParams: URLBuilderParams) {
    return builderParams.workflowId || this.getCurrentWorkflowId() || "";
  }

  build(builderParams: URLBuilderParams, mode?: APP_MODE) {
    this.setStateParams(builderParams);
    this.setEditorType(builderParams);

    const path = super.build(builderParams, mode);

    this.unsetEditorType();
    this.unsetStateParams();

    return path;
  }
}

const urlBuilder = URLBuilder.getInstance();

export default urlBuilder;
