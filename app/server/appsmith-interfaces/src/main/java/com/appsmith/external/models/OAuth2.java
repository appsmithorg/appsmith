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
import org.apache.logging.log4j.util.Strings;
import org.springframework.data.annotation.Transient;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@DocumentType(Authentication.OAUTH2)
public class OAuth2 extends AuthenticationDTO {
    public enum Type {
        @JsonProperty(Authentication.CLIENT_CREDENTIALS)
        CLIENT_CREDENTIALS,
        @JsonProperty(Authentication.AUTHORIZATION_CODE)
        AUTHORIZATION_CODE
    }

    Type grantType;

    Boolean isTokenHeader = false;

    Boolean isAuthorizationHeader = false;

    String clientId;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String clientSecret;

    String authorizationUrl;

    String accessTokenUrl;

    @Transient
    String scopeString;

    Set<String> scope;

    String headerPrefix;

    Set<Property> customTokenParameters;


    public String getScopeString() {
        if (scopeString != null && !scopeString.isBlank()) {
            return scopeString;
        } else if (this.scope != null && !this.scope.isEmpty()) {
            return Strings.join(this.scope, ',');
        } else return null;
    }

    public void setScopeString(String scopeString) {
        this.scopeString = scopeString;
        if (scopeString != null && !scopeString.isBlank()) {
            this.scope = Arrays.stream(scopeString.split(","))
                    .filter(x -> !StringUtils.isEmpty(x))
                    .map(String::trim)
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public Map<String, String> getEncryptionFields() {
        Map<String, String> map = new HashMap<>();
        if (this.clientSecret != null) {
            map.put(FieldName.CLIENT_SECRET, this.clientSecret);
        }
        if (this.getAuthenticationResponse() != null) {
            if (this.authenticationResponse.getToken() != null) {
                map.put(FieldName.TOKEN, this.authenticationResponse.getToken());
            }
            if (this.authenticationResponse.getRefreshToken() != null) {
                map.put(FieldName.REFRESH_TOKEN, this.authenticationResponse.getRefreshToken());
            }
            if (this.authenticationResponse.getTokenResponse() != null) {
                map.put(FieldName.TOKEN_RESPONSE, String.valueOf(this.authenticationResponse.getTokenResponse()));
            }
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
                this.authenticationResponse.setToken(encryptedFields.get(FieldName.TOKEN));
            }
            if (encryptedFields.containsKey(FieldName.REFRESH_TOKEN)) {
                this.authenticationResponse.setRefreshToken(encryptedFields.get(FieldName.REFRESH_TOKEN));
            }
            if (encryptedFields.containsKey(FieldName.TOKEN_RESPONSE)) {
                this.authenticationResponse.setTokenResponse(encryptedFields.get(FieldName.TOKEN_RESPONSE));
            }
        }
    }

    @Override
    public Set<String> getEmptyEncryptionFields() {
        Set<String> set = new HashSet<>();
        if (this.clientSecret == null || this.clientSecret.isEmpty()) {
            set.add(FieldName.CLIENT_SECRET);
        }
        if (this.getAuthenticationResponse() != null) {
            if (this.authenticationResponse.getToken() == null || this.authenticationResponse.getToken().isEmpty()) {
                set.add(FieldName.TOKEN);
            }
            if (this.authenticationResponse.getRefreshToken() == null || this.authenticationResponse.getRefreshToken().isEmpty()) {
                set.add(FieldName.REFRESH_TOKEN);
            }
            if (this.authenticationResponse.getTokenResponse() == null || (String.valueOf(this.authenticationResponse.getTokenResponse())).isEmpty()) {
                set.add(FieldName.TOKEN_RESPONSE);
            }
        }
        return set;
    }


}
