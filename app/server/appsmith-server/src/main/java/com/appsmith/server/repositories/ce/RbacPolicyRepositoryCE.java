package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.RbacPolicy;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomRbacPolicyRepository;

public interface RbacPolicyRepositoryCE extends BaseRepository<RbacPolicy, String>, CustomRbacPolicyRepository {

}
