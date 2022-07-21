package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.NewActionRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface NewActionRepository extends NewActionRepositoryCE, CustomNewActionRepository {

}
