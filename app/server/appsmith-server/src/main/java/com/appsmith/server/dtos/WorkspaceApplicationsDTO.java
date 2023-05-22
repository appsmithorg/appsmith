/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class WorkspaceApplicationsDTO {

  Workspace workspace;
  List<Application> applications;
  List<MemberInfoDTO> users;
}
