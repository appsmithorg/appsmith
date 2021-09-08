package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitConnectDTO {

    String remoteUrl;

    String applicationId;

    String organizationId;
}
