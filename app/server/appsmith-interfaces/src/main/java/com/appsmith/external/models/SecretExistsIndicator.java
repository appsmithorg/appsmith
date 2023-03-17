package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * This class contains boolean variables to indicate
 * whether an authenticated datasource has secret or not
*/
@Getter
@Setter
@NoArgsConstructor
public class SecretExistsIndicator {

    private Boolean password;
    private Boolean clientSecret;
    private Boolean value;
    private Boolean bearerToken;

}
