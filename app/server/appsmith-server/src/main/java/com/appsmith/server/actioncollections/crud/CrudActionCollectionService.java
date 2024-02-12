package com.appsmith.server.actioncollections.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import reactor.core.publisher.Flux;

import java.util.List;

public interface CrudActionCollectionService {

    Flux<ActionCollection> getByContextTypeAndContextIds(
            CreatorContextType contextType, List<String> contextIds, AclPermission aclPermission);
}
