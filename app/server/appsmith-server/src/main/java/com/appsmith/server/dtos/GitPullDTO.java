package com.appsmith.server.dtos;

import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.models.Views;
import com.appsmith.server.domains.Application;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitPullDTO {

    @JsonView(Views.Api.class)
    Application application;

    @JsonView(Views.Api.class)
    MergeStatusDTO mergeStatus;
}
