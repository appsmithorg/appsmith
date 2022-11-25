package com.appsmith.server.repositories;

import com.appsmith.server.domains.Environment;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvironmentRepository extends BaseRepository<Environment, String>, CustomEnvironmentRepository {

}
