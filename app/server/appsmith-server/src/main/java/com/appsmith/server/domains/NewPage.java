package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.PageDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonView(Views.Export.class)
    @JsonProperty("page")
    public PageDTO getPublishedPage() {
        return publishedPage;
    }

    @JsonView(Views.ImportPublished.class)
    @JsonProperty("page")
    public void setPublishedPage(PageDTO page) {
        this.publishedPage = page;
    }

    @JsonView(Views.ImportUnpublished.class)
    @JsonProperty("page")
    public void setUnpublishedPage(PageDTO page) {
        this.unpublishedPage = page;
    }
}
