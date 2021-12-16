package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.ActionRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface ActionRepository extends ActionRepositoryCE, CustomActionRepository {

}
