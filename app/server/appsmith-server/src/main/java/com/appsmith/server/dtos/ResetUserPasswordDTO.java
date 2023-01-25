package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.appsmith.server.domains.User;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.NotEmpty;

@Getter
@Setter
public class ResetUserPasswordDTO extends User {

    @JsonView(Views.Api.class)
    String baseUrl;

    @NotEmpty
    @JsonView(Views.Api.class)
    String token;
}
