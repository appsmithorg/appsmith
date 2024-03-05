package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document
@FieldNameConstants
public class DatasourceStorageStructure extends BaseDomain {
    @JsonView(Views.Public.class)
    private String datasourceId;

    @JsonView(Views.Public.class)
    private String environmentId;

    @JsonView(Views.Internal.class)
    private DatasourceStructure structure;
}
