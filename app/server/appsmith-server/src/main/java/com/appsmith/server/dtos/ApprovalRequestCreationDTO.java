package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;
import java.util.Set;

@AllArgsConstructor
@Getter
@NoArgsConstructor
@Setter
public class ApprovalRequestCreationDTO {
    String workflowId;
    Set<String> requestToUsers;
    Set<String> requestToGroups;
    String requestName;
    String message;
    Map<String, Object> metadata;
    Set<String> resolutions;
    String runId;
}
