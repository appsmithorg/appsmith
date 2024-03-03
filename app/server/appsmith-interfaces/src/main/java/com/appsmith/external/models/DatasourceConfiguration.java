package com.appsmith.external.models;

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

    Connection connection;

    List<Endpoint> endpoints;

    AuthenticationDTO authentication;

    SSHConnection sshProxy;

    Boolean sshProxyEnabled;

    List<Property> properties;

    // For REST API.
    String url;

    List<Property> headers;
    List<Property> queryParameters;

    public boolean isSshProxyEnabled() {
        return sshProxyEnabled == null ? false : sshProxyEnabled;
    }
}
