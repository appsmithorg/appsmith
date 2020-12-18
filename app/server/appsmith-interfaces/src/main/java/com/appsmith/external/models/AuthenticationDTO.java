package com.appsmith.external.models;

import com.appsmith.external.constants.AuthType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.Setter;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        visible = true,
        property = "type",
        defaultImpl = DBAuth.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = DBAuth.class, name = AuthType.DB_AUTH),
        @JsonSubTypes.Type(value = OAuth2.class, name = AuthType.OAUTH2)
})
public class AuthenticationDTO {

    @JsonIgnore
    private boolean isEncrypted;

    @JsonIgnore
    public Map<String, String> getEncryptionFields() {
        return Collections.emptyMap();
    }

    @JsonIgnore
    public void setEncryptionFields(Map<String, String> encryptedFields) {
    }

    @JsonIgnore
    public Set<String> getEmptyEncryptionFields() {
        return Collections.emptySet();
    }

}
