package com.appsmith.external.models;

import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

import static org.springframework.util.CollectionUtils.isEmpty;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class SSHConnection implements AppsmithDomain {

    public enum AuthType {
        IDENTITY_FILE,
        PASSWORD
    }

    @JsonView({Views.Public.class, FromRequest.class})
    String host;

    @JsonView({Views.Public.class, FromRequest.class})
    Long port;

    @JsonView({Views.Public.class, FromRequest.class})
    List<Endpoint> endpoints;

    public void setEndpoints(List<Endpoint> endpoints) {
        this.endpoints = endpoints;

        if (!isEmpty(endpoints)) {
            this.host = endpoints.get(0).getHost();
            this.port = endpoints.get(0).getPort();
        }
    }

    @JsonView({Views.Public.class, FromRequest.class})
    String username;

    @JsonView({Views.Public.class, FromRequest.class})
    AuthType authType;

    @JsonView({Views.Public.class, FromRequest.class})
    SSHPrivateKey privateKey;
}
