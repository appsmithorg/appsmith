/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplicationImportDTO {

  Application application;

  List<Datasource> unConfiguredDatasourceList;

  Boolean isPartialImport;
}
