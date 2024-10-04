package com.appsmith.server.dtos;

import com.appsmith.server.helpers.HashUtils;
import lombok.Data;
import net.minidev.json.JSONObject;

import java.util.Optional;

@Data
public class InstanceAdminMetaDTO {
    String email;
    String emailDomainHash;

    static final String EMAIL = "email";
    static final String EMAIL_DOMAIN_HASH = "emailDomainHash";

    /**
     * Converts an email address to a JSONObject containing the email and its domain hash.
     * @param email The email address to convert
     * @return A JSONObject containing the email and its domain hash
     */
    public static JSONObject toJsonObject(String email) {
        email = email == null ? "" : email;
        JSONObject jsonObject = new JSONObject();
        jsonObject.put(EMAIL, email);
        jsonObject.put(EMAIL_DOMAIN_HASH, HashUtils.getEmailDomainHash(email));
        return jsonObject;
    }

    /**
     * Creates an InstanceAdminMetaDTO from a JSONObject.
     * @param jsonObject The JSONObject containing email and emailDomainHash
     * @return An InstanceAdminMetaDTO populated with data from the JSONObject
     */
    public static InstanceAdminMetaDTO fromJsonObject(JSONObject jsonObject) {
        if (jsonObject == null) {
            return new InstanceAdminMetaDTO();
        }
        InstanceAdminMetaDTO instanceAdminMetaDTO = new InstanceAdminMetaDTO();
        instanceAdminMetaDTO.setEmail(
                Optional.ofNullable(jsonObject.get(EMAIL)).map(Object::toString).orElse(""));
        instanceAdminMetaDTO.setEmailDomainHash(Optional.ofNullable(jsonObject.get(EMAIL_DOMAIN_HASH))
                .map(Object::toString)
                .orElse(""));
        return instanceAdminMetaDTO;
    }
}
