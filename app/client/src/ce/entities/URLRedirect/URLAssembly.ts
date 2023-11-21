import { ApplicationVersion } from "@appsmith/actions/applicationActions";
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
  params?: Record<string, any>;
  pageId?: string | null;
  persistExistingParams?: boolean;
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
  applicationId?: string;
  applicationSlug?: string;
  applicationVersion?: ApplicationVersion;
}

export interface PageURLParams {
  pageId: string;
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
    params = { branch, embed } as any;
  }
  // test param to make sure a query param is present in the URL during dev and tests
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
 * page as a required param to build any route. However if a pageId is provided while
 * building a route, it will override the cache and use the passed pageId value.
 *
 * However the current implementation can be improved and a holistic solution can be
 * devised to support all different types of routing pattern. The current solution acts as a stop-gap
 * solution to help Package Editor feature in EE.
 */
export class URLBuilder {
  appParams: ApplicationURLParams;
  pageParams: Record<string, PageURLParams>;
  currentPageId?: string | null;

  static _instance: URLBuilder;

  constructor() {
    this.appParams = {
      applicationId: "",
      applicationSlug: PLACEHOLDER_APP_SLUG,
    };
    this.pageParams = {};
    this.currentPageId;
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

  private getFormattedParams(pageId: string) {
    const currentAppParams = {
      applicationSlug: this.appParams.applicationSlug || PLACEHOLDER_APP_SLUG,
      applicationId: this.appParams.applicationId,
    };
    let currentPageParams = this.pageParams[pageId] || {};
    currentPageParams = {
      ...currentPageParams,
      pageSlug: `${currentPageParams.pageSlug || PLACEHOLDER_PAGE_SLUG}-`,
      customSlug: currentPageParams.customSlug
        ? `${currentPageParams.customSlug}-`
        : "",
      pageId,
    };

    return { ...currentAppParams, ...currentPageParams };
  }

  setCurrentPageId(pageId?: string | null) {
    this.currentPageId = pageId;
  }

  public updateURLParams(
    appParams: ApplicationURLParams | null,
    pageParams?: PageURLParams[],
  ) {
    if (appParams) {
      this.appParams.applicationId =
        appParams.applicationId || this.appParams.applicationId;
      this.appParams.applicationSlug =
        appParams.applicationSlug || this.appParams.applicationSlug;
      this.appParams.applicationVersion =
        appParams.applicationVersion || this.appParams.applicationVersion;
    }
    if (pageParams) {
      const params = pageParams.reduce(
        (acc, page) => {
          acc[page.pageId] = page;
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
      applicationId: "",
      applicationSlug: "",
    };
    this.pageParams = {};
  }

  // Current only used in src/pages/slug.test.tsx
  getURLParams(pageId: string) {
    return { ...this.appParams, ...this.pageParams[pageId] };
  }

  generateBasePathForApp(pageId: string, mode: APP_MODE) {
    const { applicationVersion } = this.appParams;

    const customSlug = this.pageParams[pageId]?.customSlug || "";

    const urlType = this.getURLType(applicationVersion, customSlug);

    const urlPattern = baseURLRegistry[urlType][mode];

    const formattedParams = this.getFormattedParams(pageId);

    const basePath = generatePath(urlPattern, formattedParams);

    return basePath;
  }

  generateBasePath(pageId: string, mode: APP_MODE) {
    return this.generateBasePathForApp(pageId, mode);
  }

  getCustomSlugPathPreview(pageId: string, customSlug: string) {
    const urlPattern =
      baseURLRegistry[URL_TYPE.CUSTOM_SLUG][APP_MODE.PUBLISHED];
    return generatePath(urlPattern, {
      pageId,
      customSlug: `${customSlug}-`,
    }).toLowerCase();
  }

  getPagePathPreview(pageId: string, pageName: string) {
    const { applicationVersion } = this.appParams;

    const urlType = this.getURLType(applicationVersion);

    const urlPattern = baseURLRegistry[urlType][APP_MODE.PUBLISHED];

    const formattedParams = this.getFormattedParams(pageId);

    formattedParams.pageSlug = `${pageName}-`;

    return generatePath(urlPattern, formattedParams).toLowerCase();
  }

  resolveEntityIdForApp(builderParams: URLBuilderParams) {
    const pageId = builderParams.pageId || this.currentPageId;

    if (!pageId) {
      throw new URIError(
        "Missing pageId. If you are trying to set href inside a react component use the 'useHref' hook.",
      );
    }

    return pageId;
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
