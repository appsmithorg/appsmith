package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class GitCommitDTO {

    @JsonView(Views.Public.class)
    String commitMessage;

    @JsonView(Views.Public.class)
    String commitHeader;

    @JsonView(Views.Public.class)
    Boolean doPush;
}
