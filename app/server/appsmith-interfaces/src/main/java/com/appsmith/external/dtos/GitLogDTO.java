package com.appsmith.external.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class GitLogDTO {
    @JsonView(Views.Public.class)
    String commitId;

    @JsonView(Views.Public.class)
    String authorName;

    @JsonView(Views.Public.class)
    String authorEmail;

    @JsonView(Views.Public.class)
    String commitMessage;

    @JsonView(Views.Public.class)
    String timestamp;
}
