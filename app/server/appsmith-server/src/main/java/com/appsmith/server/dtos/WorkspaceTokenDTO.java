package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkspaceTokenDTO {
    String workspaceId;
    String token;
    String projectId;
}
