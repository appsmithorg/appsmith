package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@Document
public class PEMCertificate {

    String file;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String password;

}
