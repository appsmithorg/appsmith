package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class PEMCertificate implements AppsmithDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Type(JsonType.class)
    UploadedFile file;

    @Encrypted @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String password;
}
