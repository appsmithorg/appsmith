import React from "react";
import DatasourceEditor from "pages/Editor/DataSourceEditor";

interface ReconnectDatasourceFormProps {
  applicationId: string | null;
  datasourceId: string | null;
  pageId: string | null;
}

function ReconnectDatasourceForm(props: ReconnectDatasourceFormProps) {
  const { applicationId, datasourceId, pageId } = props;

  return (
    <DatasourceEditor
      applicationId={applicationId}
      datasourceId={datasourceId}
      fromImporting
      // isInsideReconnectModal: indicates that the datasource form is rendering inside reconnect modal
      isInsideReconnectModal
      pageId={pageId}
    />
  );
}

export default ReconnectDatasourceForm;
