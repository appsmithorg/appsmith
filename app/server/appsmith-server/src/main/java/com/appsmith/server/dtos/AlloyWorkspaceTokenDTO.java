package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AlloyWorkspaceTokenDTO {
    String workspaceId;
    String userId;
    String token;
}
