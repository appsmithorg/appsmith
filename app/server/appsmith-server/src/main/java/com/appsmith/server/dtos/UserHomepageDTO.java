package com.appsmith.server.dtos;

import com.appsmith.server.domains.User;
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
    User user;
    List<OrganizationApplicationsDTO> organizationApplications;
}
