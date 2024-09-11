import { ApplicationVersion } from "ee/actions/applicationActions";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  PLACEHOLDER_APP_SLUG,
  PLACEHOLDER_PAGE_SLUG,
  VIEWER_CUSTOM_PATH,
  VIEWER_PATH,
  VIEWER_PATH_DEPRECATED,
} from "constants/routes";
import { APP_MODE } from "entities/App";
import { generatePath } from "react-router";
import getQueryParamsObject from "utils/getQueryParamsObject";
import { isNil } from "lodash";

export interface URLBuilderParams {
  suffix?: string;
  branch?: string;
  hash?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
  basePageId?: string | null;
  persistExistingParams?: boolean;
  // This is used to pass ID if the sender doesn't know the type of the entity
  // base version of parent entity id, can be basePageId or moduleId
  baseParentEntityId?: string;
  generateEditorPath?: boolean;
}

export enum URL_TYPE {
  DEFAULT,
  SLUG,
  CUSTOM_SLUG,
}

export const baseURLRegistry = {
  [URL_TYPE.DEFAULT]: {
    [APP_MODE.EDIT]: BUILDER_PATH_DEPRECATED,
    [APP_MODE.PUBLISHED]: VIEWER_PATH_DEPRECATED,
  },
  [URL_TYPE.SLUG]: {
    [APP_MODE.EDIT]: BUILDER_PATH,
    [APP_MODE.PUBLISHED]: VIEWER_PATH,
  },
  [URL_TYPE.CUSTOM_SLUG]: {
    [APP_MODE.EDIT]: BUILDER_CUSTOM_PATH,
    [APP_MODE.PUBLISHED]: VIEWER_CUSTOM_PATH,
  },
};

export interface ApplicationURLParams {
  baseApplicationId?: string;
  applicationSlug?: string;
  applicationVersion?: ApplicationVersion;
}

export interface PageURLParams {
  basePageId: string;
  pageSlug: string;
  customSlug?: string;
}

export function getQueryStringfromObject(
  params: Record<string, string> = {},
): string {
  const paramKeys = Object.keys(params);
  const queryParams: string[] = [];
  if (paramKeys) {
    paramKeys.forEach((paramKey: string) => {
      if (!isNil(params[paramKey])) {
        const value = encodeURIComponent(params[paramKey]);
        if (paramKey && value) {
          queryParams.push(`${paramKey}=${value}`);
        }
      }
    });
  }
  return queryParams.length ? "?" + queryParams.join("&") : "";
}

const fetchQueryParamsToPersist = (persistExistingParams: boolean) => {
  const existingParams = getQueryParamsObject() || {};
  // not persisting the entire query currently, since that's the current behavior
  const { branch, embed } = existingParams;
  let params;
  if (persistExistingParams) {
    params = { ...existingParams };
  } else {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params = { branch, embed } as any;
  }
  // test param to make sure a query param is present in the URL during dev and tests
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Cypress) {
    params = { a: "b", ...params };
  }
  return params;
};

/**
 * NOTE TO ENGINEERS:
 * This class has extended features in EE; please do check the EE implementation
 * of it before modifying any functionality here.
 *
 * This class is inherited in EE and basePath generation is modified based on the type
 * of editor the user is currently on. This is done to remove the dependency of current
 * page as a required param to build any route. However if a basePageId is provided while
 * building a route, it will override the cache and use the passed basePageId value.
 *
 * However the current implementation can be improved and a holistic solution can be
 * devised to support all different types of routing pattern. The current solution acts as a stop-gap
 * solution to help Package Editor feature in EE.
 */
export class URLBuilder {
  appParams: ApplicationURLParams;
  pageParams: Record<string, PageURLParams>;
  currentBasePageId?: string | null;

  static _instance: URLBuilder;

  constructor() {
    this.appParams = {
      baseApplicationId: "",
      applicationSlug: PLACEHOLDER_APP_SLUG,
    };
    this.pageParams = {};
    this.currentBasePageId;
  }

  static getInstance() {
    if (URLBuilder._instance) return URLBuilder._instance;
    URLBuilder._instance = new URLBuilder();
    return URLBuilder._instance;
  }

  private getURLType(
    applicationVersion: ApplicationURLParams["applicationVersion"],
    customSlug?: string,
  ) {
    if (
      typeof applicationVersion !== "undefined" &&
      applicationVersion < ApplicationVersion.SLUG_URL
    )
      return URL_TYPE.DEFAULT;
    if (customSlug) return URL_TYPE.CUSTOM_SLUG;
    return URL_TYPE.SLUG;
  }

