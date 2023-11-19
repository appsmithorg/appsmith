package com.appsmith.external.models;

import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

import java.util.List;

@Builder(toBuilder = true)
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class DatasourceConfiguration extends BaseDomain {

    @Type(JsonType.class)
    Connection connection;

    @Type(JsonType.class)
    List<Endpoint> endpoints;

    @Type(JsonType.class)
    AuthenticationDTO authentication;

    @Type(JsonType.class)
    SSHConnection sshProxy;

    Boolean sshProxyEnabled;

    @Type(JsonType.class)
    List<Property> properties;

    // For REST API.
    String url;

    @Type(JsonType.class)
    List<Property> headers;

    @Type(JsonType.class)
    List<Property> queryParameters;

    public boolean isSshProxyEnabled() {
        return sshProxyEnabled == null ? false : sshProxyEnabled;
    }
}
