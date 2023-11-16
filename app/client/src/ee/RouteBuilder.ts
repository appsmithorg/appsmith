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