  private getFormattedParams(basePageId: string) {
    const currentAppParams = {
      applicationSlug: this.appParams.applicationSlug || PLACEHOLDER_APP_SLUG,
      baseApplicationId: this.appParams.baseApplicationId,
    };
    let currentPageParams = this.pageParams[basePageId] || {};
    currentPageParams = {
      ...currentPageParams,
      pageSlug: `${currentPageParams.pageSlug || PLACEHOLDER_PAGE_SLUG}-`,
      customSlug: currentPageParams.customSlug
        ? `${currentPageParams.customSlug}-`
        : "",
      basePageId,
    };

    return { ...currentAppParams, ...currentPageParams };
  }

  setCurrentBasePageId(basePageId?: string | null) {
    this.currentBasePageId = basePageId;
  }

  public updateURLParams(
    appParams: ApplicationURLParams | null,
    pageParams?: PageURLParams[],
  ) {
    if (appParams) {
      this.appParams.baseApplicationId =
        appParams.baseApplicationId || this.appParams.baseApplicationId;
      this.appParams.applicationSlug =
        appParams.applicationSlug || this.appParams.applicationSlug;
      this.appParams.applicationVersion =
        appParams.applicationVersion || this.appParams.applicationVersion;
    }
    if (pageParams) {
      const params = pageParams.reduce(
        (acc, page) => {
          acc[page.basePageId] = page;
          return acc;
        },
        {} as Record<string, PageURLParams>,
      );
      Object.assign(this.pageParams, params);
    }
  }

  // Currently only used in pages/Applications page on mount
  resetURLParams() {
    this.appParams = {
      baseApplicationId: "",
      applicationSlug: "",
    };
    this.pageParams = {};
  }

  // Current only used in src/pages/slug.test.tsx
  getURLParams(basePageId: string) {
    return { ...this.appParams, ...this.pageParams[basePageId] };
  }

  generateBasePathForApp(basePageId: string, mode: APP_MODE) {
    const { applicationVersion } = this.appParams;

    const customSlug = this.pageParams[basePageId]?.customSlug || "";

    const urlType = this.getURLType(applicationVersion, customSlug);

    const urlPattern = baseURLRegistry[urlType][mode];

    const formattedParams = this.getFormattedParams(basePageId);

    const basePath = generatePath(urlPattern, formattedParams);

    return basePath;
  }

  generateBasePath(basePageId: string, mode: APP_MODE) {
    return this.generateBasePathForApp(basePageId, mode);
  }

  getCustomSlugPathPreview(basePageId: string, customSlug: string) {
    const urlPattern =
      baseURLRegistry[URL_TYPE.CUSTOM_SLUG][APP_MODE.PUBLISHED];
    return generatePath(urlPattern, {
      basePageId,
      customSlug: `${customSlug}-`,
    }).toLowerCase();
  }

  getPagePathPreview(basePageId: string, pageName: string) {
    const { applicationVersion } = this.appParams;

    const urlType = this.getURLType(applicationVersion);

    const urlPattern = baseURLRegistry[urlType][APP_MODE.PUBLISHED];

    const formattedParams = this.getFormattedParams(basePageId);

    formattedParams.pageSlug = `${pageName}-`;

    return generatePath(urlPattern, formattedParams).toLowerCase();
  }

  resolveEntityIdForApp(builderParams: URLBuilderParams) {
    const basePageId =
      builderParams.basePageId ||
      builderParams?.baseParentEntityId ||
      this.currentBasePageId;

    if (!basePageId) {
      throw new URIError(
        "Missing basePageId. If you are trying to set href inside a react component use the 'useHref' hook.",
      );
    }

    return basePageId;
  }

  resolveEntityId(builderParams: URLBuilderParams): string {
    return this.resolveEntityIdForApp(builderParams);
  }

  /**
   * @throws {URIError}
   * @param builderParams
   * @param mode
   * @returns URL string
   */
  build(builderParams: URLBuilderParams, mode: APP_MODE = APP_MODE.EDIT) {
    const {
      branch,
      hash = "",
      params = {},
      persistExistingParams = false,
      suffix,
    } = builderParams;

    const entityId = this.resolveEntityId(builderParams);

    const basePath = this.generateBasePath(entityId, mode);

    const queryParamsToPersist = fetchQueryParamsToPersist(
      persistExistingParams,
    );

    const branchParams = branch ? { branch: encodeURIComponent(branch) } : {};

    const modifiedQueryParams = {
      ...queryParamsToPersist,
      ...params,
      ...branchParams,
    };

    const queryString = getQueryStringfromObject(modifiedQueryParams);

    const suffixPath = suffix ? `/${suffix}` : "";

    const hashPath = hash ? `#${hash}` : "";
    // hash fragment should be at the end of the href
    // ref: https://www.rfc-editor.org/rfc/rfc3986#section-4.1
    return `${basePath}${suffixPath}${queryString}${hashPath}`;
  }
}

const urlBuilder = URLBuilder.getInstance();

export default urlBuilder;
