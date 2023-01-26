package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

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
@NoArgsConstructor
@AllArgsConstructor
@Document
public class PEMCertificate implements AppsmithDomain {

    @JsonView(Views.Public.class)
    UploadedFile file;

    @Encrypted
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @JsonView(Views.Public.class)
    String password;

}
