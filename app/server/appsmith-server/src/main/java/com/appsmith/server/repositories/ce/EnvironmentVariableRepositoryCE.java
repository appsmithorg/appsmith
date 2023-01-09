package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.EnvironmentVariable;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomEnvironmentVariableRepository;

public interface EnvironmentVariableRepositoryCE extends BaseRepository<EnvironmentVariable, String>, CustomEnvironmentVariableRepository {

}
