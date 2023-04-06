package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
public class InviteUsersToApplicationDTO {
    Set<String> usernames;

    Set<String> groups;

    String roleType;

    String applicationId;
}
