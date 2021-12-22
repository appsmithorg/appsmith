package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.DatasourceRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface DatasourceRepository extends DatasourceRepositoryCE, CustomDatasourceRepository {

}
