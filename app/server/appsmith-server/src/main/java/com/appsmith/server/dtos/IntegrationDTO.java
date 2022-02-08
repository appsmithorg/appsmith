package com.appsmith.server.dtos;

import com.appsmith.external.models.AuthenticationResponse;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    String installationKey;

    String datasourceId;

    String applicationId;

    String pageId;

    String pluginName;

    String pluginVersion;

    // TODO start using this in the future
    Type authenticationType;

    Set<String> scope;

    AuthenticationResponse authenticationResponse;

    String redirectionDomain;

    String branch;

    public enum Type {
        @JsonProperty("oAuth2")
        OAUTH2
    }
}
