/* eslint-disable */
export * from "ce/entities/URLRedirect/URLAssembly";
import type { URLBuilderParams as CE_URLBuilderParams } from "ce/entities/URLRedirect/URLAssembly";
import {
  URLBuilder as CE_URLBuilderClass,
  EDITOR_TYPE,
} from "ce/entities/URLRedirect/URLAssembly";
import { APP_MODE } from "entities/App";
import { generatePath, matchPath } from "react-router";
import store from "store";

export type URLBuilderParams = CE_URLBuilderParams & {
  moduleId?: string;
  packageId?: string;
};

/**
 * TODOs
 * 1. How to deal with cross editor routes as the appParams and pageParams won't be there in a package editor
 */
const BASE_URL_PATTERN = `/pkg/:packageSlug(.*\-):packageId/:moduleSlug(.*\-):moduleId/edit`;

export type PackageURLParams = {
  applicationId?: string;
  applicationSlug?: string;
};

export type ModuleURLParams = {
  moduleId: string;
  moduleSlug: string;
};

type MatchProps = {
  packageSlug: string;
  packageId: string;
  moduleSlug: string;
  moduleId: string;
};

export class URLBuilder extends CE_URLBuilderClass {
  getDefaultEditorType() {
    const editorType = location.pathname.startsWith("/pkg")
      ? EDITOR_TYPE.PKG
      : EDITOR_TYPE.APP;
    return editorType;
  }

  generateBasePath(entityId: string, mode: APP_MODE) {
    const editorType = this.getDefaultEditorType();

    if (EDITOR_TYPE.PKG === editorType) {
      this.generateBasePathForPkg(entityId);
    }

    return this.generateBasePathForApp(entityId, mode);
  }

  generateBasePathForPkg(moduleId: string) {
    const match = matchPath<MatchProps>(location.pathname, BASE_URL_PATTERN);

    if (!match) return "";

    const formattedParams = {
      moduleId: moduleId || match.params.moduleId,
      packageId: match.params.packageId,
      packageSlug: match.params.packageSlug,
      moduleSlug: match.params.moduleSlug,
    };

    return generatePath(BASE_URL_PATTERN, formattedParams);
  }

  resolveEntityId(builderParams: URLBuilderParams) {
    const editorType = this.getDefaultEditorType();

    if (EDITOR_TYPE.PKG === editorType) {
      return this.resolveEntityIdForPkg(builderParams);
    }

    return this.resolveEntityIdForApp(builderParams);
  }

  resolveEntityIdForPkg(builderParams: URLBuilderParams) {
    const currentModuleId: string = store.getState().ui.editor.currentModuleId;

    return {
      entityId: builderParams.moduleId || currentModuleId,
      entityType: "moduleId",
    };
  }

  build(builderParams: URLBuilderParams, mode: APP_MODE = APP_MODE.EDIT) {
    return super.build(builderParams, mode);
  }
}

const urlBuilder = URLBuilder.getInstance();

export default urlBuilder;
