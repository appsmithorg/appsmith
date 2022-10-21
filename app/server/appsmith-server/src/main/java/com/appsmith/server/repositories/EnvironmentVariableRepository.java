package com.appsmith.server.repositories;

import org.springframework.stereotype.Repository;
import com.appsmith.server.repositories.ce.EnvironmentVariableRepositoryCE;

@Repository
public interface EnvironmentVariableRepository extends EnvironmentVariableRepositoryCE, CustomEnvironmentVariableRepository {

}