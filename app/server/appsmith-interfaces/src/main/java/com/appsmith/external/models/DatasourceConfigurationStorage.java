package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document
@AllArgsConstructor
@NoArgsConstructor
public class DatasourceConfigurationStorage extends BaseDomain{

    // TODO: add index
    @JsonView(Views.Public.class)
    String datasourceId;

    // TODO: add index
    @JsonView(Views.Public.class)
    String environmentId;

    @JsonView(Views.Public.class)
    DatasourceConfiguration datasourceConfiguration;
}
