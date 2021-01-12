package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * This model is intended to hold any user-specific information that is not directly about the user's authentication.
 */
@Getter
@Setter
@ToString
@Document
public class UserData extends BaseDomain {

    @JsonIgnore
    String userId;

    // The version where this user has last viewed the release notes.
    private String releaseNotesViewedVersion;

    public UserData(String userId) {
        this.userId = userId;
    }

}
