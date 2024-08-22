import type { WidgetConfigProps } from "WidgetProvider/constants";
import Api from "api/Api";
import type { AxiosPromise } from "axios";
import type { WidgetType } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";

export interface WidgetConfigsResponse {
  config: Record<WidgetType, Partial<WidgetProps> & WidgetConfigProps>;
}

class WidgetConfigsApi extends Api {
  static url = "/widgetConfigs";
  static async fetchWidgetConfigs(): Promise<
    AxiosPromise<WidgetConfigsResponse>
  > {
    return Api.get(WidgetConfigsApi.url);
  }
}

export default WidgetConfigsApi;
