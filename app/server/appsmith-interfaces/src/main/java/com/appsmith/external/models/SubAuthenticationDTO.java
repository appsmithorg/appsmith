package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Map;
import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class SubAuthenticationDTO extends AuthenticationDTO {

    DBAuth.Type authType;

    String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String password;

    String databaseName;

    String testField;

    @Override
    public Map<String, String> getEncryptionFields() {
        return null;
    }

    @Override
    public void setEncryptionFields(Map<String, String> encryptedFields) {

    }

    @Override
    public Set<String> getEmptyEncryptionFields() {
        return null;
    }
}
