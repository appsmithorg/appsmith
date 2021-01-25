package com.appsmith.external.models;

import com.appsmith.external.constants.AuthType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Transient;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        visible = true,
        property = "type",
        defaultImpl = DBAuth.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = DBAuth.class, name = AuthType.DB_AUTH),
        @JsonSubTypes.Type(value = OAuth2.class, name = AuthType.OAUTH2)
})
public class AuthenticationDTO {
    // In principle, this class should've been abstract. However, when this class is abstract, Spring's deserialization
    // routines choke on identifying the correct class to instantiate and ends up trying to instantiate this abstract
    // class and fails.

    @Transient
    String type;

    Set<Property> customAuthenticationParameters;

    @JsonIgnore
    private Boolean isEncrypted = false;

    @JsonIgnore
    public Map<String, String> getEncryptionFields() {
        return Collections.emptyMap();
    }

    public void setEncryptionFields(Map<String, String> encryptedFields) {
        // This is supposed to be overridden by implementations.
    }

    @JsonIgnore
    public Set<String> getEmptyEncryptionFields() {
        return Collections.emptySet();
    }

    @JsonIgnore
    public boolean isEncrypted() {
        return Boolean.TRUE.equals(isEncrypted);
    }

}
