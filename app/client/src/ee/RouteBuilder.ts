import type { URLBuilderParams } from "@appsmith/entities/URLRedirect/URLAssembly";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
export * from "ce/RouteBuilder";

export const moduleInstanceQueryEditorIdURL = (
  props: URLBuilderParams & {
    queryId: string;
  },
) =>
  urlBuilder.build({
    ...props,
    suffix: `moduleInstance/${props.queryId}`,
  });

export const moduleEditorURL = ({ moduleId }: URLBuilderParams): string =>
  urlBuilder.build({ moduleId });

export const currentPackageEditorURL = (): string =>
  urlBuilder.build({ generateEditorPath: true });
