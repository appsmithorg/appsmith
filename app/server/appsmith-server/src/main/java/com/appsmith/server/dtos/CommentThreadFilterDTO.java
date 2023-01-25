package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.appsmith.server.domains.ApplicationMode;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

import jakarta.validation.constraints.NotNull;

@Data
public class CommentThreadFilterDTO {
    @NotNull
    @JsonView(Views.Api.class)
    private String applicationId;

    @JsonView(Views.Api.class)
    private Boolean resolved;
    
    @JsonView(Views.Api.class)
    private ApplicationMode mode;
}
