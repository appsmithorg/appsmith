export * from "ce/entities/URLRedirect/URLAssembly";
import type { URLBuilderParams as CE_URLBuilderParams } from "ce/entities/URLRedirect/URLAssembly";
import { URLBuilder as CE_URLBuilderClass } from "ce/entities/URLRedirect/URLAssembly";
import { generatePath, matchPath } from "react-router";
import { MODULE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import type { APP_MODE } from "entities/App";

export enum EDITOR_TYPE {
  PKG = "PKG",
  APP = "APP",
}

export type URLBuilderParams = CE_URLBuilderParams & {
  moduleId?: string;
};

interface MatchProps {
  packageSlug: string;
  packageId: string;
  moduleSlug: string;
  moduleId: string;
}

export class URLBuilder extends CE_URLBuilderClass {
  static _ee_instance: URLBuilder;

  constructor() {
    super();
  }

  static getInstance() {
    if (URLBuilder._ee_instance) return URLBuilder._ee_instance;
    URLBuilder._ee_instance = new URLBuilder();
    return URLBuilder._ee_instance;
  }

  getDefaultEditorType() {
    /**
     * Fallback for this is always the app. If a user visits an unknown route,
     * which does not start with /app or /pkg this should return APP as the editor
     * by default. The ternary condition satisfies the above condition.
     */
    const editorType = location.pathname.startsWith("/pkg")
      ? EDITOR_TYPE.PKG
      : EDITOR_TYPE.APP;
    return editorType;
  }

  generateBasePath(entityId: string, mode: APP_MODE) {
    const editorType = this.getDefaultEditorType();

    if (EDITOR_TYPE.PKG === editorType) {
      return this.generateBasePathForPkg(entityId);
    }

    return this.generateBasePathForApp(entityId, mode);
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
    const match = matchPath<MatchProps>(location.pathname, MODULE_EDITOR_PATH);

    if (!match) return "";

    const formattedParams = {
      moduleId: moduleId || match.params.moduleId,
      packageId: match.params.packageId,
      packageSlug: match.params.packageSlug,
      moduleSlug: match.params.moduleSlug,
    };

    return generatePath(MODULE_EDITOR_PATH, formattedParams);
  }

  resolveEntityId(builderParams: URLBuilderParams) {
    const editorType = this.getDefaultEditorType();

    if (EDITOR_TYPE.PKG === editorType) {
      return this.resolveEntityIdForPkg(builderParams);
    }

    return this.resolveEntityIdForApp(builderParams);
  }

  resolveEntityIdForPkg(builderParams: URLBuilderParams) {
    const match = matchPath<MatchProps>(location.pathname, MODULE_EDITOR_PATH);

    return {
      entityId: builderParams.moduleId || match?.params.moduleId || "",
      entityType: "moduleId",
    };
  }

  build(builderParams: URLBuilderParams, mode?: APP_MODE) {
    return super.build(builderParams, mode);
  }
}

const urlBuilder = URLBuilder.getInstance();

export default urlBuilder;
