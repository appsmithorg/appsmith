package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.UserState;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class UserSignupRequestDTO {

    @JsonView(Views.Public.class)
    private String email;

    @JsonView(Views.Public.class)
    private String name;

    @JsonView(Views.Public.class)
    private LoginSource source = LoginSource.FORM;

    @JsonView(Views.Public.class)
    private UserState state = UserState.ACTIVATED;

    @JsonView(Views.Public.class)
    private boolean isEnabled = true;

    @JsonView(Views.Public.class)
    private String password;

    @JsonView(Views.Public.class)
    private String role;

    @JsonView(Views.Public.class)
    private String useCase;

    @JsonView(Views.Public.class)
    private boolean allowCollectingAnonymousData;

    @JsonView(Views.Public.class)
    private boolean signupForNewsletter;

}
