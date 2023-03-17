import Api from "api/Api";
import { WidgetType } from "constants/WidgetConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import { AxiosPromise } from "axios";

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
