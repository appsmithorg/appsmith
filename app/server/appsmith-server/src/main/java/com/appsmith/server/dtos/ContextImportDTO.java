package com.appsmith.server.dtos;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.ImportableContext;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ContextImportDTO {

    ImportableContext importableContext;

    List<Datasource> unConfiguredDatasourceList;

    Boolean isPartialImport;
}
