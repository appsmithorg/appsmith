/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.PageDTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@NoArgsConstructor
@Document
public class NewPage extends BranchAwareDomain {
    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Public.class)
    PageDTO unpublishedPage;

    @JsonView(Views.Public.class)
    PageDTO publishedPage;

    @Override
    public void sanitiseToExportDBObject() {
        this.setApplicationId(null);
        this.setId(null);
        if (this.getUnpublishedPage() != null) {
            this.getUnpublishedPage().sanitiseToExportDBObject();
        }
        if (this.getPublishedPage() != null) {
            this.getPublishedPage().sanitiseToExportDBObject();
        }
        super.sanitiseToExportDBObject();
    }
}
