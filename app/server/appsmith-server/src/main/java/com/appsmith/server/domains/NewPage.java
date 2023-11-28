package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.PageDTO;
import com.fasterxml.jackson.annotation.JsonView;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class NewPage extends BranchAwareDomain {
    @ManyToOne
    @JoinColumn(name = "application_id", referencedColumnName = "id")
    @JsonView(Views.Public.class)
    private Application application;

    @Column(name = "application_id", insertable = false, updatable = false)
    private String applicationId;

    @Type(JsonType.class)
    @JsonView(Views.Public.class)
    private PageDTO unpublishedPage;

    @Type(JsonType.class)
    @JsonView(Views.Public.class)
    private PageDTO publishedPage;

    @Override
    public void sanitiseToExportDBObject() {
        this.setApplication(null);
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
