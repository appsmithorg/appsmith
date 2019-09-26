import Api from "./Api";
import { WidgetType } from "../constants/WidgetConstants";
import { WidgetProps } from "../widgets/BaseWidget";
import { WidgetConfigProps } from "../reducers/entityReducers/widgetConfigReducer";

export interface WidgetConfigsResponse {
  config: Record<WidgetType, Partial<WidgetProps> & WidgetConfigProps>;
}

class WidgetConfigsApi extends Api {
  static url = "/widgetConfigs";
  static fetchWidgetConfigs(): Promise<WidgetConfigsResponse> {
    return Api.get(WidgetConfigsApi.url);
  }
}

export default WidgetConfigsApi;
