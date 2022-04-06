package com.appsmith.server.dtos;

import com.appsmith.server.domains.GitProfile;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitConnectDTO {

    String remoteUrl;

    GitProfile gitProfile;
}
