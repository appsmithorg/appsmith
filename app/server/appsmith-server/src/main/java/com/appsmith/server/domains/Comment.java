package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@EqualsAndHashCode(callSuper = false)
@Document
public class Comment extends BaseDomain {

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String threadId;

    /**
     * The id of the user, who authored this comment.
     */
    @JsonIgnore
    String authorId;

    /**
     * Display name of the user, who authored this comment.
     */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String authorName;

    String body;

}
