package com.appsmith.server.dtos.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SearchEntityCE_DTO {
    List<Application> applications;
    List<Workspace> workspaces;
}
