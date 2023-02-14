package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ApplicationJson;
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
    private String branchName;
    private ApplicationJson applicationJson;
}
