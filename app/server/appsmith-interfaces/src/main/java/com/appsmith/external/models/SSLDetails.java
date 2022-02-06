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
public class SSLDetails implements AppsmithDomain {

    public enum AuthType {
        // Default driver configurations
        DEFAULT, NO_SSL,

        //For those drivers that don't have any specific options
        ENABLED,

        // Following for Mysql/Postgres Connections.
        ALLOW, PREFER, REQUIRE, DISABLE, VERIFY_CA, VERIFY_FULL,

        // For MySql Connections
        PREFERRED, REQUIRED, DISABLED,

        // Following for MongoDB Connections.
        CA_CERTIFICATE, SELF_SIGNED_CERTIFICATE
    }

    public enum CACertificateType {
        // In case user does not want to provide any certificate
        NONE,

        // Provide CA Certificate file
        FILE,

        // Some services provide CA certificate as a base64 encoded string instead of a file.
        BASE64_STRING
    }

    AuthType authType;

    CACertificateType caCertificateType;

    UploadedFile keyFile;

    UploadedFile certificateFile;

    UploadedFile caCertificateFile;

    Boolean usePemCertificate;

    PEMCertificate pemCertificate;

}
