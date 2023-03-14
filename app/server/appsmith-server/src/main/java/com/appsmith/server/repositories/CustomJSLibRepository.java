package com.appsmith.server.repositories;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.repositories.ce.CustomJSLibRepositoryCE;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomJSLibRepository extends CustomJSLibRepositoryCE, BaseRepository<CustomJSLib, String> {
}
