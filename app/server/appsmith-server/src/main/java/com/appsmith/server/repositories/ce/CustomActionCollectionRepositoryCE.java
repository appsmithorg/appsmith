package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

public interface CustomActionCollectionRepositoryCE extends AppsmithRepository<ActionCollection> {

    List<ActionCollection> findByApplicationId(
            String applicationId, Sort sort, AclPermission permission, User currentUser);

    List<ActionCollection> findByApplicationId(
            String applicationId, Optional<Sort> sort, Optional<AclPermission> permission, User currentUser);

    List<ActionCollection> findByApplicationIdAndViewMode(
            String applicationId, boolean viewMode, AclPermission permission, User currentUser);

    List<ActionCollection> findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
            String name,
            List<String> pageIds,
            boolean viewMode,
            String branchName,
            Sort sort,
            AclPermission permission,
            User currentUser);

    List<ActionCollection> findByPageId(String pageId, AclPermission permission, User currentUser);

    List<ActionCollection> findByPageId(String pageId);

    Optional<ActionCollection> findByBranchNameAndDefaultCollectionId(
            String branchName, String defaultCollectionId, AclPermission permission, User currentUser);

    List<ActionCollection> findByDefaultApplicationId(
            String defaultApplicationId, AclPermission permission, User currentUser);

    List<ActionCollection> findByPageIds(List<String> pageIds, AclPermission permission, User currentUser);

    List<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields);

    List<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, User currentUser);

    List<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, User currentUser);

    List<ActionCollection> findByPageIdAndViewMode(
            String pageId, boolean viewMode, AclPermission permission, User currentUser);
}
