package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.constants.Authentication;
import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Builder
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ApiKeyAuth extends AuthenticationDTO {

    public enum Type {
        @JsonProperty(Authentication.API_KEY_AUTH_TYPE_QUERY_PARAMS)
        QUERY_PARAMS,
        @JsonProperty(Authentication.API_KEY_AUTH_TYPE_HEADER)
        HEADER,
    }

    @JsonView({Views.Public.class, FromRequest.class})
    Type addTo;

    @JsonView({Views.Public.class, FromRequest.class})
    String label;

    @JsonView({Views.Public.class, FromRequest.class})
    String headerPrefix;

    @JsonView({Views.Internal.class, FromRequest.class})
    @Encrypted String value;
}
