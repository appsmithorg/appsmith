package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.helpers.DateUtils;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * This stores a snapshot of an application.
 */
@Getter
@Setter
@NoArgsConstructor
@Document
public class ApplicationSnapshot extends BaseDomain {
    private String applicationId;
    private ApplicationJson applicationJson;

    /**
     * Adding this method as updatedAt field in BaseDomain is annotated with @JsonIgnore
     * @return Updated at timestamp in ISO format
     */
    public String getUpdatedTime() {
        return DateUtils.ISO_FORMATTER.format(this.getUpdatedAt());
    }
}
