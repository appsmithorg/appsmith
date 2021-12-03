package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;

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
    CommentMode mode;

}
