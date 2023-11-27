package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Action;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomActionRepositoryCE extends AppsmithRepository<Action> {

    Optional<Action> findByNameAndPageId(String name, String pageId, AclPermission aclPermission);

    List<Action> findByPageId(String pageId, AclPermission aclPermission);

    List<Action> findActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(
            Set<String> names, String pageId, String httpMethod, AclPermission aclPermission);

    List<Action> findAllActionsByNameAndPageIds(
            String name, List<String> pageIds, AclPermission aclPermission, Sort sort);
}
