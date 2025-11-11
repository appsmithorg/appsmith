package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationDatasourceUsageDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageDatasourceUsageDTO;
import com.appsmith.server.dtos.QueryUsageDTO;
import com.appsmith.server.dtos.WorkspaceDatasourceUsageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkspaceDatasourceUsageServiceCEImpl implements WorkspaceDatasourceUsageServiceCE {

    private final WorkspaceService workspaceService;
    private final DatasourceService datasourceService;
    private final NewActionService newActionService;
    private final NewPageService newPageService;
    private final ApplicationService applicationService;
    private final WorkspacePermission workspacePermission;
    private final DatasourcePermission datasourcePermission;
    private final ActionPermission actionPermission;
    private final ApplicationPermission applicationPermission;

    @Override
    public Mono<List<WorkspaceDatasourceUsageDTO>> getDatasourceUsage(String workspaceId) {
        if (!StringUtils.hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        Mono<Workspace> workspaceMono = workspaceService
                .findById(workspaceId, workspacePermission.getReadPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

        Mono<List<Datasource>> datasourcesMono = datasourceService
                .getAllByWorkspaceIdWithStorages(workspaceId, datasourcePermission.getReadPermission())
                .collectList();

        Mono<List<NewAction>> actionsMono = newActionService
                .findByWorkspaceId(workspaceId, actionPermission.getReadPermission())
                .collectList();

        Mono<List<Application>> applicationsMono = applicationService
                .findByWorkspaceId(workspaceId, applicationPermission.getReadPermission())
                .collectList();

        return Mono.zip(workspaceMono, datasourcesMono, actionsMono, applicationsMono)
                .flatMap(tuple -> loadPageNamesByApplication(tuple.getT4())
                        .map(pageNamesById -> buildUsage(tuple.getT2(), tuple.getT3(), tuple.getT4(), pageNamesById)))
                .map(this::sortUsage);
    }

    private Mono<Map<String, String>> loadPageNamesByApplication(List<Application> applications) {
        if (applications == null || applications.isEmpty()) {
            return Mono.just(Collections.emptyMap());
        }

        Set<String> applicationIds = applications.stream()
                .map(Application::getId)
                .filter(StringUtils::hasText)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (applicationIds.isEmpty()) {
            return Mono.just(Collections.emptyMap());
        }

        List<String> includedFields = new ArrayList<>();
        includedFields.add(NewPage.Fields.id);
        includedFields.add(NewPage.Fields.baseId);
        includedFields.add(NewPage.Fields.applicationId);
        includedFields.add(NewPage.Fields.unpublishedPage_name);
        includedFields.add(NewPage.Fields.unpublishedPage_slug);
        includedFields.add(NewPage.Fields.publishedPage_name);
        includedFields.add(NewPage.Fields.publishedPage_slug);

        return newPageService
                .findAllByApplicationIds(new ArrayList<>(applicationIds), includedFields)
                .collectList()
                .map(this::buildPageNameMap);
    }

    private Map<String, String> buildPageNameMap(List<NewPage> pages) {
        if (pages == null || pages.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, String> pageNames = new HashMap<>();

        for (NewPage page : pages) {
            if (page == null) {
                continue;
            }

            String displayName = determinePageDisplayName(page);
            if (!StringUtils.hasText(displayName)) {
                continue;
            }

            registerPageName(pageNames, page.getId(), displayName);
            registerPageName(pageNames, page.getBaseId(), displayName);

            PageDTO unpublished = page.getUnpublishedPage();
            if (unpublished != null) {
                registerPageName(pageNames, unpublished.getId(), displayName);
                registerPageName(pageNames, unpublished.getBaseId(), displayName);
            }

            PageDTO published = page.getPublishedPage();
            if (published != null) {
                registerPageName(pageNames, published.getId(), displayName);
                registerPageName(pageNames, published.getBaseId(), displayName);
            }
        }

        return pageNames;
    }

    private String determinePageDisplayName(NewPage page) {
        if (page == null) {
            return null;
        }

        PageDTO unpublished = page.getUnpublishedPage();
        if (unpublished != null) {
            if (StringUtils.hasText(unpublished.getName())) {
                return unpublished.getName();
            }
            if (StringUtils.hasText(unpublished.getSlug())) {
                return unpublished.getSlug();
            }
        }

        PageDTO published = page.getPublishedPage();
        if (published != null) {
            if (StringUtils.hasText(published.getName())) {
                return published.getName();
            }
            if (StringUtils.hasText(published.getSlug())) {
                return published.getSlug();
            }
        }

        return null;
    }

    private void registerPageName(Map<String, String> pageNames, String key, String displayName) {
        if (pageNames == null) {
            return;
        }
        if (StringUtils.hasText(key) && StringUtils.hasText(displayName)) {
            pageNames.putIfAbsent(key, displayName);
        }
    }

    private List<WorkspaceDatasourceUsageDTO> buildUsage(
            List<Datasource> datasources,
            List<NewAction> actions,
            List<Application> applications,
            Map<String, String> pageNamesById) {

        if (actions.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, Datasource> datasourceById = datasources.stream()
                .filter(ds -> StringUtils.hasText(ds.getId()))
                .collect(Collectors.toMap(
                        Datasource::getId, datasource -> datasource, (left, right) -> left, LinkedHashMap::new));

        if (datasourceById.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, String> applicationNames = applications.stream()
                .filter(application -> StringUtils.hasText(application.getId()))
                .collect(Collectors.toMap(Application::getId, Application::getName, (left, right) -> left));

        Map<String, DatasourceUsageAccumulator> usageMap = new LinkedHashMap<>();
        Map<String, List<ApplicationPage>> pagesByApplicationId = applications.stream()
                .filter(app -> app.getPages() != null)
                .collect(Collectors.toMap(
                        Application::getId,
                        Application::getPages,
                        (existing, duplicate) -> existing,
                        LinkedHashMap::new));

        for (NewAction action : actions) {
            ActionDTO actionDTO = getRelevantActionDTO(action);
            if (actionDTO == null) {
                continue;
            }

            Datasource datasourceRef = actionDTO.getDatasource();
            if (datasourceRef == null || !StringUtils.hasText(datasourceRef.getId())) {
                continue;
            }

            Datasource datasource = datasourceById.get(datasourceRef.getId());
            if (datasource == null) {
                continue;
            }

            String applicationId = resolveApplicationId(action, actionDTO);
            if (!StringUtils.hasText(applicationId)) {
                continue;
            }

            DatasourceUsageAccumulator accumulator =
                    usageMap.computeIfAbsent(datasource.getId(), id -> new DatasourceUsageAccumulator(datasource));

            String applicationName = applicationNames.get(applicationId);
            String queryId = Optional.ofNullable(actionDTO.getId()).orElse(action.getId());
            accumulator.addQuery(
                    applicationId,
                    applicationName,
                    queryId,
                    actionDTO.getName(),
                    resolvePageId(action, actionDTO),
                    pagesByApplicationId.get(applicationId),
                    pageNamesById);
        }

        if (usageMap.isEmpty()) {
            return Collections.emptyList();
        }

        return usageMap.values().stream().map(DatasourceUsageAccumulator::toDto).collect(Collectors.toList());
    }

    private ActionDTO getRelevantActionDTO(NewAction action) {
        ActionDTO unpublished = action.getUnpublishedAction();
        if (unpublished != null && unpublished.getDatasource() != null) {
            return unpublished;
        }
        ActionDTO published = action.getPublishedAction();
        if (published != null && published.getDatasource() != null) {
            return published;
        }
        return unpublished != null ? unpublished : published;
    }

    private String resolveApplicationId(NewAction action, ActionDTO actionDTO) {
        if (StringUtils.hasText(actionDTO.getApplicationId())) {
            return actionDTO.getApplicationId();
        }
        if (StringUtils.hasText(action.getApplicationId())) {
            return action.getApplicationId();
        }
        ActionDTO unpublished = action.getUnpublishedAction();
        if (unpublished != null && StringUtils.hasText(unpublished.getApplicationId())) {
            return unpublished.getApplicationId();
        }
        ActionDTO published = action.getPublishedAction();
        if (published != null && StringUtils.hasText(published.getApplicationId())) {
            return published.getApplicationId();
        }
        return null;
    }

    private List<WorkspaceDatasourceUsageDTO> sortUsage(List<WorkspaceDatasourceUsageDTO> usageList) {
        if (usageList.isEmpty()) {
            return usageList;
        }

        usageList.sort(Comparator.comparing(dto -> normalize(dto.getDatasourceName())));

        usageList.forEach(dto -> {
            List<ApplicationDatasourceUsageDTO> applications = dto.getApplications();
            if (applications != null && !applications.isEmpty()) {
                applications.sort(Comparator.comparing(app -> normalize(app.getApplicationName())));
                applications.forEach(app -> {
                    List<PageDatasourceUsageDTO> pages = app.getPages();
                    if (pages != null && !pages.isEmpty()) {
                        pages.sort(Comparator.comparing(page -> normalize(page.getPageName())));
                        pages.forEach(page -> {
                            List<QueryUsageDTO> queries = page.getQueries();
                            if (queries != null && !queries.isEmpty()) {
                                queries.sort(Comparator.comparing(query -> normalize(query.getName())));
                            }
                        });
                    }
                });
            }
        });

        return usageList;
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private static final class DatasourceUsageAccumulator {

        private final Datasource datasource;
        private final Map<String, ApplicationUsageAccumulator> applications = new LinkedHashMap<>();

        private DatasourceUsageAccumulator(Datasource datasource) {
            this.datasource = datasource;
        }

        private void addQuery(
                String applicationId,
                String applicationName,
                String queryId,
                String queryName,
                String pageId,
                List<ApplicationPage> pages,
                Map<String, String> pageNamesById) {
            if (!StringUtils.hasText(applicationId)) {
                return;
            }

            ApplicationUsageAccumulator accumulator = applications.computeIfAbsent(
                    applicationId, id -> new ApplicationUsageAccumulator(applicationId, applicationName));

            accumulator.addQuery(queryId, queryName, pageId, pages, pageNamesById);
        }

        private WorkspaceDatasourceUsageDTO toDto() {
            List<ApplicationDatasourceUsageDTO> applicationDtos = applications.values().stream()
                    .map(ApplicationUsageAccumulator::toDto)
                    .collect(Collectors.toCollection(ArrayList::new));

            int totalQueryCount = applicationDtos.stream()
                    .map(ApplicationDatasourceUsageDTO::getQueryCount)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .sum();

            return WorkspaceDatasourceUsageDTO.builder()
                    .datasourceId(datasource.getId())
                    .datasourceName(datasource.getName())
                    .pluginId(datasource.getPluginId())
                    .pluginName(datasource.getPluginName())
                    .totalQueryCount(totalQueryCount)
                    .applications(applicationDtos)
                    .build();
        }
    }

    private static final class ApplicationUsageAccumulator {

        private final String applicationId;
        private String applicationName;
        private final Map<String, PageUsageAccumulator> pages = new LinkedHashMap<>();

        private ApplicationUsageAccumulator(String applicationId, String applicationName) {
            this.applicationId = applicationId;
            this.applicationName = applicationName;
        }

        private void addQuery(
                String queryId,
                String queryName,
                String pageId,
                List<ApplicationPage> applicationPages,
                Map<String, String> pageNamesById) {
            if (!StringUtils.hasText(pageId)) {
                return;
            }

            PageUsageAccumulator pageUsageAccumulator = pages.computeIfAbsent(pageId, id -> {
                String pageName = resolvePageName(applicationPages, pageId, pageNamesById);
                return new PageUsageAccumulator(pageId, pageName);
            });

            pageUsageAccumulator.addQuery(queryId, queryName, applicationId);
        }

        private ApplicationDatasourceUsageDTO toDto() {
            List<PageDatasourceUsageDTO> pageDtos = pages.values().stream()
                    .map(PageUsageAccumulator::toDto)
                    .collect(Collectors.toCollection(ArrayList::new));

            int totalQueryCount = pageDtos.stream()
                    .map(PageDatasourceUsageDTO::getQueryCount)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .sum();

            return ApplicationDatasourceUsageDTO.builder()
                    .applicationId(applicationId)
                    .applicationName(applicationName)
                    .queryCount(totalQueryCount)
                    .pages(pageDtos)
                    .build();
        }
    }

    private static final class PageUsageAccumulator {

        private final String pageId;
        private final String pageName;
        private final List<QueryUsageDTO> queries = new ArrayList<>();

        private PageUsageAccumulator(String pageId, String pageName) {
            this.pageId = pageId;
            this.pageName = pageName;
        }

        private void addQuery(String queryId, String queryName, String applicationId) {
            queries.add(QueryUsageDTO.builder()
                    .id(queryId)
                    .name(queryName)
                    .pageId(pageId)
                    .pageName(pageName)
                    .applicationId(applicationId)
                    .build());
        }

        private PageDatasourceUsageDTO toDto() {
            return PageDatasourceUsageDTO.builder()
                    .pageId(pageId)
                    .pageName(pageName)
                    .queryCount(queries.size())
                    .queries(new ArrayList<>(queries))
                    .build();
        }
    }

    private static String resolvePageId(NewAction action, ActionDTO actionDTO) {
        if (actionDTO != null && StringUtils.hasText(actionDTO.getPageId())) {
            return actionDTO.getPageId();
        }
        ActionDTO unpublished = action.getUnpublishedAction();
        if (unpublished != null && StringUtils.hasText(unpublished.getPageId())) {
            return unpublished.getPageId();
        }
        ActionDTO published = action.getPublishedAction();
        if (published != null && StringUtils.hasText(published.getPageId())) {
            return published.getPageId();
        }
        return null;
    }

    private static String resolvePageName(
            List<ApplicationPage> pages, String pageId, Map<String, String> pageNamesById) {
        if (!StringUtils.hasText(pageId)) {
            return null;
        }

        if (pageNamesById != null) {
            String directName = pageNamesById.get(pageId);
            if (StringUtils.hasText(directName)) {
                return directName;
            }
        }

        if (pages == null || pages.isEmpty()) {
            return pageNamesById != null ? pageNamesById.get(pageId) : null;
        }

        for (ApplicationPage page : pages) {
            if (page == null) {
                continue;
            }

            if (pageId.equals(page.getId()) || pageId.equals(page.getBaseId())) {
                if (pageNamesById != null) {
                    String nameFromId = pageNamesById.get(page.getId());
                    if (StringUtils.hasText(nameFromId)) {
                        return nameFromId;
                    }
                    String nameFromBaseId = pageNamesById.get(page.getBaseId());
                    if (StringUtils.hasText(nameFromBaseId)) {
                        return nameFromBaseId;
                    }
                }

                if (StringUtils.hasText(page.getSlug())) {
                    return page.getSlug();
                }
            }
        }

        return pageNamesById != null ? pageNamesById.get(pageId) : null;
    }
}
