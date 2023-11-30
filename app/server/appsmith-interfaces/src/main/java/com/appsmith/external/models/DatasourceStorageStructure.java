package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class DatasourceStorageStructure extends BaseDomain {
    @JsonView(Views.Public.class)
    private String datasourceId;

    @JsonView(Views.Public.class)
    private String environmentId;

    @JsonView(Views.Internal.class)
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private DatasourceStructure structure;
}
