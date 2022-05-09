package com.appsmith.server.dtos;

import com.appsmith.server.domains.GitAuth;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class GitAuthDTO {
    GitAuth gitAuth;

    List<GitDeployKeyDTO> gitDeployKeyDTOList;

}
