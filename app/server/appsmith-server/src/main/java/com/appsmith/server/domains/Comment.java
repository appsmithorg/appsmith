package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@EqualsAndHashCode(callSuper = false)
@Document
public class Comment extends BaseDomain {

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String authorName;

    String body;

    // TODO: Can we infer this from the widget/entity this comment is connected to?
    String applicationId;

}
