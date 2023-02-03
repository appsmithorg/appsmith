package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.appsmith.server.domains.Application;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplicationPagesDTO {

    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView(Views.Public.class)
    Application application;

    @JsonView(Views.Public.class)
    List<PageNameIdDTO> pages;

}
