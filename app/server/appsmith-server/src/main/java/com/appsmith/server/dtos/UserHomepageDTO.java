package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.appsmith.server.domains.User;
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
public class UserHomepageDTO {

    @JsonView(Views.Public.class)
    User user;

    @JsonView(Views.Public.class)
    List<WorkspaceApplicationsDTO> workspaceApplications;
}
