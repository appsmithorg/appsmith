package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitMergeDTO {

    @JsonView(Views.Public.class)
    String sourceBranch;

    @JsonView(Views.Public.class)
    String destinationBranch;
}
