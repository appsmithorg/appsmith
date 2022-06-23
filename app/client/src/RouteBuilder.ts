import {
  ADMIN_SETTINGS_PATH,
  GEN_TEMPLATE_FORM_ROUTE,
  GEN_TEMPLATE_URL,
  TEMPLATES_PATH,
} from "constants/routes";
import { APP_MODE } from "entities/App";
import urlBuilder from "entities/URLGenerator/URLAssembly";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";

export type URLBuilderParams = {
  suffix?: string;
  branch?: string;
  hash?: string;
  params?: Record<string, any>;
  pageId: string;
};

export const fillPathname = (
  pathname: string,
  application: ApplicationPayload,
  page: Page,
) => {
  return pathname
    .replace(`/applications/${application.id}`, `/app/${application.slug}`)
    .replace(`/pages/${page.pageId}`, `/${page.slug}-${page.pageId}`);
};

export function convertToQueryParams(
  params: Record<string, string> = {},
): string {
  const paramKeys = Object.keys(params);
  const queryParams: string[] = [];
  if (paramKeys) {
    paramKeys.forEach((paramKey: string) => {
      const value = params[paramKey];
      if (paramKey && value) {
        queryParams.push(`${paramKey}=${value}`);
      }
    });
  }
  return queryParams.length ? "?" + queryParams.join("&") : "";
}

/**
 * This variable holds the information essential for url building, (current applicationId, pageId, pageSlug and applicationSlug ),
 * updateURLParams method is used to update this variable in a middleware. Refer /store.ts.
 * */
// export const URLParamsFactory = (function() {
//   let BASE_URL_BUILDER_PARAMS = {};
//   const updateURLParams = function(params: any) {
//     BASE_URL_BUILDER_PARAMS = {
//       ...BASE_URL_BUILDER_PARAMS,
//       ...params,
//     };
//   };
//   const getURLParams = function() {
//     return Object.assign({}, BASE_URL_BUILDER_PARAMS);
//   };
//   const compileURL = function(pageId: string, mode: APP_MODE) {};
//   return {
//     updateURLParams,
//     getURLParams,
//     compileURL,
//   };
// })();

// function buildBasePath(params: URLBuilderParams, mode: APP_MODE) {
//   let {
//     applicationId,
//     applicationSlug,
//     applicationVersion,
//     customSlug,
//     pageId,
//     pageSlug,
//   } = params;
//   const baseURLBuilderParams = URLParamsFactory.getURLParams();
//   applicationVersion =
//     applicationVersion || baseURLBuilderParams.applicationVersion;
//   const shouldUseLegacyURLs =
//     typeof applicationVersion !== "undefined" &&
//     applicationVersion < ApplicationVersion.SLUG_URL;

//   let basePath = "";
//   pageId = pageId || baseURLBuilderParams.pageId;
//   // fallback incase pageId is not set
//   if (!pageId) {
//     const match = matchPath<{ pageId: string }>(window.location.pathname, {
//       path: [
//         BUILDER_PATH,
//         BUILDER_PATH_DEPRECATED,
//         BUILDER_CUSTOM_PATH,
//         VIEWER_PATH,
//         VIEWER_PATH_DEPRECATED,
//         VIEWER_CUSTOM_PATH,
//       ],
//       strict: false,
//       exact: false,
//     });
//     pageId = match?.params.pageId;
//   }
//   // fallback incase pageId is not set
//   if (shouldUseLegacyURLs) {
//     applicationId = applicationId || baseURLBuilderParams.applicationId;
//     basePath = `/applications/${applicationId}/pages/${pageId}`;
//   } else {
//     customSlug = customSlug || baseURLBuilderParams.customSlug;
//     if (customSlug && customSlug !== NO_CUSTOM_SLUG) {
//       basePath = `/app/${customSlug}-${pageId}`;
//     } else {
//       applicationSlug =
//         applicationSlug ||
//         baseURLBuilderParams.applicationSlug ||
//         PLACEHOLDER_APP_SLUG;
//       pageSlug =
//         pageSlug || baseURLBuilderParams.pageSlug || PLACEHOLDER_PAGE_SLUG;
//       basePath = `/app/${applicationSlug}/${pageSlug}-${pageId}`;
//       generatePath(BUILDER_PATH, {
//         applicationSlug,
//         pageSlug: `${pageSlug}-`,
//         pageId,
//       });
//     }
//   }
//   basePath += mode === APP_MODE.EDIT ? "/edit" : "";
//   return basePath;
// }

