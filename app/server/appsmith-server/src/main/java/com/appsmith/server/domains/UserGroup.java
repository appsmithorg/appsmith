package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.UserProfileDTO;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.List;

@Document
public class UserGroup extends BaseDomain {

    @NotNull
    String name;

    String description;

    // Note : While storing the users' information, ensure all the sensitive and unnecessary data is cleared out before
    // storing inside the user group
    List<UserProfileDTO> users;

}
