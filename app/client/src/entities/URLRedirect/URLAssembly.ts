import { ApplicationVersion } from "actions/applicationActions";
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
import { getQueryStringfromObject, URLBuilderParams } from "RouteBuilder";
import getQueryParamsObject from "utils/getQueryParamsObject";

enum URL_TYPE {
  DEFAULT,
  SLUG,
  CUSTOM_SLUG,
}

const baseURLRegistry = {
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

export type ApplicationURLParams = {
  applicationId?: string;
  applicationSlug?: string;
  applicationVersion?: ApplicationVersion;
};

export type PageURLParams = {
  pageId: string;
  pageSlug: string;
  customSlug?: string;
};

const fetchQueryParamsToPersist = () => {
  const existingParams = getQueryParamsObject() || {};
  // not persisting the entire query currently, since that's the current behavior
  const { branch, embed } = existingParams;
  let params = { branch, embed } as any;
  // test param to make sure a query param is present in the URL during dev and tests
  if ((window as any).Cypress) {
    params = { a: "b", ...params };
  }
  return params;
};

export class URLBuilder {
  appParams: ApplicationURLParams;
  pageParams: Record<string, PageURLParams>;

  static _instance: URLBuilder;

  private constructor() {
    this.appParams = {
      applicationId: "",
      applicationSlug: PLACEHOLDER_APP_SLUG,
    };
    this.pageParams = {};
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
      const params = pageParams.reduce((acc, page) => {
        acc[page.pageId] = page;
        return acc;
      }, {} as Record<string, PageURLParams>);
      Object.assign(this.pageParams, params);
    }
  }

  resetURLParams() {
    this.appParams = {
      applicationId: "",
      applicationSlug: "",
    };
    this.pageParams = {};
  }

  getURLParams(pageId: string) {
    return { ...this.appParams, ...this.pageParams[pageId] };
  }

  generateBasePath(pageId: string, mode: APP_MODE) {
    const { applicationVersion } = this.appParams;

    const customSlug = this.pageParams[pageId]?.customSlug || "";

    const urlType = this.getURLType(applicationVersion, customSlug);

    const urlPattern = baseURLRegistry[urlType][mode];

    const formattedParams = this.getFormattedParams(pageId);

    const basePath = generatePath(urlPattern, formattedParams);

    return basePath;
  }

  /**
   * @throws {URIError}
   * @param builderParams
   * @param mode
   * @returns URL string
   */
  build(builderParams: URLBuilderParams, mode: APP_MODE = APP_MODE.EDIT) {
    const { hash = "", params = {}, suffix, pageId } = builderParams;

    if (!pageId) {
      throw new URIError(
        "Missing pageId. If you are trying to set href inside a react component use the 'useHref' hook.",
      );
    }

    const basePath = this.generateBasePath(pageId, mode);

    const queryParamsToPersist = fetchQueryParamsToPersist();

    const modifiedQueryParams = { ...queryParamsToPersist, ...params };

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
