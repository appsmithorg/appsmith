package com.appsmith.external.models;

import com.appsmith.external.constants.Authentication;
import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import reactor.core.publisher.Mono;

import java.util.Set;

@Getter
@Setter
@EqualsAndHashCode
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, visible = true, property = "authenticationType", defaultImpl = DBAuth.class)
@JsonSubTypes({
    @JsonSubTypes.Type(value = DBAuth.class, name = Authentication.DB_AUTH),
    @JsonSubTypes.Type(value = OAuth2.class, name = Authentication.OAUTH2),
    @JsonSubTypes.Type(value = BasicAuth.class, name = Authentication.BASIC),
    @JsonSubTypes.Type(value = ApiKeyAuth.class, name = Authentication.API_KEY),
    @JsonSubTypes.Type(value = BearerTokenAuth.class, name = Authentication.BEARER_TOKEN),
    @JsonSubTypes.Type(value = KeyPairAuth.class, name = Authentication.SNOWFLAKE_KEY_PAIR_AUTH)
})
@FieldNameConstants
public class AuthenticationDTO implements AppsmithDomain {
    // In principle, this class should've been abstract. However, when this class is abstract, Spring's deserialization
    // routines choke on identifying the correct class to instantiate and ends up trying to instantiate this abstract
    // class and fails.

    public enum AuthenticationStatus {
        NONE,
        IN_PROGRESS,
        SUCCESS,
        FAILURE,
        FAILURE_ACCESS_DENIED,
        FAILURE_FILE_NOT_SELECTED,
        IN_PROGRESS_PERMISSIONS_GRANTED
    };

    @JsonView({Views.Public.class, FromRequest.class})
    String authenticationType;

    @JsonView(Views.Public.class)
    AuthenticationStatus authenticationStatus;

    @JsonView(Views.Public.class)
    Set<Property> customAuthenticationParameters;

    @JsonView(Views.Public.class)
    private Boolean isAuthorized;

    @JsonView(Views.Internal.class)
    AuthenticationResponse authenticationResponse;

    public Mono<Boolean> hasExpired() {
        return Mono.just(Boolean.FALSE);
    }
}
