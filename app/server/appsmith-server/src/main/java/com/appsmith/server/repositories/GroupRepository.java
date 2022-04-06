package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.GroupRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupRepository extends GroupRepositoryCE, CustomGroupRepository {

}
