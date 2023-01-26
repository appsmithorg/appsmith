package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.appsmith.server.domains.User;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class UserSignupDTO {
    @JsonView(Views.Public.class)
    private User user;
    
    @JsonView(Views.Public.class)
    private String defaultWorkspaceId;
}
