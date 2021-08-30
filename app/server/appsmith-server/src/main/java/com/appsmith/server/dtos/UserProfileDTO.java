package com.appsmith.server.dtos;

import lombok.Data;

import java.util.Set;

@Data
public class UserProfileDTO {

    String email;

    Set<String> organizationIds;

    String username;

    String name;

    String gender;

    boolean isEmptyInstance = false;

}
