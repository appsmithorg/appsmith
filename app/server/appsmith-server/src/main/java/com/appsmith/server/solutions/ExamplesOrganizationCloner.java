package com.appsmith.server.solutions;

import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PageRepository;
import com.appsmith.server.services.ActionService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Map;

@Slf4j
@Component
public class ExamplesOrganizationCloner {

    private final OrganizationService organizationService;
    private final OrganizationRepository organizationRepository;
    private final DatasourceService datasourceService;
    private final ApplicationService applicationService;
    private final PageRepository pageRepository;
    private final PageService pageService;
    private final ActionService actionService;
    private final DatasourceRepository datasourceRepository;
    private final ApplicationRepository applicationRepository;
    private final ActionRepository actionRepository;

    @Autowired
    public ExamplesOrganizationCloner(
            OrganizationService organizationService,
            OrganizationRepository organizationRepository,
            DatasourceService datasourceService,
            ApplicationService applicationService,
            PageRepository pageRepository,
            PageService pageService,
            ActionService actionService,
            DatasourceRepository datasourceRepository,
            ApplicationRepository applicationRepository,
            ActionRepository actionRepository) {
        this.organizationService = organizationService;
        this.organizationRepository = organizationRepository;
        this.datasourceService = datasourceService;
        this.applicationService = applicationService;
        this.pageRepository = pageRepository;
        this.pageService = pageService;
        this.actionService = actionService;
        this.datasourceRepository = datasourceRepository;
        this.applicationRepository = applicationRepository;
        this.actionRepository = actionRepository;
    }

    public Mono<Void> cloneExamplesOrganization(Mono<User> userMono) {
        final String templateOrganizationId = "5e6f64390019e73639e99675";

        return userMono
                .zipWith(organizationRepository.findById(templateOrganizationId))
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    final Organization organization = tuple.getT2();
                    organization.setId(null);
                    organization.setName(user.getName().split(" ", 2)[0]);
                    organization.setSlug(null);
                    return organizationService.create(organization, user);
                })
                .flatMap(newOrganization -> {
                    final Mono<Map<String, Datasource>> datasourceCloner = datasourceRepository
                            .findAllByOrganizationId(templateOrganizationId)
                            .flatMap(datasource -> {
                                final String templateDatasourceId = datasource.getId();
                                if (templateDatasourceId == null) {
                                    return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND));
                                }
                                datasource.setId(null);
                                datasource.setOrganizationId(newOrganization.getId());
                                return Mono.zip(
                                        Mono.just(templateDatasourceId),
                                        datasourceService.create(datasource)
                                );
                            })
                            .collectMap(Tuple2::getT1, Tuple2::getT2)
                            .cache();

                    return applicationRepository
                            .findByOrganizationId(templateOrganizationId)
                            .flatMap(application -> {
                                final String templateApplicationId = application.getId();
                                application.setId(null);
                                application.setOrganizationId(newOrganization.getId());
                                return Mono.zip(
                                        Mono.just(pageRepository.findByApplicationId(templateApplicationId)),
                                        applicationService.create(application)
                                );
                            })
                            .flatMap(tuple1 -> {
                                final Flux<Page> pageFlux = tuple1.getT1();
                                final Application newApplication = tuple1.getT2();
                                return pageFlux
                                        .flatMap(page -> {
                                            final String templatePageId = page.getId();
                                            page.setId(null);
                                            page.setApplicationId(newApplication.getId());
                                            return Mono.zip(
                                                    Mono.just(actionRepository.findByPageId(templatePageId)),
                                                    pageService.create(page),
                                                    datasourceCloner
                                            );
                                        })
                                        .flatMap(tuple2 -> {
                                            final Flux<Action> actionFlux = tuple2.getT1();
                                            final Page newPage = tuple2.getT2();
                                            final Map<String, Datasource> newDatasourcesByTemplateId = tuple2.getT3();
                                            return actionFlux
                                                    .filter(action -> newDatasourcesByTemplateId.containsKey(action.getDatasource().getId()))
                                                    .flatMap(action -> {
                                                        action.setId(null);
                                                        action.setPageId(newPage.getId());
                                                        action.setOrganizationId(newOrganization.getId());
                                                        action.setCollectionId(null);
                                                        action.setDatasource(newDatasourcesByTemplateId.get(action.getDatasource().getId()));
                                                        return actionService.create(action);
                                                    });
                                        });
                            })
                            .then();
                });
    }

}
