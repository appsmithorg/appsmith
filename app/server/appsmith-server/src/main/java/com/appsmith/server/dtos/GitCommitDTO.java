package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class GitCommitDTO {

    @JsonView(Views.Api.class)
    String commitMessage;

    @JsonView(Views.Api.class)
    String commitHeader;

    @JsonView(Views.Api.class)
    Boolean doPush;
}
