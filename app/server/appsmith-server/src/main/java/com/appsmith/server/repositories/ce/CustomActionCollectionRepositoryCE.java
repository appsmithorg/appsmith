package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;

public interface CustomActionCollectionRepositoryCE extends AppsmithRepository<ActionCollection> {

    List<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort);

    List<ActionCollection> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort);

    List<ActionCollection> findByApplicationIdAndViewMode(
            String applicationId, boolean viewMode, AclPermission aclPermission);

    List<ActionCollection> findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
            String name,
            List<String> pageIds,
            boolean viewMode,
            String branchName,
            AclPermission aclPermission,
            Sort sort);

    List<ActionCollection> findByPageId(String pageId, AclPermission permission);

    List<ActionCollection> findByPageId(String pageId);

    Optional<ActionCollection> findByBranchNameAndDefaultCollectionId(
            String branchName, String defaultCollectionId, AclPermission permission);

    List<ActionCollection> findByDefaultApplicationId(String defaultApplicationId, AclPermission permission);

    List<ActionCollection> findByPageIds(List<String> pageIds, AclPermission permission);

    List<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields);

    List<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission);

    List<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission);

    List<ActionCollection> findByPageIdAndViewMode(String pageId, boolean viewMode, AclPermission permission);

    Optional<Integer> updateById(String id, BridgeUpdate updateObj);
}
