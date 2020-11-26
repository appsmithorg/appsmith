package com.appsmith.external.models;

import com.appsmith.external.annotations.DocumentType;
import com.appsmith.external.constants.AuthType;
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
@DocumentType(AuthType.OAUTH2)
public class OAuth2 extends AuthenticationDTO {
    private static final String CLIENT_SECRET = "clientSecret";

    public enum Type {
        CLIENT_CREDENTIALS,
    }

    Type authType;

    String clientId;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String clientSecret;

    String accessTokenUrl;

    String scope;

    @Override
    public Map<String, String> getEncryptionFields() {
        if (this.clientSecret != null) {
            return Map.of(CLIENT_SECRET, this.clientSecret);
        }
        return Map.of();
    }

    @Override
    public void setEncryptionFields(Map<String, String> encryptedFields) {
        if (encryptedFields != null && encryptedFields.containsKey(CLIENT_SECRET)) {
            this.clientSecret = encryptedFields.get(CLIENT_SECRET);
        }
    }

    @Override
    public Set<String> getEmptyEncryptionFields() {
        if (this.clientSecret == null || this.clientSecret.isEmpty()) {
            return Set.of(CLIENT_SECRET, null);
        }
        return Set.of();
    }

}
