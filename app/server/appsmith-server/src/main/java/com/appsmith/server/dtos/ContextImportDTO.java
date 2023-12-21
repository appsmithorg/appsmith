package com.appsmith.server.dtos;

import com.appsmith.external.models.Datasource;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ContextImportDTO<T> {

    T importableContext;

    List<Datasource> unConfiguredDatasourceList;

    Boolean isPartialImport;
}
