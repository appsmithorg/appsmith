package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.User;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

public interface CustomActionCollectionRepositoryCE extends AppsmithRepository<ActionCollection> {

    List<ActionCollection> findByApplicationId(
            String applicationId, AclPermission permission, User currentUser, Sort sort);

    List<ActionCollection> findByApplicationId(
            String applicationId, Optional<AclPermission> permission, User currentUser, Optional<Sort> sort);

    List<ActionCollection> findNonComposedByApplicationIdAndViewMode(
            String applicationId, boolean viewMode, AclPermission permission, User currentUser);

    List<ActionCollection> findByPageId(String pageId, AclPermission permission, User currentUser);

    List<ActionCollection> findByPageId(String pageId);

    Optional<ActionCollection> findByBranchNameAndBaseCollectionId(
            String branchName, String baseCollectionId, AclPermission permission, User currentUser);

    List<ActionCollection> findByPageIds(List<String> pageIds, AclPermission permission, User currentUser);

    List<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields);

    List<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, User currentUser);

    List<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, User currentUser);

    List<ActionCollection> findByPageIdAndViewMode(
            String pageId, boolean viewMode, AclPermission permission, User currentUser);

    List<ActionCollection> findAllNonComposedByPageIdAndViewMode(
            String pageId, boolean viewMode, AclPermission permission, User currentUser);

    List<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds);
}