/**
 * Do not export this method directly. Write wrappers for your URLs.
 * Uses applicationVersion attribute to determine whether to use slug URLs or legacy URLs.
 */
// function urlBuilder.build(
//   urlParams: URLBuilderParams,
//   mode: APP_MODE = APP_MODE.EDIT,
// ): string {
//   const { hash = "", params = {}, suffix } = urlParams;
//   const basePath = buildBasePath(urlParams, mode);
//   const paramsToPersist = fetchParamsToPersist();
//   const modifiedParams = { ...paramsToPersist, ...params };
//   const queryString = convertToQueryParams(modifiedParams);
//   const suffixPath = suffix ? `/${suffix}` : "";
//   const hashPath = hash ? `#${hash}` : "";
//   // hash fragment should be at the end of the href
//   // ref: https://www.rfc-editor.org/rfc/rfc3986#section-4.1
//   return `${basePath}${suffixPath}${queryString}${hashPath}`;
// }

export const pageListEditorURL = (props: URLBuilderParams): string => {
  return urlBuilder.build({
    ...props,
    suffix: "pages",
  });
};
export const datasourcesEditorURL = (props: URLBuilderParams): string =>
  urlBuilder.build({
    ...props,
    suffix: "datasource",
  });

export const datasourcesEditorIdURL = (
  props: URLBuilderParams & {
    datasourceId: string;
  },
): string => {
  return urlBuilder.build({
    ...props,
    suffix: `datasource/${props.datasourceId}`,
  });
};

export const jsCollectionIdURL = (
  props: URLBuilderParams & {
    collectionId: string;
  },
): string => {
  return urlBuilder.build({
    ...props,
    suffix: `jsObjects/${props.collectionId}`,
  });
};

export const integrationEditorURL = (
  props: URLBuilderParams & { selectedTab: string },
): string => {
  const suffixPath = props.suffix ? `/${props.suffix}` : "";
  return urlBuilder.build({
    ...props,
    suffix: `datasources/${props.selectedTab}${suffixPath}`,
  });
};

export const queryEditorIdURL = (
  props: URLBuilderParams & {
    queryId: string;
  },
): string =>
  urlBuilder.build({
    ...props,
    suffix: `queries/${props.queryId}`,
  });

export const apiEditorIdURL = (
  props: URLBuilderParams & {
    apiId: string;
  },
): string =>
  urlBuilder.build({
    ...props,
    suffix: `api/${props.apiId}`,
  });

export const curlImportPageURL = (props: URLBuilderParams): string =>
  urlBuilder.build({
    ...props,
    suffix: "api/curl/curl-import",
  });

export const providerTemplatesURL = (
  props: URLBuilderParams & {
    providerId: string;
  },
): string =>
  urlBuilder.build({
    ...props,
    suffix: `api/provider/${props.providerId}`,
  });

export const saasEditorDatasourceIdURL = (
  props: URLBuilderParams & {
    pluginPackageName: string;
    datasourceId: string;
  },
): string =>
  urlBuilder.build({
    ...props,
    suffix: `saas/${props.pluginPackageName}/datasources/${props.datasourceId}`,
  });

export const saasEditorApiIdURL = (
  props: URLBuilderParams & {
    pluginPackageName: string;
    apiId: string;
  },
): string =>
  urlBuilder.build({
    ...props,
    suffix: `saas/${props.pluginPackageName}/api/${props.apiId}`,
  });

export const generateTemplateURL = (props: URLBuilderParams): string =>
  urlBuilder.build({
    ...props,
    suffix: GEN_TEMPLATE_URL,
  });

export const generateTemplateFormURL = (props: URLBuilderParams): string =>
  urlBuilder.build({
    ...props,
    suffix: `${GEN_TEMPLATE_URL}${GEN_TEMPLATE_FORM_ROUTE}`,
  });

export const onboardingCheckListUrl = (props: URLBuilderParams): string =>
  urlBuilder.build({
    ...props,
    suffix: "checklist",
  });

export const builderURL = (props: URLBuilderParams): string => {
  return urlBuilder.build(props);
};

export const viewerURL = (props: URLBuilderParams): string => {
  return urlBuilder.build(props, APP_MODE.PUBLISHED);
};

export function adminSettingsCategoryUrl({
  category,
  selected,
}: {
  category: string;
  selected?: string;
}) {
  return `${ADMIN_SETTINGS_PATH}/${category}${selected ? "/" + selected : ""}`;
}

export const templateIdUrl = ({ id }: { id: string }): string =>
  `${TEMPLATES_PATH}/${id}`;
