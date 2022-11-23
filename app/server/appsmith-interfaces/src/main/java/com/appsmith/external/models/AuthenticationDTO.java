package com.appsmith.external.models;

import com.appsmith.external.constants.Authentication;
import com.appsmith.external.helpers.PluginUtils;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import org.springframework.util.StringUtils;
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
        @JsonSubTypes.Type(value = BasicAuth.class, name = Authentication.BASIC),
        @JsonSubTypes.Type(value = ApiKeyAuth.class, name = Authentication.API_KEY),
        @JsonSubTypes.Type(value = BearerTokenAuth.class, name = Authentication.BEARER_TOKEN)
})
public abstract class AuthenticationDTO implements AppsmithDomain {
    // In principle, this class should've been abstract. However, when this class is abstract, Spring's deserialization
    // routines choke on identifying the correct class to instantiate and ends up trying to instantiate this abstract
    // class and fails.

    public enum AuthenticationStatus {
        NONE,
        IN_PROGRESS,
        SUCCESS
    };

    String authenticationType;

    AuthenticationStatus authenticationStatus;

    Set<Property> customAuthenticationParameters;

    private Boolean isAuthorized;

    @JsonIgnore
    AuthenticationResponse authenticationResponse;

    protected abstract String getSecret();

    @JsonProperty
    protected boolean secretExists() {
        return StringUtils.hasLength(getSecret());
    }

    public Mono<Boolean> hasExpired() {
        return Mono.just(Boolean.FALSE);
    }

}
