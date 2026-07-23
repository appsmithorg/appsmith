package com.appsmith.server.applications.git;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.git.files.FileUtilsImpl;
import com.appsmith.git.helpers.DSLTransformerHelper;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.git.dtos.ArtifactJsonTransformationDTO;
import com.appsmith.server.helpers.ce.ArtifactGitFileUtilsCE;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.git.constants.CommonConstants.DELIMITER_PATH;
import static com.appsmith.git.constants.CommonConstants.JSON_EXTENSION;
import static com.appsmith.git.constants.CommonConstants.MAIN_CONTAINER;
import static com.appsmith.git.constants.CommonConstants.WIDGETS;
import static com.appsmith.git.constants.GitDirectories.PAGE_DIRECTORY;
import static com.appsmith.server.constants.FieldName.ACTION_COLLECTION_LIST;
import static com.appsmith.server.constants.FieldName.ACTION_LIST;
import static com.appsmith.server.constants.FieldName.CHILDREN;
import static com.appsmith.server.constants.FieldName.CUSTOM_JS_LIB_LIST;
import static com.appsmith.server.constants.FieldName.DATASOURCE_LIST;
import static com.appsmith.server.constants.FieldName.DECRYPTED_FIELDS;
import static com.appsmith.server.constants.FieldName.EDIT_MODE_THEME;
import static com.appsmith.server.constants.FieldName.EXPORTED_APPLICATION;
import static com.appsmith.server.constants.FieldName.PAGE_LIST;
import static com.appsmith.server.constants.FieldName.WIDGET_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.WIDGET_NAME;
import static com.appsmith.server.helpers.ce.CommonGitFileUtilsCE.removeUnwantedFieldsFromBaseDomain;

@Slf4j
@Component
@Import({FileUtilsImpl.class})
public class ApplicationGitFileUtilsCEImpl implements ArtifactGitFileUtilsCE<ApplicationJson> {

    private final ObjectMapper objectMapper;
    private final JsonSchemaMigration jsonSchemaMigration;

    public ApplicationGitFileUtilsCEImpl(ObjectMapper objectMapper, JsonSchemaMigration jsonSchemaMigration) {
        this.objectMapper = objectMapper.copy().disable(MapperFeature.USE_ANNOTATIONS);
        this.jsonSchemaMigration = jsonSchemaMigration;
    }

    // Only include the application helper fields in metadata object
    protected Set<String> getBlockedMetadataFields() {
        return Set.of(
                EXPORTED_APPLICATION,
                DATASOURCE_LIST,
                PAGE_LIST,
                ACTION_LIST,
                ACTION_COLLECTION_LIST,
                DECRYPTED_FIELDS,
                EDIT_MODE_THEME,
                CUSTOM_JS_LIB_LIST);
    }

    protected final Map<String, String> applicationConstantsMap =
            Map.of(FieldName.ARTIFACT_CONTEXT, FieldName.APPLICATION, FieldName.ID, FieldName.APPLICATION_ID);

    public Map<String, String> getConstantsMap() {
        return applicationConstantsMap;
    }

    @Override
    public ArtifactExchangeJson createArtifactExchangeJsonObject() {
        return new ApplicationJson();
    }

