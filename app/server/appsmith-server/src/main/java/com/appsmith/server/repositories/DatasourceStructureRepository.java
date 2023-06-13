/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.DatasourceStructureRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface DatasourceStructureRepository
        extends DatasourceStructureRepositoryCE, CustomDatasourceStructureRepository {}
