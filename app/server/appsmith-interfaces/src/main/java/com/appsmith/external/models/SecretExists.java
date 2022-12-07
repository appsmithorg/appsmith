package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
//@JsonInclude(JsonInclude.Include.NON_NULL)
public class SecretExists {

    private Boolean password;
    private Boolean clientSecret;
    private Boolean value;
    private Boolean bearerToken;

}