    @Override
    public void setArtifactDependentResources(
            ArtifactExchangeJson artifactExchangeJson, GitResourceMap gitResourceMap) {

        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        Map<GitResourceIdentity, Object> resourceMap = gitResourceMap.getGitResourceMap();

        // application
        Application application = applicationJson.getExportedApplication();
        removeUnwantedFieldsFromApplication(application);
        final String applicationFilePath = CommonConstants.APPLICATION + JSON_EXTENSION;
        GitResourceIdentity applicationIdentity =
                new GitResourceIdentity(GitResourceType.ROOT_CONFIG, applicationFilePath, applicationFilePath);
        resourceMap.put(applicationIdentity, application);
        applicationJson.setModifiedResources(null);

        // pages and widgets
        applicationJson.getPageList().stream()
                // As we are expecting the commit will happen only after the application is published, so we can safely
                // assume if the unpublished version is deleted entity should not be committed to git
                .filter(newPage -> newPage.getUnpublishedPage() != null
                        && newPage.getUnpublishedPage().getDeletedAt() == null)
                .forEach(newPage -> {
                    removeUnwantedFieldsFromPage(newPage);
                    PageDTO pageDTO = newPage.getUnpublishedPage();
                    JSONObject dsl = pageDTO.getLayouts().get(0).getDsl();
                    // Get MainContainer widget data, remove the children and club with Canvas.json file
                    JSONObject mainContainer = new JSONObject(dsl);
                    mainContainer.remove(CHILDREN);
                    pageDTO.getLayouts().get(0).setDsl(mainContainer);
                    // pageName will be used for naming the json file
                    final String pagePathPrefix = PAGE_DIRECTORY + DELIMITER_PATH + pageDTO.getName() + DELIMITER_PATH;
                    final String pageFilePath = pagePathPrefix + pageDTO.getName() + JSON_EXTENSION;
                    GitResourceIdentity pageIdentity = new GitResourceIdentity(
                            GitResourceType.CONTEXT_CONFIG, newPage.getGitSyncId(), pageFilePath);
                    resourceMap.put(pageIdentity, newPage);

                    Map<String, org.json.JSONObject> result =
                            DSLTransformerHelper.flatten(new org.json.JSONObject(dsl.toString()));
                    result.forEach((key, jsonObject) -> {
                        String widgetId = newPage.getGitSyncId() + "-" + jsonObject.getString(WIDGET_ID);
                        String widgetsPath = pagePathPrefix + WIDGETS + DELIMITER_PATH;
                        String widgetName = jsonObject.getString(WIDGET_NAME);
                        String subPath = DSLTransformerHelper.getPathToWidgetFile(key, jsonObject, widgetName);

                        String widgetPath = widgetsPath + subPath + widgetName + JSON_EXTENSION;
                        GitResourceIdentity widgetIdentity =
                                new GitResourceIdentity(GitResourceType.WIDGET_CONFIG, widgetId, widgetPath);
                        resourceMap.put(widgetIdentity, jsonObject);
                    });
                });
    }

    private void removeUnwantedFieldsFromApplication(Application application) {
        // Don't commit application name as while importing we are using the repoName as application name
        application.setName(null);
        application.setPublishedPages(null);
        application.setIsPublic(null);
        application.setSlug(null);
        application.setPublishedApplicationDetail(null);
        removeUnwantedFieldsFromBaseDomain(application);
        // we can call the sanitiseToExportDBObject() from BaseDomain as well here
    }

    private void removeUnwantedFieldsFromPage(NewPage page) {
        // As we are publishing the app and then committing to git we expect the published and unpublished PageDTO will
        // be same, so we only commit unpublished PageDTO.
        page.setPublishedPage(null);
        removeUnwantedFieldsFromBaseDomain(page);
    }

    @Override
    public Mono<? extends ArtifactExchangeJson> performJsonMigration(
            ArtifactJsonTransformationDTO jsonTransformationDTO, ArtifactExchangeJson artifactExchangeJson) {
        String baseArtifactId = jsonTransformationDTO.getBaseArtifactId();
        String refName = jsonTransformationDTO.getRefName();
        RefType refType = jsonTransformationDTO.getRefType();
        return jsonSchemaMigration.migrateArtifactExchangeJsonToLatestSchema(
                artifactExchangeJson, baseArtifactId, refName, refType);
    }

    @Override
    public Path getRepoSuffixPath(String workspaceId, String artifactId, String repoName, @NonNull String... args) {
        List<String> varargs = new ArrayList<>(List.of(artifactId, repoName));
        varargs.addAll(List.of(args));
        return Paths.get(workspaceId, varargs.toArray(new String[0]));
    }

