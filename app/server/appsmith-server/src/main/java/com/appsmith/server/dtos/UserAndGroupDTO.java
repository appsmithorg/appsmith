package com.appsmith.server.dtos;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserAndGroupDTO {

    String username;

    String name;

    String groupName;

    String groupId;

}
