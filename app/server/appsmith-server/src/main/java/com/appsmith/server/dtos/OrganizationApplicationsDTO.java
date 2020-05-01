package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class OrganizationApplicationsDTO {
    String organizationId;
    String organizationName;
    List<String> userPermissions;
    List<ApplicationPermissionsDTO> applications;
}
