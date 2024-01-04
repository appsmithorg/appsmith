import type { URLBuilderParams } from "@appsmith/entities/URLRedirect/URLAssembly";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
export * from "ce/RouteBuilder";

export const moduleInstanceEditorURL = (
  props: URLBuilderParams & {
    moduleInstanceId: string;
  },
) =>
  urlBuilder.build({
    ...props,
    suffix: `module-instance/${props.moduleInstanceId}`,
  });

export const moduleEditorURL = ({ moduleId }: URLBuilderParams): string =>
  urlBuilder.build({ moduleId });

export const currentPackageEditorURL = (): string =>
  urlBuilder.build({ generateEditorPath: true });

export const currentWorkflowEditorURL = (): string =>
  urlBuilder.build({ generateEditorPath: true });

// URL builder for workflow editor
export const workflowEditorURL = ({ workflowId }: URLBuilderParams): string =>
  urlBuilder.build({ workflowId });

export const jsCollectionIdURL = (
  props: URLBuilderParams & {
    collectionId: string;
    // Pass a function name to set the cursor directly on the function
    functionName?: string;
  },
): string => {
  return urlBuilder.build({
    ...props,
    suffix: `jsObjects/${props.collectionId}`,
    hash: props.functionName,
  });
};
