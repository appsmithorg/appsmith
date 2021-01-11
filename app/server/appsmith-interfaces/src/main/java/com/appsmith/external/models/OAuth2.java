package com.appsmith.external.models;

import com.appsmith.external.annotations.DocumentType;
import com.appsmith.external.constants.AuthType;
import com.appsmith.external.constants.FieldName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@DocumentType(AuthType.OAUTH2)
public class OAuth2 extends AuthenticationDTO {
    public enum Type {
        CLIENT_CREDENTIALS,
    }

    Type authType;

    Boolean isHeader;

    String clientId;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String clientSecret;

    String accessTokenUrl;

    Set<String> scope;

    String headerPrefix = "Bearer";

    @JsonIgnore
    Object tokenResponse;

    @JsonIgnore
    String token;

    @JsonIgnore
    Instant issuedAt;

    @JsonIgnore
    Instant expiresAt;

    @Override
    public Map<String, String> getEncryptionFields() {
        Map<String, String> map = new HashMap<>();
        if (this.clientSecret != null) {
            map.put(FieldName.CLIENT_SECRET, this.clientSecret);
        }
        if (this.token != null) {
            map.put(FieldName.TOKEN, this.token);
        }
        if (this.tokenResponse != null) {
            map.put(FieldName.TOKEN_RESPONSE, String.valueOf(this.tokenResponse));
        }
        return map;
    }

    @Override
    public void setEncryptionFields(Map<String, String> encryptedFields) {
        if (encryptedFields != null) {
            if (encryptedFields.containsKey(FieldName.CLIENT_SECRET)) {
                this.clientSecret = encryptedFields.get(FieldName.CLIENT_SECRET);
            }
            if (encryptedFields.containsKey(FieldName.TOKEN)) {
                this.token = encryptedFields.get(FieldName.TOKEN);
            }
            if (encryptedFields.containsKey(FieldName.TOKEN_RESPONSE)) {
                this.tokenResponse = encryptedFields.get(FieldName.TOKEN_RESPONSE);
            }
        }
    }

    @Override
    public Set<String> getEmptyEncryptionFields() {
        Set<String> set = new HashSet<>();
        if (this.clientSecret == null || this.clientSecret.isEmpty()) {
            set.add(FieldName.CLIENT_SECRET);
        }
        if (this.token == null || this.token.isEmpty()) {
            set.add(FieldName.TOKEN);
        }
        if (this.tokenResponse == null || (String.valueOf(this.token)).isEmpty()) {
            set.add(FieldName.TOKEN_RESPONSE);
        }
        return set;
    }

}
