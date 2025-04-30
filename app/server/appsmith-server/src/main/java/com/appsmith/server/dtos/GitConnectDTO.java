package com.appsmith.server.dtos;

import com.appsmith.server.domains.GitProfile;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitConnectDTO {

    String remoteUrl;

    GitProfile gitProfile;

    /**
     * This attribute has been placed specifically for packages,
     * In multi instance setup, the packages in PROD are present in non git connected state.
     * Once the DEV package connects to git, the prod would also require the git connected package
     * however importing a new package in PROD workspace would cause problems, and we can't delete existing
     * consumed packages, hence we would override prod package with same UUID.
     */
    Boolean override;
}
