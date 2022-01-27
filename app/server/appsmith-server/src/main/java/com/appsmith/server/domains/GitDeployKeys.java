package com.appsmith.server.domains;

import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.models.BaseDomain;
import lombok.Data;

@Data
public class GitDeployKeys extends BaseDomain {
    String email;

    GitAuth gitAuth;
}
