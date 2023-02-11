package com.appsmith.server.dtos;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
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
    Workspace workspace;
    List<Application> applications;
    List<WorkspaceMemberInfoDTO> users;
}
