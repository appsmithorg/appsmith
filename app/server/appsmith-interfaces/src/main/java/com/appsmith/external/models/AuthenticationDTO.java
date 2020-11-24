package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        visible = true,
        property = "type",
        defaultImpl = DBAuth.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = DBAuth.class, name = "dbAuth"),
        @JsonSubTypes.Type(value = OAuth2.class, name = "oAuth2")
})
public class AuthenticationDTO {

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
