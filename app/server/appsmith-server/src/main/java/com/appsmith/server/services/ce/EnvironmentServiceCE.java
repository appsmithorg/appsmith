package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Environment;
import com.appsmith.server.dtos.EnvironmentDTO;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface EnvironmentServiceCE extends CrudService<Environment, String> {

}
