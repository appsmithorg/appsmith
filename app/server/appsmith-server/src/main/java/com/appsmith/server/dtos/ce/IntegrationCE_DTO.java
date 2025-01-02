package com.appsmith.server.dtos.ce;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.CreatorContextType;
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
public class IntegrationCE_DTO {
    String installationKey;

    String datasourceId;

    String workspaceId;

    String applicationId;

    String pageId;

    String pluginName;

    String pluginVersion;

    // TODO start using this in the future
    Type authenticationType;

    Set<String> scope;

    AuthenticationResponse authenticationResponse;

    String redirectionDomain;

    RefType refType;

    String refName;

    String importForGit;

    CreatorContextType contextType;

    public enum Type {
        @JsonProperty("oAuth2")
        OAUTH2
    }
}
