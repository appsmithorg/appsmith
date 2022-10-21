package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.EnvironmentRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvironmentRepository extends EnvironmentRepositoryCE, CustomEnvironmentRepository {

}