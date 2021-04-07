package com.appsmith.external.models;

import com.appsmith.external.annotations.documenttype.DocumentType;
import com.appsmith.external.constants.Authentication;
import com.appsmith.external.constants.FieldName;
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
@DocumentType(Authentication.DB_AUTH)
public class DBAuth extends AuthenticationDTO {

    public enum Type {
        SCRAM_SHA_1, SCRAM_SHA_256, MONGODB_CR, USERNAME_PASSWORD
    }

    Type authType;

    String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String password;

    String databaseName;

    @Override
    public Map<String, String> getEncryptionFields() {
        if (this.password != null && !this.password.isBlank()) {
            return Map.of(FieldName.PASSWORD, this.password);
        }
        return Map.of();
    }

    @Override
    public void setEncryptionFields(Map<String, String> encryptedFields) {
        if (encryptedFields != null && encryptedFields.containsKey(FieldName.PASSWORD)) {
            this.password = encryptedFields.get(FieldName.PASSWORD);
        }
    }

    @Override
    public Set<String> getEmptyEncryptionFields() {
        if (this.password == null || this.password.isBlank()) {
            return Set.of(FieldName.PASSWORD);
        }
        return Set.of();
    }
}