    @Override
    public void setArtifactDependentPropertiesInJson(
            GitResourceMap gitResourceMap, ArtifactExchangeJson artifactExchangeJson) {
        Map<GitResourceIdentity, Object> resourceMap = gitResourceMap.getGitResourceMap();

        // exported application
        final String applicationFilePath = CommonConstants.APPLICATION + JSON_EXTENSION;
        GitResourceIdentity applicationJsonIdentity =
                new GitResourceIdentity(GitResourceType.ROOT_CONFIG, applicationFilePath, applicationFilePath);

        Object applicationObject = resourceMap.get(applicationJsonIdentity);
        Application application = objectMapper.convertValue(applicationObject, Application.class);
        artifactExchangeJson.setArtifact(application);

        // metadata
        final String metadataFilePath = CommonConstants.METADATA + JSON_EXTENSION;
        GitResourceIdentity metadataIdentity =
                new GitResourceIdentity(GitResourceType.ROOT_CONFIG, metadataFilePath, metadataFilePath);

        Object metadataObject = resourceMap.get(metadataIdentity);
        ApplicationJson metadata = objectMapper.convertValue(metadataObject, ApplicationJson.class);
        copyNestedNonNullProperties(metadata, artifactExchangeJson);

        // pages
        List<NewPage> pageList = resourceMap.entrySet().stream()
                .filter(entry -> {
                    GitResourceIdentity key = entry.getKey();
                    return GitResourceType.CONTEXT_CONFIG.equals(key.getResourceType());
                })
                .map(Map.Entry::getValue)
                .map(pageObject -> objectMapper.convertValue(pageObject, NewPage.class))
                .collect(Collectors.toList());
        artifactExchangeJson.setContextList(pageList);

        // widgets
        pageList.parallelStream().forEach(newPage -> {
            String pathToReplace = Pattern.quote(PAGE_DIRECTORY
                    + DELIMITER_PATH
                    + newPage.getUnpublishedPage().getName()
                    + DELIMITER_PATH
                    + WIDGETS
                    + DELIMITER_PATH);
            String replacementString = MAIN_CONTAINER + DELIMITER_PATH;
            Pattern replacementPattern = Pattern.compile(pathToReplace);

            Map<String, org.json.JSONObject> widgetsData = resourceMap.entrySet().stream()
                    .filter(entry -> {
                        GitResourceIdentity key = entry.getKey();
                        return GitResourceType.WIDGET_CONFIG.equals(key.getResourceType())
                                && key.getResourceIdentifier().startsWith(newPage.getGitSyncId() + "-");
                    })
                    .collect(Collectors.toMap(
                            entry -> replacementPattern
                                    .matcher(entry.getKey().getFilePath())
                                    .replaceFirst(replacementString),
                            entry -> {
                                try {
                                    return new org.json.JSONObject(objectMapper.writeValueAsString(entry.getValue()));
                                } catch (JsonProcessingException jsonProcessingException) {
                                    log.error(
                                            "Error while deserializing widget with file path {}",
                                            entry.getKey().getFilePath());
                                    throw new RuntimeException(jsonProcessingException);
                                }
                            }));

            Layout layout = newPage.getUnpublishedPage().getLayouts().get(0);
            org.json.JSONObject mainContainer;
            try {
                mainContainer = new org.json.JSONObject(objectMapper.writeValueAsString(layout.getDsl()));

                Map<String, List<String>> parentDirectories = DSLTransformerHelper.calculateParentDirectories(
                        widgetsData.keySet().stream().toList());
                org.json.JSONObject nestedDSL =
                        DSLTransformerHelper.getNestedDSL(widgetsData, parentDirectories, mainContainer);

                JSONParser jsonParser = new JSONParser();
                JSONObject parsedDSL = jsonParser.parse(nestedDSL.toString(), JSONObject.class);

                layout.setDsl(parsedDSL);
            } catch (ParseException | JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        });
    }
}
