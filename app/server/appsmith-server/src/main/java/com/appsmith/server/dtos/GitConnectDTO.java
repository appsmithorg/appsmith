package com.appsmith.server.dtos;

import com.appsmith.server.domains.GitAuth;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitConnectDTO {

    String remoteUrl;

    String applicationId;

    GitAuth gitAuth;

    String authorName;

    String authorEmail;

    String organizationId;
}
