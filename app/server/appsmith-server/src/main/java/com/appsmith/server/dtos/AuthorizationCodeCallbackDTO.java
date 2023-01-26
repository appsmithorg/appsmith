package com.appsmith.server.dtos;


import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthorizationCodeCallbackDTO {
    // Present in success state
    @JsonView(Views.Public.class)
    private String code;
    
    // Required by Appsmith to preserve context of the request
    @JsonView(Views.Public.class)
    private String state;

    // Optional depending on user configuration
    @JsonView(Views.Public.class)
    private String scope;

    // Present in failure state
    @JsonView(Views.Public.class)
    private String error;
}
