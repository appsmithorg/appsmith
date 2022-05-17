package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class GitAuthDTO {
    String publicKey;

    @JsonIgnore
    String privateKey;

    String docUrl;

    List<GitDeployKeyDTO> gitSupportedSSHKeyType;

}
