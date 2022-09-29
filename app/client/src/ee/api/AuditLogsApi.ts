import Api from "api/Api";
import { AuditLogsFiltersReduxState } from "@appsmith/reducers/auditLogsReducer";
import { payloadToQueryParams } from "@appsmith/pages/AuditLogs/utils/payloadToQueryParams";

export class AuditLogsApi extends Api {
  static fetchAuditLogsLogsURL = "/v1/audit-logs/logs";
  static fetchAuditLogsMetadataURL = "/v1/audit-logs/filter";

  static fetchAuditLogsLogsNextPageFromDB(
    payload: AuditLogsFiltersReduxState & { cursor: string },
  ) {
    return Api.get(
      AuditLogsApi.fetchAuditLogsLogsURL,
      payloadToQueryParams(payload),
    );
  }

  static fetchAuditLogsLogsFromDB(payload: AuditLogsFiltersReduxState) {
    return Api.get(
      AuditLogsApi.fetchAuditLogsLogsURL,
      payloadToQueryParams({ ...payload, cursor: "" }),
    );
  }
  static fetchAuditLogsMetadataFromDB() {
    return Api.get(AuditLogsApi.fetchAuditLogsMetadataURL);
  }
}

export default AuditLogsApi;
