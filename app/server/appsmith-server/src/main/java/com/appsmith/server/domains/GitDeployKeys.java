package com.appsmith.server.domains;

import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class GitDeployKeys extends BaseDomain {
    @JsonView(Views.Api.class)
    String email;

    @JsonView(Views.Api.class)
    GitAuth gitAuth;
}
