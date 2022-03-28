package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.ConfigRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface ConfigRepository extends ConfigRepositoryCE, CustomConfigRepository {

}
