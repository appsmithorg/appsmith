export * from "ce/RouteBuilder";

import type { URLBuilderParams } from "@appsmith/entities/URLRedirect/URLAssembly";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";

export const moduleEditorURL = ({ moduleId }: URLBuilderParams): string =>
  urlBuilder.build({ moduleId });
