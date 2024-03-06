import type { URLBuilderParams } from "@appsmith/entities/URLRedirect/URLAssembly";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import type { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { WithAddView } from "../ce/RouteBuilder";
import { ADD_PATH } from "constants/routes";

export * from "ce/RouteBuilder";

export const moduleInstanceEditorURL = (
  props: URLBuilderParams &
    WithAddView & {
      moduleInstanceId: string;
      moduleType: MODULE_TYPE;
    },
) =>
  urlBuilder.build({
    ...props,
    suffix: `module-instance/${props.moduleType}/${props.moduleInstanceId}${
      props.add ? ADD_PATH : ""
    }`,
  });

export const moduleEditorURL = (params: URLBuilderParams): string =>
  urlBuilder.build(params);

export const currentPackageEditorURL = (): string =>
  urlBuilder.build({ generateEditorPath: true });

export const currentWorkflowEditorURL = (): string =>
  urlBuilder.build({ generateEditorPath: true });

// URL builder for workflow editor
export const workflowEditorURL = ({ workflowId }: URLBuilderParams): string =>
  urlBuilder.build({ workflowId });

export const packageSettingsURL = (
  props: URLBuilderParams & {
    tab?: string;
  },
) => {
  return urlBuilder.build({
    ...props,
    suffix: `settings/${props.tab}`,
  });
};
