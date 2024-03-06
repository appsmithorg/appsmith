package com.appsmith.server.dtos;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTriggerProxyDTO {
    String workflowId;
    ActionCollectionViewDTO workflowDef;
    Map<String, String> actionNameToActionIdMap;
    Map<String, ActionCollectionViewDTO> actionCollectionNameToActionCollection;
    JsonNode triggerData;
}
