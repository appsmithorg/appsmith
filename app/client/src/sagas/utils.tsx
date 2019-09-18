import { FetchPageResponse } from "../api/PageApi";
import { ContainerWidgetProps } from "../widgets/ContainerWidget";
import { WidgetProps } from "../widgets/BaseWidget";

export const extractCurrentDSL = (
  fetchPageResponse: FetchPageResponse,
): ContainerWidgetProps<WidgetProps> => {
  return fetchPageResponse.data.layouts[0].dsl;
};

export default {
  extractCurrentDSL,
};
