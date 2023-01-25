package com.appsmith.external.models;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonView;

import java.util.List;

@Builder(toBuilder = true)
@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Document
public class DatasourceConfiguration implements AppsmithDomain {

    @JsonView(Views.Api.class)
    Connection connection;

    @JsonView(Views.Api.class)
    List<Endpoint> endpoints;

    @JsonView(Views.Api.class)
    AuthenticationDTO authentication;

    @JsonView(Views.Api.class)
    SSHConnection sshProxy;

    @JsonView(Views.Api.class)
    Boolean sshProxyEnabled;

    @JsonView(Views.Api.class)
    List<Property> properties;

    // For REST API.
    @JsonView(Views.Api.class)
    String url;

    @JsonView(Views.Api.class)
    List<Property> headers;

    @JsonView(Views.Api.class)
    List<Property> queryParameters;

    @JsonView(Views.Api.class)
    public boolean isSshProxyEnabled() {
        return sshProxyEnabled == null ? false : sshProxyEnabled;
    }

}
