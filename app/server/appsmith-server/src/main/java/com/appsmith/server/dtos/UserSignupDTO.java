package com.appsmith.server.dtos;

import com.appsmith.server.domains.User;
import lombok.Data;

@Data
public class UserSignupDTO {
    private User user;
    private String defaultOrganizationId;
}
