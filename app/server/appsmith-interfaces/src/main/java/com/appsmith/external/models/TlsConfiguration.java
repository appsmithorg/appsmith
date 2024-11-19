package com.appsmith.external.models;

import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class TlsConfiguration {

    @JsonView({Views.Public.class, FromRequest.class})
    Boolean tlsEnabled;

    @JsonView({Views.Public.class, FromRequest.class})
    Boolean requiresClientAuth;

    @JsonView({Views.Public.class, FromRequest.class})
    UploadedFile clientCertificateFile;

    @JsonView({FromRequest.class})
    UploadedFile clientKeyFile;
}
