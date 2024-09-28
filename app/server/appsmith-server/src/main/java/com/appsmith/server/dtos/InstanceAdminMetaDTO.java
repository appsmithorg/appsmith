package com.appsmith.server.dtos;

import com.appsmith.server.helpers.HashUtils;
import lombok.Data;
import net.minidev.json.JSONObject;

@Data
public class InstanceAdminMetaDTO {
    String email;
    String emailDomainHash;

    public static JSONObject toJsonObject(String email) {
        email = email == null ? "" : email;
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("email", email);
        jsonObject.put("emailDomainHash", HashUtils.getEmailDomainHash(email));
        return jsonObject;
    }

    public static InstanceAdminMetaDTO fromJsonObject(JSONObject jsonObject) {
        if (jsonObject == null) {
            return new InstanceAdminMetaDTO();
        }
        InstanceAdminMetaDTO instanceAdminMetaDTO = new InstanceAdminMetaDTO();
        instanceAdminMetaDTO.setEmail((String) jsonObject.get("email"));
        instanceAdminMetaDTO.setEmailDomainHash((String) jsonObject.get("emailDomainHash"));
        return instanceAdminMetaDTO;
    }
}
