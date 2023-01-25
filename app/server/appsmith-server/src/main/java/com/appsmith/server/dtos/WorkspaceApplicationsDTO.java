package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class WorkspaceApplicationsDTO {
    @JsonView(Views.Api.class)
    Workspace workspace;

    @JsonView(Views.Api.class)
    List<Application> applications;

    @JsonView(Views.Api.class)
    List<WorkspaceMemberInfoDTO> users;
}
