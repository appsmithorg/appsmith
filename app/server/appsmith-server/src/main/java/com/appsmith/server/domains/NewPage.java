package com.appsmith.server.domains;

import org.springframework.data.mongodb.core.mapping.Document;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.dtos.PageDTO;
import com.fasterxml.jackson.annotation.JsonView;
import com.appsmith.server.interfaces.PublishableResource;
import com.appsmith.server.serializers.ExportSerializer;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Document
@JsonSerialize(using = NewPageSerializer.class)
public class NewPage extends BranchAwareDomain implements PublishableResource {

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

    @JsonView(Views.Import.class)
    @JsonProperty("page")
    public void setUnpublishedPage(PageDTO page) {
        this.unpublishedPage = page;
    }

    @Override
    public PageDTO select(ResourceModes mode) {
        switch(mode) {
            case EDIT: {
                return unpublishedPage;
            }
            case VIEW: {
                return publishedPage;
            }
            default: {
                throw new RuntimeException("Invalid mode");
            }
        }
    }
}

class NewPageSerializer extends ExportSerializer<NewPage> {

    public NewPageSerializer() {
        super(NewPage.class, "page");
    }
}