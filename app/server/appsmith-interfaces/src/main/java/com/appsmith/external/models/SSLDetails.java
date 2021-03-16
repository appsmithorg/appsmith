package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@AllArgsConstructor
@NoArgsConstructor
@Document
public class SSLDetails {

    public enum AuthType {
        NO_SSL,

        // Following for Postgres Connections.
        ALLOW, PREFER, REQUIRE, DISABLE, VERIFY_CA, VERIFY_FULL,

        // Following for MongoDB Connections.
        CA_CERTIFICATE, SELF_SIGNED_CERTIFICATE
    }

    AuthType authType;

    UploadedFile keyFile;

    UploadedFile certificateFile;

    UploadedFile caCertificateFile;

    Boolean usePemCertificate;

    PEMCertificate pemCertificate;

}
