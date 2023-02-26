package com.appsmith.server.dtos;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthorizationCodeCallbackDTO {
    // Present in success state
    private String code;
    // Required by Appsmith to preserve context of the request
    private String state;
    // Optional depending on user configuration
    private String scope;
    // Present in failure state
    private String error;
}
