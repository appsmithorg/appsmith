package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AlloyWorkspaceUserCredentialDTO {
    String userId;
    String workspaceId;
    String credentialId;
    String credentialName;
    String credentialType;
}
