import Api from "api/Api";
import type { WidgetType } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import type { AxiosPromise } from "axios";

export interface WidgetConfigsResponse {
  config: Record<WidgetType, Partial<WidgetProps> & WidgetConfigProps>;
}

class WidgetConfigsApi extends Api {
  static url = "/widgetConfigs";
  static fetchWidgetConfigs(): AxiosPromise<WidgetConfigsResponse> {
    return Api.get(WidgetConfigsApi.url);
  }
}

export default WidgetConfigsApi;
