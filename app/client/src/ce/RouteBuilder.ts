import {
  ADD_PATH,
  ADMIN_SETTINGS_PATH,
  GEN_TEMPLATE_FORM_ROUTE,
  GEN_TEMPLATE_URL,
  getViewerCustomPath,
  getViewerPath,
  TEMPLATES_PATH,
} from "constants/routes";
import { APP_MODE } from "entities/App";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import type { URLBuilderParams } from "ee/entities/URLRedirect/URLAssembly";
import type { Page } from "entities/Page";
import type { ApplicationPayload } from "entities/Application";

export const fillPathname = (
  pathname: string,
  application: ApplicationPayload,
  page: Page,
) => {
  const replaceValue = page.customSlug
    ? getViewerCustomPath(page.customSlug, page.basePageId)
    : getViewerPath(application.slug, page.slug, page.basePageId);

  return pathname.replace(
    `/applications/${application.baseId}/pages/${page.basePageId}`,
    replaceValue,
  );
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

export interface WithAddView {
  add?: boolean;
}

export const jsCollectionIdURL = (
  props: URLBuilderParams &
    WithAddView & {
      baseCollectionId: string;
      // Pass a function name to set the cursor directly on the function
      functionName?: string;
    },
): string => {
  return urlBuilder.build({
    ...props,
    suffix: `jsObjects/${props.baseCollectionId}${props.add ? ADD_PATH : ""}`,
    hash: props.functionName,
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
  props: URLBuilderParams &
    WithAddView & {
      baseQueryId: string;
    },
): string =>
  urlBuilder.build({
    ...props,
    suffix: `queries/${props.baseQueryId}${props.add ? ADD_PATH : ""}`,
  });

export const apiEditorIdURL = (
  props: URLBuilderParams &
    WithAddView & {
      baseApiId: string;
    },
): string =>
  urlBuilder.build({
    ...props,
    suffix: `api/${props.baseApiId}${props.add ? ADD_PATH : ""}`,
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
  props: URLBuilderParams &
    WithAddView & {
      pluginPackageName: string;
      baseApiId: string;
    },
): string =>
  urlBuilder.build({
    ...props,
    suffix: `saas/${props.pluginPackageName}/api/${props.baseApiId}${
      props.add ? ADD_PATH : ""
    }`,
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
export const globalAddURL = (props: URLBuilderParams): string => {
  return urlBuilder.build({
    ...props,
    suffix: "add",
  });
};

export const widgetURL = (
  props: URLBuilderParams & WithAddView & { selectedWidgets: string[] },
) => {
  return urlBuilder.build({
    ...props,
    suffix: `widgets/${props.selectedWidgets.join(",")}${
      props.add ? ADD_PATH : ""
    }`,
  });
};

export const widgetListURL = (props: URLBuilderParams) => {
  return urlBuilder.build({
    ...props,
    suffix: `widgets`,
  });
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

export const jsCollectionListURL = (props: URLBuilderParams): string => {
  return urlBuilder.build({
    ...props,
    suffix: `jsObjects`,
  });
};

export const jsCollectionAddURL = (props: URLBuilderParams): string => {
  return urlBuilder.build({
    ...props,
    suffix: "jsObjects/add",
  });
};

export const queryListURL = (props: URLBuilderParams): string =>
  urlBuilder.build({
    ...props,
    suffix: `queries`,
  });

export const queryAddURL = (props: URLBuilderParams): string =>
  urlBuilder.build({
    ...props,
    suffix: `queries/add`,
  });
