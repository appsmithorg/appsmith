package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.UserState;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class UserSignupRequestDTO {

    @JsonView(Views.Api.class)
    private String email;

    @JsonView(Views.Api.class)
    private String name;

    @JsonView(Views.Api.class)
    private LoginSource source = LoginSource.FORM;

    @JsonView(Views.Api.class)
    private UserState state = UserState.ACTIVATED;

    @JsonView(Views.Api.class)
    private boolean isEnabled = true;

    @JsonView(Views.Api.class)
    private String password;

    @JsonView(Views.Api.class)
    private String role;

    @JsonView(Views.Api.class)
    private String useCase;

    @JsonView(Views.Api.class)
    private boolean allowCollectingAnonymousData;

    @JsonView(Views.Api.class)
    private boolean signupForNewsletter;

}
