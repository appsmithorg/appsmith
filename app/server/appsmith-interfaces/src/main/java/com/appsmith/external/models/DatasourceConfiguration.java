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

    @JsonView(Views.Public.class)
    Connection connection;

    @JsonView(Views.Public.class)
    List<Endpoint> endpoints;

    @JsonView(Views.Public.class)
    AuthenticationDTO authentication;

    @JsonView(Views.Public.class)
    SSHConnection sshProxy;

    @JsonView(Views.Public.class)
    Boolean sshProxyEnabled;

    @JsonView(Views.Public.class)
    List<Property> properties;

    // For REST API.
    @JsonView(Views.Public.class)
    String url;

    @JsonView(Views.Public.class)
    List<Property> headers;

    @JsonView(Views.Public.class)
    List<Property> queryParameters;

    @JsonView(Views.Public.class)
    public boolean isSshProxyEnabled() {
        return sshProxyEnabled == null ? false : sshProxyEnabled;
    }

}
