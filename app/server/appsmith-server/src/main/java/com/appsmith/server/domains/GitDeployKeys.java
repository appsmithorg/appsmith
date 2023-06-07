/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;

import lombok.Data;

@Data
public class GitDeployKeys extends BaseDomain {
    String email;

    GitAuth gitAuth;
}
