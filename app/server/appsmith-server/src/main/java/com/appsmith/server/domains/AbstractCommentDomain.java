package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Transient;

@EqualsAndHashCode(callSuper = true)
@Data
public abstract class AbstractCommentDomain extends BaseDomain {
    String pageId;
    String applicationId;
    String applicationName;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String authorName;  // Display name of the user, who authored this comment or thread.

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String authorUsername; // username i.e. email of the user, who authored this comment or thread.
    String orgId;

    /** Edit/Published Mode */
    ApplicationMode mode;


    @Transient
    String branchName;

    public String getType() {
        return getClass().getSimpleName();
    }
}
