package com.appsmith.external.models;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
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

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    Connection connection;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    List<Endpoint> endpoints;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    AuthenticationDTO authentication;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    SSHConnection sshProxy;

    Boolean sshProxyEnabled;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    List<Property> properties;

    // For REST API.
    String url;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    List<Property> headers;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    List<Property> queryParameters;

    public boolean isSshProxyEnabled() {
        return sshProxyEnabled == null ? false : sshProxyEnabled;
    }
}
