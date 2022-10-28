package com.appsmith.server.dtos;

import lombok.Data;

import java.util.Set;

@Data
public class UpdateGroupMembershipDTO {
    Set<String> usernames;
    Set<String> groupsAdded;
    Set<String> groupsRemoved;
}
