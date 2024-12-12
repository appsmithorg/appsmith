package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

public interface CustomActionCollectionRepositoryCE extends AppsmithRepository<ActionCollection> {

    List<ActionCollection> findByApplicationId(
            String applicationId, AclPermission permission, User currentUser, Sort sort, EntityManager entityManager);

    List<ActionCollection> findByApplicationId(
            String applicationId,
            Optional<AclPermission> permission,
            User currentUser,
            Optional<Sort> sort,
            EntityManager entityManager);

    List<ActionCollection> findNonComposedByApplicationIdAndViewMode(
            String applicationId,
            boolean viewMode,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    List<ActionCollection> findByPageId(
            String pageId, AclPermission permission, User currentUser, EntityManager entityManager);

    List<ActionCollection> findByPageId(String pageId, EntityManager entityManager);

    Optional<ActionCollection> findByBranchNameAndBaseCollectionId(
            String branchName,
            String baseCollectionId,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    List<ActionCollection> findByPageIds(
            List<String> pageIds, AclPermission permission, User currentUser, EntityManager entityManager);

    List<ActionCollection> findAllByApplicationIds(
            List<String> applicationIds, List<String> includeFields, EntityManager entityManager);

    List<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    List<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    List<ActionCollection> findByPageIdAndViewMode(
            String pageId, boolean viewMode, AclPermission permission, User currentUser, EntityManager entityManager);

    List<ActionCollection> findAllNonComposedByPageIdAndViewMode(
            String pageId, boolean viewMode, AclPermission permission, User currentUser, EntityManager entityManager);
}
