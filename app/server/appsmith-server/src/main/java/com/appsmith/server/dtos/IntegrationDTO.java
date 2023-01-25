package com.appsmith.server.dtos;

import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.Views;
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
    @JsonView(Views.Api.class)
    String installationKey;

    @JsonView(Views.Api.class)
    String datasourceId;

    @JsonView(Views.Api.class)
    String applicationId;

    @JsonView(Views.Api.class)
    String pageId;

    @JsonView(Views.Api.class)
    String pluginName;

    @JsonView(Views.Api.class)
    String pluginVersion;

    // TODO start using this in the future
    @JsonView(Views.Api.class)
    Type authenticationType;

    @JsonView(Views.Api.class)
    Set<String> scope;

    @JsonView(Views.Api.class)
    AuthenticationResponse authenticationResponse;

    @JsonView(Views.Api.class)
    String redirectionDomain;

    @JsonView(Views.Api.class)
    String branch;

    @JsonView(Views.Api.class)
    String importForGit;

    public enum Type {
        @JsonProperty("oAuth2")
        OAUTH2
    }
}
