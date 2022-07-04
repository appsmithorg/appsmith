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
import { generatePath, matchPath } from "react-router";
import { convertToQueryParams, URLBuilderParams } from "RouteBuilder";
import getQueryParamsObject from "utils/getQueryParamsObject";
import history from "utils/history";

enum URL_TYPE {
  DEFAULT,
  SLUG,
  CUSTOM_SLUG,
}

enum Slug {
  applicationSlug = "applicationSlug",
  pageSlug = "pageSlug",
  customSlug = "customSlug",
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

const fetchParamsToPersist = () => {
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

export const isURLDeprecated = (url: string) => {
  return !!matchPath(url, {
    path: Object.values(baseURLRegistry[URL_TYPE.DEFAULT]),
    strict: false,
    exact: false,
  });
};

const doesItMatchSlugURLPath = (path: string) =>
  matchPath<{ applicationSlug: string; pageSlug: string }>(path, {
    path: Object.values(baseURLRegistry[URL_TYPE.SLUG]),
    strict: false,
    exact: false,
  });

const doesItMatchCustomSlugURLPath = (path: string) =>
  matchPath<{ customSlug: string }>(path, {
    path: Object.values(baseURLRegistry[URL_TYPE.CUSTOM_SLUG]),
    strict: false,
    exact: false,
  });

export const getUpdatedRoute = (path: string, params: Record<Slug, string>) => {
  let updatedPath = path;
  const matchSlugPath = doesItMatchSlugURLPath(path);
  if (matchSlugPath && matchSlugPath.params) {
    const { applicationSlug, pageSlug } = matchSlugPath?.params;
    if (params.customSlug) {
      updatedPath = updatedPath.replace(
        `${applicationSlug}/${pageSlug}`,
        `${params.customSlug}-`,
      );
      return updatedPath;
    }
    if (params.applicationSlug)
      updatedPath = updatedPath.replace(
        applicationSlug,
        params.applicationSlug,
      );
    if (params.pageSlug)
      updatedPath = updatedPath.replace(`${pageSlug}-`, `${params.pageSlug}-`);
    return updatedPath;
  }
  const matchCustomPath = doesItMatchCustomSlugURLPath(path);
  if (matchCustomPath && matchCustomPath.params) {
    const { customSlug } = matchCustomPath.params;
    if (customSlug) {
      if (params.customSlug)
        updatedPath = updatedPath.replace(
          `${customSlug}`,
          `${params.customSlug}-`,
        );
      else
        updatedPath = updatedPath.replace(
          `${customSlug}-`,
          `${params.applicationSlug}/${params.pageSlug}-`,
        );
    }
  }
  return updatedPath;
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
      applicationSlug: this.appParams.applicationSlug,
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

  static updateSlugNamesInCurrentURL(params: Record<Slug, string>) {
    const { pathname, search } = window.location;
    if (isURLDeprecated(pathname)) return;
    const newURL = getUpdatedRoute(pathname, params);
    history.replace(newURL + search);
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
        "Missing URL params. If you are trying to set href inside a react component use the 'useHref' hook.",
      );
    }

    const basePath = this.generateBasePath(pageId, mode);

    const paramsToPersist = fetchParamsToPersist();

    const modifiedParams = { ...paramsToPersist, ...params };

    const queryString = convertToQueryParams(modifiedParams);

    const suffixPath = suffix ? `/${suffix}` : "";

    const hashPath = hash ? `#${hash}` : "";
    // hash fragment should be at the end of the href
    // ref: https://www.rfc-editor.org/rfc/rfc3986#section-4.1
    return `${basePath}${suffixPath}${queryString}${hashPath}`;
  }
}

const urlBuilder = URLBuilder.getInstance();

export default urlBuilder;
