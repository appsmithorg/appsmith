package com.external.plugins.dtos;

import lombok.Data;

@Data
public class TriggerWorkflowCommandDTO extends WorkflowCommandDTO {
    String triggerData;
}
