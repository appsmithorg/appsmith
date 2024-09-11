package com.appsmith.external.models;

import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;

import java.util.List;

@Builder(toBuilder = true)
@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class DatasourceConfiguration implements AppsmithDomain {

    @JsonView({Views.Public.class, FromRequest.class})
    Connection connection;

    @JsonView({Views.Public.class, FromRequest.class})
    List<Endpoint> endpoints;

    @JsonView({Views.Public.class, FromRequest.class})
    AuthenticationDTO authentication;

    SSHConnection sshProxy;

    Boolean sshProxyEnabled;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    List<Property> properties;

    // For REST API.
    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    String url;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    List<Property> headers;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    List<Property> queryParameters;

    public boolean isSshProxyEnabled() {
        return sshProxyEnabled == null ? false : sshProxyEnabled;
    }
}
