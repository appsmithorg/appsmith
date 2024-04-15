package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class GitDeployKeys extends BaseDomain {
    String email;

    GitAuth gitAuth;
}
