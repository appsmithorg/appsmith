package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.constants.Constraint;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationPlugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.OrganizationPluginStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_ORGANIZATIONS;

@Slf4j
@Service
public class OrganizationServiceImpl extends BaseService<OrganizationRepository, Organization, String> implements OrganizationService {

    private final PluginRepository pluginRepository;
    private final SessionUserService sessionUserService;
    private final UserOrganizationService userOrganizationService;
    private final UserRepository userRepository;
    private final RoleGraph roleGraph;
    private final AssetRepository assetRepository;
    private final AssetService assetService;

    @Autowired
    public OrganizationServiceImpl(Scheduler scheduler,
                                   Validator validator,
                                   MongoConverter mongoConverter,
                                   ReactiveMongoTemplate reactiveMongoTemplate,
                                   OrganizationRepository repository,
                                   AnalyticsService analyticsService,
                                   PluginRepository pluginRepository,
                                   SessionUserService sessionUserService,
                                   UserOrganizationService userOrganizationService,
                                   UserRepository userRepository,
                                   RoleGraph roleGraph,
                                   AssetRepository assetRepository,
                                   AssetService assetService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.pluginRepository = pluginRepository;
        this.sessionUserService = sessionUserService;
        this.userOrganizationService = userOrganizationService;
        this.userRepository = userRepository;
        this.roleGraph = roleGraph;
        this.assetRepository = assetRepository;
        this.assetService = assetService;
    }

    @Override
    public Flux<Organization> get(MultiValueMap<String, String> params) {
        return sessionUserService.getCurrentUser()
                .flatMapMany(user -> {
                    Set<String> organizationIds = user.getOrganizationIds();
                    if (organizationIds == null || organizationIds.isEmpty()) {
                        log.error("No organization set for user: {}. Returning empty list of organizations", user.getEmail());
                        return Flux.empty();
                    }
                    return repository.findAllById(organizationIds);
                });
    }

    @Override
    public Mono<Organization> getBySlug(String slug) {
        return repository.findBySlug(slug);
    }

    @Override
    public Mono<String> getNextUniqueSlug(String initialSlug) {
        return repository.nextSlugNumber(initialSlug)
                .map(number -> initialSlug + (number == 0 ? "" : number));
    }

    /**
     * Creates the given organization as a default organization for the given user. That is, the organization's name
     * is changed to "[username]'s apps" and then created. The current value of the organization name
     * is discarded.
     *
     * @param organization Organization object to be created.
     * @param user         User to whom this organization will belong to, as a default organization.
     * @return Publishes the saved organization.
     */
    @Override
    public Mono<Organization> createDefault(final Organization organization, User user) {
        organization.setName(user.computeFirstName() + "'s apps");
        return create(organization, user);
    }

