package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
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
public class NewPage extends BaseDomain {

    @JsonView(Views.Api.class)
    String applicationId;

    @JsonView(Views.Api.class)
    PageDTO unpublishedPage;

    @JsonView(Views.Api.class)
    PageDTO publishedPage;

    public void sanitiseToExportDBObject() {
        this.setApplicationId(null);
        this.setId(null);
        if (this.getUnpublishedPage() != null) {
            this.getUnpublishedPage().sanitiseToExportDBObject();
        }
        if (this.getPublishedPage() != null) {
            this.getPublishedPage().sanitiseToExportDBObject();
        }
        this.sanitiseToExportBaseObject();
    }
}
