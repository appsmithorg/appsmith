package com.appsmith.external.models;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class SSLDetails implements AppsmithDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    public enum AuthType {
        // Default driver configurations
        DEFAULT,
        NO_SSL,

        // For those drivers that don't have any specific options
        ENABLED,

        // Following for Mysql/Postgres Connections.
        ALLOW,
        PREFER,
        REQUIRE,
        DISABLE,
        VERIFY_CA,
        VERIFY_FULL,

        // For MySql Connections
        PREFERRED,
        REQUIRED,
        DISABLED,

        // Following for MongoDB Connections.
        CA_CERTIFICATE,
        SELF_SIGNED_CERTIFICATE,

        // For MsSQL, Oracle DB Connections
        NO_VERIFY
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

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    UploadedFile keyFile;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    UploadedFile certificateFile;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    UploadedFile caCertificateFile;

    Boolean usePemCertificate;

    @OneToOne
    @Type(JsonBinaryType.class)
    PEMCertificate pemCertificate;
}
