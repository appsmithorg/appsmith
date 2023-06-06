package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.UserProfileCE_DTO;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class UserProfileDTO extends UserProfileCE_DTO {

    List<String> roles;

    List<String> groups;

    Map<String, Object> idToken;

    Map<String, Object> userClaims;

}
