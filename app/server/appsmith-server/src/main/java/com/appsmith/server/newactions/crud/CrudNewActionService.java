package com.appsmith.server.newactions.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import reactor.core.publisher.Flux;

import java.util.List;

public interface CrudNewActionService {

    Flux<NewAction> getByContextTypeAndContextIds(
            CreatorContextType contextType, List<String> contextIds, AclPermission aclPermission);
}
