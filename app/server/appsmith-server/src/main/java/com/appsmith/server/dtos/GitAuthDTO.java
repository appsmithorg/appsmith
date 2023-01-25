package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class GitAuthDTO {
    @JsonView(Views.Api.class)
    String publicKey;

    @JsonView(Views.Internal.class)
    String privateKey;

    @JsonView(Views.Api.class)
    String docUrl;

    @JsonView(Views.Api.class)
    List<GitDeployKeyDTO> gitSupportedSSHKeyType;

}
