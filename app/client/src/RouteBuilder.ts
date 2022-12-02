import {
  ADMIN_SETTINGS_PATH,
  GEN_TEMPLATE_FORM_ROUTE,
  GEN_TEMPLATE_URL,
  TEMPLATES_PATH,
} from "constants/routes";
import { APP_MODE } from "entities/App";
import urlBuilder from "entities/URLRedirect/URLAssembly";
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
  persistExistingParams?: boolean;
};

export const fillPathname = (
  pathname: string,
  application: ApplicationPayload,
  page: Page,
) => {
  const replaceValue = page.customSlug
    ? `/app/${page.customSlug}-${page.pageId}`
    : `/app/${application.slug}/${page.slug}-${page.pageId}`;
  return pathname.replace(
    `/applications/${application.id}/pages/${page.pageId}`,
    replaceValue,
  );
};

export function getQueryStringfromObject(
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
