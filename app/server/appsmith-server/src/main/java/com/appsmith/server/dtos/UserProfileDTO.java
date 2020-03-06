package com.appsmith.server.dtos;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserProfileDTO {

    User user;

    Organization currentOrganization;

    List<ApplicationNameIdDTO> applications;
}
