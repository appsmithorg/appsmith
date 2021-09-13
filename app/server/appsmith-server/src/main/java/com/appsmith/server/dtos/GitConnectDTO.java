package com.appsmith.server.dtos;

import com.appsmith.server.domains.GitConfig;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitConnectDTO {

    String remoteUrl;

    GitConfig gitConfig;
}
