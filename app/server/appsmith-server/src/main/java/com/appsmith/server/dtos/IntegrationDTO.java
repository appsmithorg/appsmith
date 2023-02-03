package com.appsmith.server.dtos;

import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class IntegrationDTO {
    @JsonView(Views.Public.class)
    String installationKey;

    @JsonView(Views.Public.class)
    String datasourceId;

    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Public.class)
    String pageId;

    @JsonView(Views.Public.class)
    String pluginName;

    @JsonView(Views.Public.class)
    String pluginVersion;

    // TODO start using this in the future
    @JsonView(Views.Public.class)
    Type authenticationType;

    @JsonView(Views.Public.class)
    Set<String> scope;

    @JsonView(Views.Public.class)
    AuthenticationResponse authenticationResponse;

    @JsonView(Views.Public.class)
    String redirectionDomain;

    @JsonView(Views.Public.class)
    String branch;

    @JsonView(Views.Public.class)
    String importForGit;

    public enum Type {
        @JsonProperty("oAuth2")
        OAUTH2
    }
}
