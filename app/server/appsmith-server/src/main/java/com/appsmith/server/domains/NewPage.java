package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.PageDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@NoArgsConstructor
@Document
public class NewPage extends BaseDomain {

    String applicationId;

    // This field will only be used for git related functionality to sync the page object across different instances
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String gitSyncId;

    // This field will be used to store the default/root PageId for pages generated for git connected applications
    // and will be used to connect pages across the branches
    String defaultPageId;

    String branchName;

    PageDTO unpublishedPage;

    PageDTO publishedPage;
}
