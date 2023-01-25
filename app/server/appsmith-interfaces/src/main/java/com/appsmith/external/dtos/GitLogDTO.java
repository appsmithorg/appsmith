package com.appsmith.external.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class GitLogDTO {
    @JsonView(Views.Api.class)
    String commitId;

    @JsonView(Views.Api.class)
    String authorName;

    @JsonView(Views.Api.class)
    String authorEmail;

    @JsonView(Views.Api.class)
    String commitMessage;

    @JsonView(Views.Api.class)
    String timestamp;
}
