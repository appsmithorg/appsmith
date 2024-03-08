package com.appsmith.external.models;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Type;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@FieldNameConstants
public class DatasourceStorageStructure extends BaseDomain {
    @JsonView(Views.Public.class)
    private String datasourceId;

    @JsonView(Views.Public.class)
    private String environmentId;

    @JsonView(Views.Internal.class)
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    private DatasourceStructure structure;
}
