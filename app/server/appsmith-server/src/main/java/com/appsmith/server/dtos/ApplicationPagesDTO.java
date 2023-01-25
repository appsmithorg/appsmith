package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.appsmith.server.domains.Application;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplicationPagesDTO {

    @JsonView(Views.Api.class)
    String workspaceId;

    @JsonView(Views.Api.class)
    Application application;

    @JsonView(Views.Api.class)
    List<PageNameIdDTO> pages;

}
