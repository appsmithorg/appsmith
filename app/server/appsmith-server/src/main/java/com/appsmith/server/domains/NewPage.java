package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.PageDTO;
import com.fasterxml.jackson.annotation.JsonView;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class NewPage extends BranchAwareDomain {
    @JsonView(Views.Public.class)
    String applicationId;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    @JsonView(Views.Public.class)
    PageDTO unpublishedPage;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
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
