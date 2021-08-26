package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.PageDTO;
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

    // This field will only be used for git related functionality to sync the page object across different instances.
    // Once created no-one has access to update this field
    String gitSyncId;

    PageDTO unpublishedPage;

    PageDTO publishedPage;
}
