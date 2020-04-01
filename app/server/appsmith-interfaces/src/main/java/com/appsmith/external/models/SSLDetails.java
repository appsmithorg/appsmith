package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class SSLDetails {

    public enum AuthType {
        CACertificate, SelfSignedCertificate
    }

    AuthType authType;

    String keyFile;

    String certificateFile;

    String caCertificateFile;

    Boolean usePemCertificate;

    PEMCertificate pemCertificate;

}
