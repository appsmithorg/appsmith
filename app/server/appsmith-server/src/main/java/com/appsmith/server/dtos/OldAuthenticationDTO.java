package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class OldAuthenticationDTO {
    @JsonView(Views.Api.class)
    private String expiresAt;

    @JsonView(Views.Api.class)
    String authType;

    @JsonView(Views.Api.class)
    String username;

    @JsonView(Views.Api.class)
    String password;
}