    /**
     * This function does the following:
     * 1. Creates the organization for the user
     * 2. Installs all default plugins for the organization
     * 3. Creates default groups for the organization
     * 4. Adds the user to the newly created organization
     * 5. Assigns the default groups to the user creating the organization
     *
     * @param organization Organization object to be created.
     * @param user         User to whom this organization will belong to.
     * @return Publishes the saved organization.
     */
    @Override
    public Mono<Organization> create(Organization organization, User user) {
        if (organization == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION));
        }

        // Does the user have permissions to create an organization?
        boolean isManageOrgPolicyPresent = user.getPolicies().stream()
                .anyMatch(policy -> policy.getPermission().equals(USER_MANAGE_ORGANIZATIONS.getValue()));

        if (!isManageOrgPolicyPresent) {
            return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Create organization"));
        }

        if (organization.getEmail() == null) {
            organization.setEmail(user.getEmail());
        }

        Mono<Organization> setSlugMono;
        if (organization.getName() == null) {
            setSlugMono = Mono.just(organization);
        } else {
            setSlugMono = getNextUniqueSlug(organization.makeSlug())
                    .map(slug -> {
                        organization.setSlug(slug);
                        return organization;
                    });
        }

        return setSlugMono
                .flatMap(this::validateObject)
                // Install all the default plugins when the org is created
                /* TODO: This is a hack. We should ideally use the pluginService.installPlugin() function.
                    Not using it right now because of circular dependency b/w organizationService and pluginService
                    Also, since all our deployments are single node, this logic will still work
                 */
                .flatMap(org -> pluginRepository.findByDefaultInstall(true)
                        .map(obj -> new OrganizationPlugin(obj.getId(), OrganizationPluginStatus.FREE))
                        .collectList()
                        .map(pluginList -> {
                            org.setPlugins(pluginList);
                            return org;
                        }))
                // Save the organization in the db
                .flatMap(repository::save)
                // Set the current user as admin for the organization
                .flatMap(createdOrg -> {
                    UserRole userRole = new UserRole();
                    userRole.setUsername(user.getUsername());
                    userRole.setUserId(user.getId());
                    userRole.setName(user.getName());
                    userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
                    return userOrganizationService.addUserToOrganizationGivenUserObject(createdOrg, user, userRole);
                })
                // Now add the org id to the user object and then return the saved org
                .flatMap(savedOrganization -> userOrganizationService
                        .addUserToOrganization(savedOrganization.getId(), user)
                        .thenReturn(savedOrganization));
    }

    /**
     * Create organization needs to first fetch and embed Setting object in OrganizationSetting
     * for any settings that may have diverged from the default values. Once the
     * settings have been embedded in all the organization settings, the library
     * function is called to store the enhanced organization object back in the organization object.
     */
    @Override
    public Mono<Organization> create(Organization organization) {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> userRepository.findByEmail(user.getUsername(), READ_USERS))
                .flatMap(user -> create(organization, user));
    }

    @Override
    public Mono<Organization> update(String id, Organization resource) {
        return repository.updateById(id, resource, MANAGE_ORGANIZATIONS)
                .flatMap(analyticsService::sendUpdateEvent);
    }

    @Override
    public Mono<Organization> getById(String id) {
        return findById(id, AclPermission.READ_ORGANIZATIONS);
    }

    @Override
    public Mono<Organization> findById(String id, AclPermission permission) {
        return repository.findById(id, permission);
    }

    @Override
    public Mono<Organization> save(Organization organization) {
        return repository.save(organization);
    }

    @Override
    public Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId) {
        return repository.findByIdAndPluginsPluginId(organizationId, pluginId);
    }

    @Override
    public Flux<Organization> findByIdsIn(Set<String> ids, AclPermission permission) {
        Sort sort = Sort.by(FieldName.NAME);

        return repository.findByIdsIn(ids, permission, sort);
    }

    @Override
    public Mono<Map<String, String>> getUserRolesForOrganization(String orgId) {
        if (orgId == null || orgId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
        }

        Mono<Organization> organizationMono = repository.findById(orgId, ORGANIZATION_INVITE_USERS);
        Mono<String> usernameMono = sessionUserService
                .getCurrentUser()
                .map(User::getUsername);

        return organizationMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, orgId)))
                .zipWith(usernameMono)
                .flatMap(tuple -> {
                    Organization organization = tuple.getT1();
                    String username = tuple.getT2();

                    List<UserRole> userRoles = organization.getUserRoles();
                    if (userRoles == null || userRoles.isEmpty()) {
                        return Mono.empty();
                    }

                    Optional<UserRole> optionalUserRole = userRoles.stream().filter(role -> role.getUsername().equals(username)).findFirst();
                    if (!optionalUserRole.isPresent()) {
                        return Mono.empty();
                    }

                    UserRole currentUserRole = optionalUserRole.get();
                    String roleName = currentUserRole.getRoleName();

                    Set<AppsmithRole> appsmithRoles = roleGraph.generateHierarchicalRoles(roleName);

                    final Map<String, String> appsmithRolesMap = new LinkedHashMap<>();
                    for (final AppsmithRole role : appsmithRoles) {
                        appsmithRolesMap.put(role.getName(), role.getDescription());
                    }

                    return Mono.just(appsmithRolesMap);
                });
    }

    @Override
    public Mono<List<UserRole>> getOrganizationMembers(String orgId) {
        return repository
                .findById(orgId, ORGANIZATION_INVITE_USERS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, orgId)))
                .map(organization -> {
                    final List<UserRole> userRoles = organization.getUserRoles();
                    return CollectionUtils.isEmpty(userRoles) ? Collections.emptyList() : userRoles;
                });
    }

    @Override
    public Mono<Organization> uploadLogo(String organizationId, Part filePart) {
        final Mono<Organization> findOrganizationMono = repository.findById(organizationId, MANAGE_ORGANIZATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, organizationId)));

        // We don't execute the upload Mono if we don't find the organization.
        final Mono<Asset> uploadAssetMono = assetService.upload(filePart, Constraint.ORGANIZATION_LOGO_SIZE_KB);

        return findOrganizationMono
                .flatMap(organization -> Mono.zip(Mono.just(organization), uploadAssetMono))
                .flatMap(tuple -> {
                    final Organization organization = tuple.getT1();
                    final Asset uploadedAsset = tuple.getT2();
                    final String prevAssetId = organization.getLogoAssetId();

                    organization.setLogoAssetId(uploadedAsset.getId());
                    return repository.save(organization)
                            .flatMap(savedOrganization -> {
                                if (StringUtils.isEmpty(prevAssetId)) {
                                    return Mono.just(savedOrganization);
                                } else {
                                    return assetService.remove(prevAssetId).thenReturn(savedOrganization);
                                }
                            });
                });
    }

    @Override
    public Mono<Organization> deleteLogo(String organizationId) {
        return repository
                .findById(organizationId, MANAGE_ORGANIZATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, organizationId)))
                .flatMap(organization -> {
                    final String prevAssetId = organization.getLogoAssetId();
                    if(prevAssetId == null) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ASSET, prevAssetId));
                    }
                    organization.setLogoAssetId(null);
                    return assetRepository.findById(prevAssetId)
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ASSET, prevAssetId)))
                            .flatMap(asset -> assetRepository.delete(asset).thenReturn(asset))
                            .flatMap(analyticsService::sendDeleteEvent)
                            .then(repository.save(organization));
                });
    }

}
