package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class GitAuthDTO {
    String publicKey;

    @JsonView(Views.Internal.class)
    String privateKey;

    String docUrl;

    List<GitDeployKeyDTO> gitSupportedSSHKeyType;

}
