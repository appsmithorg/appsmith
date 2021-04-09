package com.appsmith.server.repositories;

import com.appsmith.server.domains.Datasource;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface DatasourceRepository extends BaseRepository<Datasource, String>, CustomDatasourceRepository {

    Flux<Datasource> findByIdIn(List<String> ids);

    Flux<Datasource> findAllByOrganizationId(String organizationId);

}
