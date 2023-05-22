/* Copyright 2019-2023 Appsmith */
package com.appsmith.external.models;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Builder(toBuilder = true)
@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
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
  List<Property> queryParameters;

  public boolean isSshProxyEnabled() {
    return sshProxyEnabled == null ? false : sshProxyEnabled;
  }
}
