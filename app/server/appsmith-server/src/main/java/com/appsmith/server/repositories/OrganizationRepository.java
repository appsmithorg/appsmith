package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.OrganizationRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationRepository extends OrganizationRepositoryCE, CustomOrganizationRepository {

}
