package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

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
public abstract class AuthenticationDTO {

    @JsonIgnore
    public abstract Map<String, String> getEncryptionFields();
    @JsonIgnore
    public abstract void setEncryptionFields(Map<String, String> encryptedFields);
    @JsonIgnore
    public abstract Set<String> getEmptyEncryptionFields();
}
