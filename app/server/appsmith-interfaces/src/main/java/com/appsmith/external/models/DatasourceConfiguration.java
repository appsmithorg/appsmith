package com.appsmith.external.models;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@Document
public class DatasourceConfiguration implements AppsmithDomain {

    Connection connection;

    List<Endpoint> endpoints;

    AuthenticationDTO authentication;

    SSHConnection sshProxy;

    Boolean sshProxyEnabled;

    List<Property> properties;

    // For REST API.
    String url;

    List<Property> headers;

    public boolean isSshProxyEnabled() {
        return sshProxyEnabled == null ? false : sshProxyEnabled;
    }

}
