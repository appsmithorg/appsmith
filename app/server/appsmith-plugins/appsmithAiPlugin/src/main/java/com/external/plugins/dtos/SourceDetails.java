package com.external.plugins.dtos;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.TriggerRequestDTO;
import lombok.Data;

@Data
public class SourceDetails {
    String workspaceId;
    String datasourceId;
    String instanceId;
    String tenantId;

    public static SourceDetails createSourceDetails(ExecuteActionDTO executeActionDTO) {
        SourceDetails sourceDetails = new SourceDetails();
        sourceDetails.setWorkspaceId(executeActionDTO.getWorkspaceId());
        sourceDetails.setDatasourceId(executeActionDTO.getDatasourceId());
        sourceDetails.setInstanceId(executeActionDTO.getInstanceId());
        sourceDetails.setTenantId(executeActionDTO.getTenantId());
        return sourceDetails;
    }

    public static SourceDetails createSourceDetails(TriggerRequestDTO triggerRequestDTO) {
        SourceDetails sourceDetails = new SourceDetails();
        sourceDetails.setWorkspaceId(triggerRequestDTO.getWorkspaceId());
        sourceDetails.setDatasourceId(triggerRequestDTO.getDatasourceId());
        sourceDetails.setInstanceId(triggerRequestDTO.getInstanceId());
        sourceDetails.setTenantId(triggerRequestDTO.getTenantId());
        return sourceDetails;
    }
}
