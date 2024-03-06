package com.appsmith.server.actioncollections.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.ActionCollectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class CrudActionCollectionServiceImpl implements CrudActionCollectionService {

    private final ActionCollectionRepository repository;

    @Override
    public Flux<ActionCollection> getByContextTypeAndContextIds(
            CreatorContextType contextType, List<String> contextIds, AclPermission aclPermission) {
        if (CreatorContextType.MODULE.equals(contextType)) {
            return repository.findAllByModuleIds(contextIds, Optional.ofNullable(aclPermission));
        } else if (CreatorContextType.PAGE.equals(contextType)) {
            return repository.findByPageIds(contextIds, aclPermission);
        } else {
            return Flux.empty();
        }
    }
}
