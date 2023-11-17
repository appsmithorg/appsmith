package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@AllArgsConstructor
@Getter
@NoArgsConstructor
@Setter
public class ApprovalRequestCreationDTO {
    String workflowId;
    Set<String> requestToUsers;
    Set<String> requestToGroups;
    String title;
    String description;
    ApprovalRequestUserInfo userInfo;
    Set<String> allowedResolutions;
    String runId;
}
