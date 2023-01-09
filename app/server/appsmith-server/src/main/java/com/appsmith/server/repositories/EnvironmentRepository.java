package com.appsmith.server.repositories;

import com.appsmith.external.models.Environment;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvironmentRepository extends BaseRepository<Environment, String>, CustomEnvironmentRepository {

}
