package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.NewPageRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface NewPageRepository extends NewPageRepositoryCE, CustomNewPageRepository {

}
