package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationPlugin;
import com.appsmith.server.domains.OrganizationSetting;
import com.appsmith.server.domains.Setting;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.OrganizationPluginStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_ORGANIZATIONS;

@Slf4j
@Service
public class OrganizationServiceImpl extends BaseService<OrganizationRepository, Organization, String> implements OrganizationService {

    private final OrganizationRepository repository;
    private final SettingService settingService;
    private final GroupService groupService;
    private final PluginRepository pluginRepository;
    private final SessionUserService sessionUserService;
    private final UserOrganizationService userOrganizationService;
    private final PolicyGenerator policyGenerator;

    @Autowired
    public OrganizationServiceImpl(Scheduler scheduler,
                                   Validator validator,
                                   MongoConverter mongoConverter,
                                   ReactiveMongoTemplate reactiveMongoTemplate,
                                   OrganizationRepository repository,
                                   SettingService settingService,
                                   AnalyticsService analyticsService,
                                   GroupService groupService,
                                   PluginRepository pluginRepository,
                                   SessionUserService sessionUserService,
                                   UserOrganizationService userOrganizationService,
                                   PolicyGenerator policyGenerator) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.settingService = settingService;
        this.groupService = groupService;
        this.pluginRepository = pluginRepository;
        this.sessionUserService = sessionUserService;
        this.userOrganizationService = userOrganizationService;
        this.policyGenerator = policyGenerator;
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
        return repository.countSlugsByPrefix(initialSlug)
                .map(max -> initialSlug + (max == 0 ? "" : (max + 1)));
    }

    private Set<Policy> crudOrgPolicy(User user) {
        Set<Policy> policySet = user.getPolicies().stream()
                .filter(policy ->
                        policy.getPermission().equals(USER_MANAGE_ORGANIZATIONS.getValue())
                ).collect(Collectors.toSet());

        return policyGenerator.getAllChildPolicies(user, policySet, User.class);
    }

    /**
     * This function does the following:
     * 1. Creates the organization for the user
     * 2. Installs all default plugins for the organization
     * 3. Creates default groups for the organization
     * 4. Adds the user to the newly created organization
     * 5. Assigns the default groups to the user creating the organization
     *
     * @param organization
     * @param user
     * @return
     */
    public Mono<Organization> create(Organization organization, User user) {
        if (organization == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION));
        }

        // Does the user have permissions to create an organization?
        boolean isManageOrgPolicyPresent = user.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(USER_MANAGE_ORGANIZATIONS.getValue()))
                .findFirst()
                .isPresent();

        if (!isManageOrgPolicyPresent) {
            return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
        }

        // Set the admin policies for this organization & user
        organization.setPolicies(crudOrgPolicy(user));

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

        Mono<Organization> organizationMono = setSlugMono
                .flatMap(this::validateObject)
                //transform the organization data to embed setting object in each object in organizationSetting list.
                .flatMap(this::enhanceOrganizationSettingList)
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
                //Call the BaseService function to save the updated organization
                .flatMap(super::create)
                .flatMap(savedOrganization -> userOrganizationService
                        .addUserToOrganization(savedOrganization.getId(), user)
                        .thenReturn(savedOrganization));

        return organizationMono
                .flatMap(org -> groupService.createDefaultGroupsForOrg(org.getId())
                        // Get only the group ids of the default groups to assign them to the user
                        .map(group -> group.getId())
                        .collect(Collectors.toSet())
                        .flatMap(groupIds -> {
                            // Set the default group Ids for the user
                            // Append the new organization's default groups to the existing ones belonging to the user
                            user.getGroupIds().addAll(groupIds);
                            // At this point the organization have been saved and the user has been added to the org.
                            // Now add the newly created organization to the newly created user.
                            return userOrganizationService.saveUser(user);
                        })
                        .thenReturn(org)
                );
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
                .flatMap(user -> create(organization, user));
    }

    private Mono<Organization> enhanceOrganizationSettingList(Organization organization) {

        if (organization.getOrganizationSettings() == null) {
            organization.setOrganizationSettings(new ArrayList<>());
        }

        Flux<OrganizationSetting> organizationSettingFlux = Flux.fromIterable(organization.getOrganizationSettings());
        // For each organization setting, fetch and embed the setting, and once all the organization setting are done, collect it
        // back into a single list of organization settings.
        Mono<List<OrganizationSetting>> listMono = organizationSettingFlux.flatMap(this::fetchAndEmbedSetting).collectList();
        return listMono.map(list -> {
            organization.setOrganizationSettings(list);
            return list;
        }).thenReturn(organization);
    }

    private Mono<OrganizationSetting> fetchAndEmbedSetting(OrganizationSetting organizationSetting) {

        String key = organizationSetting.getSetting().getKey();
        Mono<Setting> setting = settingService.getByKey(key);
        return setting.map(setting1 -> {
            organizationSetting.setSetting(setting1);
            return organizationSetting;
        });
    }

    @Override
    public Mono<Organization> update(String id, Organization resource) {
        return repository.updateById(id, resource, MANAGE_ORGANIZATIONS)
                .flatMap(updatedObj -> analyticsService.sendEvent(AnalyticsEvents.UPDATE + "_" + updatedObj.getClass().getSimpleName().toUpperCase(), updatedObj));
    }

    @Override
    public Mono<Organization> findById(String id) {
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
        return repository.findByIdAndPluginsPluginId(organizationId, pluginId, AclPermission.READ_ORGANIZATIONS);
    }

    @Override
    public Flux<Organization> findByIdsIn(Set<String> ids, AclPermission permission) {
        return repository.findByIdsIn(ids, permission);
    }

}

