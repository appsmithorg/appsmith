package com.appsmith.external.models;

import com.appsmith.external.constants.Authentication;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Transient;
import reactor.core.publisher.Mono;

import java.util.Set;

@Getter
@Setter
@EqualsAndHashCode
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        visible = true,
        property = "authenticationType",
        defaultImpl = DBAuth.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = DBAuth.class, name = Authentication.DB_AUTH),
        @JsonSubTypes.Type(value = OAuth2.class, name = Authentication.OAUTH2),
        @JsonSubTypes.Type(value = BasicAuth.class, name = Authentication.BASIC)
})
public class AuthenticationDTO implements AppsmithDomain {
    // In principle, this class should've been abstract. However, when this class is abstract, Spring's deserialization
    // routines choke on identifying the correct class to instantiate and ends up trying to instantiate this abstract
    // class and fails.

    public enum AuthenticationStatus {
        NONE,
        IN_PROGRESS,
        SUCCESS
    };

    @Transient
    String authenticationType;

    AuthenticationStatus authenticationStatus;

    Set<Property> customAuthenticationParameters;

    @JsonIgnore
    private Boolean isEncrypted;

    private Boolean isAuthorized;

    @JsonIgnore
    AuthenticationResponse authenticationResponse;

    public Mono<Boolean> hasExpired() {
        return Mono.just(Boolean.FALSE);
    }

}
