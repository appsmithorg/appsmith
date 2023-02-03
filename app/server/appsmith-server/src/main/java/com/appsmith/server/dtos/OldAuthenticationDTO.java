package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
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
    @JsonView(Views.Public.class)
    private String expiresAt;

    @JsonView(Views.Public.class)
    String authType;

    @JsonView(Views.Public.class)
    String username;

    @JsonView(Views.Public.class)
    String password;
}
