import { ApplicationVersion } from "actions/applicationActions";
import { ApplicationPayload } from "ce/constants/ReduxActionConstants";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "constants/routes";
import { APP_MODE } from "entities/App";
import { generatePath } from "react-router";
import { convertToQueryParams, URLBuilderParams } from "RouteBuilder";
import getQueryParamsObject from "utils/getQueryParamsObject";

enum URL_TYPE {
  DEFAULT,
  SLUG,
  CUSTOM_SLUG,
}

const baseURLRegistry = {
  [APP_MODE.EDIT]: {
    [URL_TYPE.DEFAULT]: BUILDER_PATH_DEPRECATED,
    [URL_TYPE.SLUG]: BUILDER_PATH,
    [URL_TYPE.CUSTOM_SLUG]: BUILDER_CUSTOM_PATH,
  },
  [APP_MODE.PUBLISHED]: {
    [URL_TYPE.DEFAULT]: BUILDER_PATH_DEPRECATED,
    [URL_TYPE.SLUG]: BUILDER_PATH,
    [URL_TYPE.CUSTOM_SLUG]: BUILDER_CUSTOM_PATH,
  },
};

type ApplicationParams = {
  applicationId?: string;
  applicationSlug?: string;
  applicationVersion?: ApplicationVersion;
};

type PageParams = {
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

class URLBuilder {
  appParams: ApplicationParams;
  pageParams: Record<string, PageParams>;

  static _instance: URLBuilder;

  private constructor() {
    this.appParams = {
      applicationId: "",
      applicationVersion: -1,
      applicationSlug: "",
    };
    this.pageParams = {};
  }

  public static getInstance() {
    if (URLBuilder._instance) return URLBuilder._instance;
    URLBuilder._instance = new URLBuilder();
    return URLBuilder._instance;
  }

  updateURLParams(
    application: ApplicationPayload | null,
    allPages?: PageParams[],
  ) {
    if (application)
      Object.assign(this.appParams, {
        applicationId: application.id,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      });
    if (allPages) {
      const params = allPages.reduce((acc, page) => {
        acc[page.pageId] = page;
        return acc;
      }, {} as Record<string, PageParams>);
      Object.assign(this.pageParams, params);
    }
  }

  resetURLParams() {
    this.appParams = {
      applicationId: "",
      applicationVersion: -1,
      applicationSlug: "",
    };
    this.pageParams = {};
  }

  getURLParams() {
    return { appParams: this.appParams, pageParams: this.pageParams };
  }

  private getURLType(
    applicationVersion: ApplicationVersion | undefined,
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
    let currentPageParams = this.pageParams[pageId] || {};
    currentPageParams = {
      ...currentPageParams,
      pageSlug: `${currentPageParams.pageSlug}-`,
      customSlug: currentPageParams.customSlug
        ? `${currentPageParams.customSlug}-`
        : currentPageParams.customSlug,
    };

    return { ...this.appParams, ...currentPageParams };
  }

  generateBasePath(pageId: string, mode: APP_MODE) {
    const { applicationVersion } = this.appParams;

    const { customSlug } = this.pageParams[pageId];

    const urlType = this.getURLType(applicationVersion, customSlug);

    const urlPattern = baseURLRegistry[mode][urlType];

    const formattedParams = this.getFormattedParams(pageId);

    const basePath = generatePath(urlPattern, formattedParams);

    return basePath;
  }

  build(builderParams: URLBuilderParams, mode: APP_MODE = APP_MODE.EDIT) {
    const { hash = "", params = {}, suffix, pageId } = builderParams;

    if (!this.appParams.applicationId || !this.pageParams[pageId]) return "";

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
