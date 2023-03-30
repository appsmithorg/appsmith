package com.appsmith.git.helpers;

import com.appsmith.external.converters.ISOStringToInstantConverter;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.git.converters.GsonDoubleToLongConverter;
import com.appsmith.git.converters.GsonUnorderedToOrderedConverter;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.stream.JsonReader;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;
import org.springframework.util.FileSystemUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryNotEmptyException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.appsmith.external.constants.GitConstants.CUSTOM_JS_LIB_LIST;
import static com.appsmith.external.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.external.constants.GitConstants.PAGE_LIST;
import static com.appsmith.external.constants.GitConstants.ACTION_LIST;
import static com.appsmith.external.constants.GitConstants.ACTION_COLLECTION_LIST;
import static com.appsmith.git.constants.GitDirectories.ACTION_COLLECTION_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.ACTION_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.DATASOURCE_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.JS_LIB_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.PAGE_DIRECTORY;


@Slf4j
@Getter
@RequiredArgsConstructor
@Component
@Import({GitServiceConfig.class})
public class FileUtilsImpl implements FileInterface {

    private final GitServiceConfig gitServiceConfig;

    private final GitExecutor gitExecutor;

    private static final String EDIT_MODE_URL_TEMPLATE = "{{editModeUrl}}";

    private static final String VIEW_MODE_URL_TEMPLATE = "{{viewModeUrl}}";

    private static final Pattern ALLOWED_FILE_EXTENSION_PATTERN = Pattern.compile("(.*?)\\.(md|git|gitignore|yml)$");

    private final Scheduler scheduler = Schedulers.boundedElastic();

    /**
     Application will be stored in the following structure:

     For v1:
     repo_name
        application.json
        metadata.json
        datasource
            datasource1Name.json
            datasource2Name.json
     queries (Only requirement here is the filename should be unique)
        action1_page1
        action2_page2
     jsobjects (Only requirement here is the filename should be unique)
        jsobject1_page1
        jsobject2_page2
     pages
        page1
        page2

     For v2:
     repo_name
        application.json
        metadata.json
        theme
        publishedTheme.json
        editModeTheme.json
     pages
        page1
            canvas.json
            queries
                Query1.json
                Query2.json
            jsobjects
                JSObject1.json
        page2
        page3
     datasources
        datasource1.json
        datasource2.json

     For v3:
     repo_name
        application.json
        metadata.json
        theme
        publishedTheme.json
        editModeTheme.json
     pages
        page1
            canvas.json
            queries
                Query1.json
            jsobjects
                JSObject1
                    JSObject1.js
                    Metadata.json
     page2
     page3
     datasources
         datasource1.json
         datasource2.json

     For v4:
     repo_name
        application.json
        metadata.json
        theme
        publishedTheme.json
        editModeTheme.json
     pages
        page1
        canvas.json
        queries
            Query1.json
        jsobjects
            JSObject1
                JSObject1.js
                Metadata.json
        page2
        page3
     datasources
        datasource1.json
        datasource2.json
     */


    /**
     * This method will save the complete application in the local repo directory.
     * Path to repo will be : ./container-volumes/git-repo/workspaceId/defaultApplicationId/repoName/{application_data}
     * @param baseRepoSuffix path suffix used to create a repo path
     * @param applicationGitReference application reference object from which entire application can be rehydrated
     * @param branchName name of the branch for the current application
     * @return repo path where the application is stored
     */
    public Mono<Path> saveApplicationToGitRepo(Path baseRepoSuffix,
                                               ApplicationGitReference applicationGitReference,
                                               String branchName) throws GitAPIException, IOException {

        // Repo path will be:
        // baseRepo : root/orgId/defaultAppId/repoName/{applicationData}
        // Checkout to mentioned branch if not already checked-out
        Stopwatch processStopwatch = new Stopwatch("FS application save");
        return gitExecutor.resetToLastCommit(baseRepoSuffix, branchName)
                .flatMap(isSwitched -> {

                    Path baseRepo = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix);

                    // Gson to pretty format JSON file
                    // Keep Long type as is by default GSON have behavior to convert to Double
                    // Convert unordered set to ordered one
                    Gson gson = new GsonBuilder()
                            .registerTypeAdapter(Double.class,  new GsonDoubleToLongConverter())
                            .registerTypeAdapter(Set.class, new GsonUnorderedToOrderedConverter())
                            .registerTypeAdapter(Map.class, new GsonUnorderedToOrderedConverter())
                            .registerTypeAdapter(Instant.class, new ISOStringToInstantConverter())
                            .disableHtmlEscaping()
                            .setPrettyPrinting()
                            .create();

                    Set<String> validFileNames = new HashSet<>();
                    Map<String, Set<String>> updatedResources = applicationGitReference.getUpdatedResources();

                    // Remove unwanted directories which was present in v1 of the git file format version
                    deleteDirectory(baseRepo.resolve(ACTION_DIRECTORY));
                    deleteDirectory(baseRepo.resolve(ACTION_COLLECTION_DIRECTORY));

                    // Save application
                    saveResource(applicationGitReference.getApplication(), baseRepo.resolve(CommonConstants.APPLICATION + CommonConstants.JSON_EXTENSION), gson);

                    // Save application metadata
                    JsonObject metadata = gson.fromJson(gson.toJson(applicationGitReference.getMetadata()), JsonObject.class);
                    metadata.addProperty(CommonConstants.FILE_FORMAT_VERSION, CommonConstants.fileFormatVersion);
                    saveResource(metadata, baseRepo.resolve(CommonConstants.METADATA + CommonConstants.JSON_EXTENSION), gson);

                    // Save application theme
                    saveResource(applicationGitReference.getTheme(), baseRepo.resolve(CommonConstants.THEME + CommonConstants.JSON_EXTENSION), gson);

                    // Save pages
                    Path pageDirectory = baseRepo.resolve(PAGE_DIRECTORY);
                    Set<Map.Entry<String, Object>> pageEntries = applicationGitReference.getPages().entrySet();

                    Set<String> validPages = new HashSet<>();
                    for (Map.Entry<String, Object> pageResource : pageEntries) {
                        final String pageName = pageResource.getKey();
                        Path pageSpecificDirectory = pageDirectory.resolve(pageName);
                        Boolean isResourceUpdated = updatedResources.get(PAGE_LIST).contains(pageName);
                        if(Boolean.TRUE.equals(isResourceUpdated)) {
                            saveResource(pageResource.getValue(), pageSpecificDirectory.resolve(CommonConstants.CANVAS + CommonConstants.JSON_EXTENSION), gson);
                        }
                        validPages.add(pageName);
                    }
                    scanAndDeleteDirectoryForDeletedResources(validPages, baseRepo.resolve(PAGE_DIRECTORY));

                    // Save JS Libs
                    Path jsLibDirectory = baseRepo.resolve(JS_LIB_DIRECTORY);
                    Set<Map.Entry<String, Object>> jsLibEntries = applicationGitReference.getJsLibraries().entrySet();
                    Set<String> validJsLibs = new HashSet<>();
                    jsLibEntries
                            .forEach(jsLibEntry -> {
                                String uidString = jsLibEntry.getKey();
                                Boolean isResourceUpdated = updatedResources.get(CUSTOM_JS_LIB_LIST).contains(uidString);
                                String fileNameWithExtension =
                                        uidString.replaceAll("/", "_") + CommonConstants.JSON_EXTENSION;
                                Path jsLibSpecificFile =
                                        jsLibDirectory.resolve(fileNameWithExtension);
                                if (isResourceUpdated) {
                                    saveResource(jsLibEntry.getValue(), jsLibSpecificFile, gson);
                                }
                                validJsLibs.add(fileNameWithExtension);
                            });
                    scanAndDeleteFileForDeletedResources(validJsLibs, jsLibDirectory);

                    // Create HashMap for valid actions and actionCollections
                    HashMap<String, Set<String>> validActionsMap = new HashMap<>();
                    HashMap<String, Set<String>> validActionCollectionsMap = new HashMap<>();
                    validPages.forEach(validPage -> {
                        validActionsMap.put(validPage, new HashSet<>());
                        validActionCollectionsMap.put(validPage, new HashSet<>());
                    });

                    // Save actions
                    for (Map.Entry<String, Object> resource : applicationGitReference.getActions().entrySet()) {
                        // queryName_pageName => nomenclature for the keys
                        // TODO
                        //  queryName => for app level queries, this is not implemented yet
                        String[] names = resource.getKey().split(NAME_SEPARATOR);
                        if (names.length > 1 && StringUtils.hasLength(names[1])) {
                            // For actions, we are referring to validNames to maintain unique file names as just name
                            // field don't guarantee unique constraint for actions within JSObject
                            Boolean isResourceUpdated = updatedResources.get(ACTION_LIST).contains(resource.getKey());
                            final String queryName = names[0].replace(".", "-");
                            final String pageName = names[1];
                            Path pageSpecificDirectory = pageDirectory.resolve(pageName);
                            Path actionSpecificDirectory = pageSpecificDirectory.resolve(ACTION_DIRECTORY);

                            if(!validActionsMap.containsKey(pageName)) {
                                validActionsMap.put(pageName, new HashSet<>());
                            }
                            validActionsMap.get(pageName).add(queryName);
                            if(Boolean.TRUE.equals(isResourceUpdated)) {
                                saveActions(
                                        resource.getValue(),
                                        applicationGitReference.getActionBody().containsKey(resource.getKey()) ? applicationGitReference.getActionBody().get(resource.getKey()) : null,
                                        queryName,
                                        actionSpecificDirectory.resolve(queryName),
                                        gson
                                );
                                // Delete the resource from the old file structure v2
                                deleteFile(pageSpecificDirectory.resolve(ACTION_DIRECTORY).resolve(queryName + CommonConstants.JSON_EXTENSION));
                            }

                        }
                    }

                    validActionsMap.forEach((pageName, validActionNames) -> {
                        Path pageSpecificDirectory = pageDirectory.resolve(pageName);
                        scanAndDeleteDirectoryForDeletedResources(validActionNames, pageSpecificDirectory.resolve(ACTION_DIRECTORY));
                    });

                    // Save JSObjects
                    for (Map.Entry<String, Object> resource : applicationGitReference.getActionCollections().entrySet()) {
                        // JSObjectName_pageName => nomenclature for the keys
                        // TODO JSObjectName => for app level JSObjects, this is not implemented yet
                        String[] names = resource.getKey().split(NAME_SEPARATOR);
                        if (names.length > 1 && StringUtils.hasLength(names[1])) {
                            final String actionCollectionName = names[0];
                            final String pageName = names[1];
                            Path pageSpecificDirectory = pageDirectory.resolve(pageName);
                            Path actionCollectionSpecificDirectory = pageSpecificDirectory.resolve(ACTION_COLLECTION_DIRECTORY);

                            if(!validActionCollectionsMap.containsKey(pageName)) {
                                validActionCollectionsMap.put(pageName, new HashSet<>());
                            }
                            validActionCollectionsMap.get(pageName).add(actionCollectionName);
                            Boolean isResourceUpdated = updatedResources.get(ACTION_COLLECTION_LIST).contains(resource.getKey());
                            if(Boolean.TRUE.equals(isResourceUpdated)) {
                                saveActionCollection(
                                        resource.getValue(),
                                        applicationGitReference.getActionCollectionBody().get(resource.getKey()),
                                        actionCollectionName,
                                        actionCollectionSpecificDirectory.resolve(actionCollectionName),
                                        gson
                                );
                                // Delete the resource from the old file structure v2
                                deleteFile(actionCollectionSpecificDirectory.resolve(actionCollectionName + CommonConstants.JSON_EXTENSION));
                            }
                        }
                    }

                    // Verify if the old files are deleted
                    validActionCollectionsMap.forEach((pageName, validActionCollectionNames) -> {
                        Path pageSpecificDirectory = pageDirectory.resolve(pageName);
                        scanAndDeleteDirectoryForDeletedResources(validActionCollectionNames, pageSpecificDirectory.resolve(ACTION_COLLECTION_DIRECTORY));
                    });

                    // Save datasources ref
                    for (Map.Entry<String, Object> resource : applicationGitReference.getDatasources().entrySet()) {
                        saveResource(resource.getValue(), baseRepo.resolve(DATASOURCE_DIRECTORY).resolve(resource.getKey() + CommonConstants.JSON_EXTENSION), gson);
                        validFileNames.add(resource.getKey() + CommonConstants.JSON_EXTENSION);
                    }
                    // Scan datasource directory and delete any unwanted files if present
                    if (!applicationGitReference.getDatasources().isEmpty()) {
                        scanAndDeleteFileForDeletedResources(validFileNames, baseRepo.resolve(DATASOURCE_DIRECTORY));
                    }
                    processStopwatch.stopAndLogTimeInMillis();
                    return Mono.just(baseRepo);
                })
                .subscribeOn(scheduler);
    }

    /**
     * This method will be used to store the DB resource to JSON file
     * @param sourceEntity resource extracted from DB to be stored in file
     * @param path file path where the resource to be stored
     * @param gson
     * @return if the file operation is successful
     */
    private boolean saveResource(Object sourceEntity, Path path, Gson gson) {
        try {
            Files.createDirectories(path.getParent());
            return writeToFile(sourceEntity, path, gson);
        } catch (IOException e) {
            log.debug(e.getMessage());
        }
        return false;
    }

    /**
     * This method is used to write actionCollection specific resource to file system. We write the data in two steps
     * 1. Actual js code
     * 2. Metadata of the actionCollection
     * @param sourceEntity the metadata of the action collection
     * @param body actual js code written by the user
     * @param resourceName name of the action collection
     * @param path file path where the resource will be stored
     * @param gson
     * @return if the file operation is successful
     */
    private boolean saveActionCollection(Object sourceEntity, String body, String resourceName, Path path, Gson gson) {
        try {
            Files.createDirectories(path);
            // Write the js Object body to .js file to make conflict handling easier
            Path bodyPath = path.resolve(resourceName + CommonConstants.JS_EXTENSION);
            writeStringToFile(body, bodyPath);

            // Write metadata for the jsObject
            Path metadataPath = path.resolve(CommonConstants.METADATA + CommonConstants.JSON_EXTENSION);
            return writeToFile(sourceEntity, metadataPath, gson);
        } catch (IOException e) {
            log.debug(e.getMessage());
        }
        return false;
    }

    /**
     * This method is used to write action specific resource to file system. We write the data in two steps
     *      * 1. Actual query written by the user
     *      * 2. Metadata of the actios
     * @param sourceEntity the metadata of the action
     * @param body actual query written by the user
     * @param resourceName name of the action
     * @param path file path where the resource will be stored
     * @param gson
     * @return if the file operation is successful
     */
    private boolean saveActions(Object sourceEntity, String body, String resourceName, Path path, Gson gson) {
        try {
            Files.createDirectories(path);
            // Write the user written query to .txt file to make conflict handling easier
            // Body will be null if the action is of type JS
            if (StringUtils.hasLength(body)) {
                Path bodyPath = path.resolve(resourceName + CommonConstants.TEXT_FILE_EXTENSION);
                writeStringToFile(body, bodyPath);
            }

            // Write metadata for the actions
            Path metadataPath = path.resolve(CommonConstants.METADATA + CommonConstants.JSON_EXTENSION);
            return writeToFile(sourceEntity, metadataPath, gson);
        } catch (IOException e) {
            log.debug(e.getMessage());
        }
        return false;
    }

    private boolean writeStringToFile(String data, Path path) throws IOException {
        try (BufferedWriter fileWriter = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
            fileWriter.write(data);
            return true;
        }
    }

    private boolean writeToFile(Object sourceEntity, Path path, Gson gson) throws IOException {
        try (BufferedWriter fileWriter = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
            gson.toJson(sourceEntity, fileWriter);
            return true;
        }
    }

    /**
     * This method will delete the JSON resource available in local git directory on subsequent commit made after the
     * deletion of respective resource from DB
     * @param validResources resources those are still available in DB
     * @param resourceDirectory directory which needs to be scanned for possible file deletion operations
     */
    public void scanAndDeleteFileForDeletedResources(Set<String> validResources, Path resourceDirectory) {
        // Scan resource directory and delete any unwanted file if present
        // unwanted file : corresponding resource from DB has been deleted
        if(resourceDirectory.toFile().exists()) {
            try (Stream<Path> paths = Files.walk(resourceDirectory)) {
                paths
                        .filter(path -> Files.isRegularFile(path) && !validResources.contains(path.getFileName().toString()))
                        .forEach(this::deleteFile);
            } catch (IOException e) {
                log.debug("Error while scanning directory: {}, with error {}", resourceDirectory, e);
            }
        }
    }

    /**
     * This method will delete the JSON resource directory available in local git directory on subsequent commit made after the
     * deletion of respective resource from DB
     * @param validResources resources those are still available in DB
     * @param resourceDirectory directory which needs to be scanned for possible file deletion operations
     */
    public void scanAndDeleteDirectoryForDeletedResources(Set<String> validResources, Path resourceDirectory) {
        // Scan resource directory and delete any unwanted directory if present
        // unwanted directory : corresponding resource from DB has been deleted
        if(resourceDirectory.toFile().exists()) {
            try (Stream<Path> paths = Files.walk(resourceDirectory, 1)) {
                paths
                        .filter(path -> Files.isDirectory(path) && !path.equals(resourceDirectory) && !validResources.contains(path.getFileName().toString()))
                        .forEach(this::deleteDirectory);
            } catch (IOException e) {
                log.debug("Error while scanning directory: {}, with error {}", resourceDirectory, e);
            }
        }
    }

    /**
     * This method will delete the directory and all its contents
     * @param directory
     */
    private void deleteDirectory(Path directory){
        if(directory.toFile().exists()) {
            try {
                FileUtils.deleteDirectory(directory.toFile());
            } catch (IOException e){
                log.debug("Unable to delete directory for path {} with message {}", directory, e.getMessage());
            }
        }
    }

    /**
     * This method will delete the file from local repo
     * @param filePath file that needs to be deleted
     */
    private void deleteFile(Path filePath) {
        try
        {
            Files.deleteIfExists(filePath);
        }
        catch(DirectoryNotEmptyException e)
        {
            log.debug("Unable to delete non-empty directory at {}", filePath);
        }
        catch(IOException e)
        {
            log.debug("Unable to delete file, {}", e.getMessage());
        }
    }

    /**
     * This will reconstruct the application from the repo
     * @param organisationId To which organisation application needs to be rehydrated
     * @param defaultApplicationId To which organisation application needs to be rehydrated
     * @param branchName for which the application needs to be rehydrate
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ApplicationGitReference> reconstructApplicationReferenceFromGitRepo(String organisationId,
                                                                                    String defaultApplicationId,
                                                                                    String repoName,
                                                                                    String branchName) {

        Stopwatch processStopwatch = new Stopwatch("FS reconstruct application");
        Path baseRepoSuffix = Paths.get(organisationId, defaultApplicationId, repoName);

        // Checkout to mentioned branch if not already checked-out
        return gitExecutor.checkoutToBranch(baseRepoSuffix, branchName)
                .map(isSwitched -> {

                    Path baseRepoPath = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix);

                    // Instance creator is required while de-serialising using Gson as key instance can't be invoked with
                    // no-args constructor
                    Gson gson = new GsonBuilder()
                            .registerTypeAdapter(DatasourceStructure.Key.class, new DatasourceStructure.KeyInstanceCreator())
                            .create();

                    ApplicationGitReference applicationGitReference = fetchApplicationReference(baseRepoPath, gson);
                    processStopwatch.stopAndLogTimeInMillis();
                    return applicationGitReference;
                })
                .subscribeOn(scheduler);
    }

    /**
     * This is used to initialize repo with Readme file when the application is connected to remote repo
     *
     * @param baseRepoSuffix path suffix used to create a repo path this includes the readme.md as well
     * @param viewModeUrl    URL to deployed version of the application view only mode
     * @param editModeUrl    URL to deployed version of the application edit mode
     * @return Path to the base repo
     * @throws IOException
     */
    @Override
    public Mono<Path> initializeReadme(Path baseRepoSuffix,
                                       String viewModeUrl,
                                       String editModeUrl) throws IOException {
        return Mono.fromCallable(() -> {
            ClassLoader classLoader = getClass().getClassLoader();
            InputStream inputStream = classLoader.getResourceAsStream(gitServiceConfig.getReadmeTemplatePath());

            StringWriter stringWriter = new StringWriter();
            IOUtils.copy(inputStream, stringWriter, "UTF-8");
            String data = stringWriter.toString().replace(EDIT_MODE_URL_TEMPLATE, editModeUrl).replace(VIEW_MODE_URL_TEMPLATE, viewModeUrl);

            File file = new File(Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix).toFile().toString());
            FileUtils.writeStringToFile(file, data, "UTF-8", true);

            // Remove readme.md from the path
            return file.toPath().getParent();
        }).subscribeOn(scheduler);
    }

    @Override
    public Mono<Boolean> deleteLocalRepo(Path baseRepoSuffix) {
        // Remove the complete directory from path: baseRepo/workspaceId/defaultApplicationId
        File file = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix).getParent().toFile();
        while (file.exists()) {
            FileSystemUtils.deleteRecursively(file);
        }
        return Mono.just(Boolean.TRUE);
    }

    @Override
    public Mono<Boolean> checkIfDirectoryIsEmpty(Path baseRepoSuffix) {
        return Mono.fromCallable(() -> {
            File[] files = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix).toFile().listFiles();
            for(File file : files) {
                if(!ALLOWED_FILE_EXTENSION_PATTERN.matcher(file.getName()).matches() && !file.getName().equals("LICENSE")) {
                    //Remove the cloned repo from the file system since the repo doesnt satisfy the criteria
                    while (file.exists()) {
                        FileSystemUtils.deleteRecursively(file);
                    }
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * This method will be used to read and dehydrate the json file present from the local git repo
     * @param filePath file on which the read operation will be performed
     * @param gson
     * @return resource stored in the JSON file
     */
    private Object readFile(Path filePath, Gson gson) {

        Object file;
        try (JsonReader reader = new JsonReader(new FileReader(filePath.toFile()))) {
            file = gson.fromJson(reader, Object.class);
        } catch (Exception e) {
            log.debug(e.getMessage());
            return null;
        }
        return file;
    }

    /**
     * This method will be used to read and dehydrate the json files present from the local git repo
     * @param directoryPath directory path for files on which read operation will be performed
     * @param gson
     * @return resources stored in the directory
     */
    private Map<String, Object> readFiles(Path directoryPath, Gson gson, String keySuffix) {
        Map<String, Object> resource = new HashMap<>();
        File directory = directoryPath.toFile();
        if (directory.isDirectory()) {
            Arrays.stream(Objects.requireNonNull(directory.listFiles())).forEach(file -> {
                try (JsonReader reader = new JsonReader(new FileReader(file))) {
                    resource.put(file.getName() + keySuffix, gson.fromJson(reader, Object.class));
                } catch (Exception e) {
                    log.debug(e.getMessage());
                }
            });
        }
        return resource;
    }

    /**
     * This method will read the content of the file as a plain text and does not apply the gson to json transformation
     * @param filePath file path for files on which read operation will be performed
     * @return content of the file in the path
     */
    private String readFileAsString(Path filePath) {
        String data = "";
        try {
            data = FileUtils.readFileToString(filePath.toFile(), "UTF-8");
        } catch (IOException e) {
            log.error(" Error while reading the file from git repo {0} ", e.getMessage());
        }
        return data;
    }

    /**
     * This method is to read the content for action and actionCollection or any nested resources which has the new structure - v3
     * Where the user written JS Object code and the metadata is split into to different files
     * @param directoryPath file path for files on which read operation will be performed
     * @return resources stored in the directory
     */
    private Map<String, Object> readActionCollection(Path directoryPath, Gson gson, String keySuffix, Map<String, String> actionCollectionBodyMap) {
        Map<String, Object> resource = new HashMap<>();
        File directory = directoryPath.toFile();
        if (directory.isDirectory()) {
            for (File dirFile : Objects.requireNonNull(directory.listFiles())) {
                String resourceName = dirFile.getName();
                Path resourcePath = directoryPath.resolve(resourceName).resolve( resourceName + CommonConstants.JS_EXTENSION);
                String body = "";
                if (resourcePath.toFile().exists()) {
                    body = readFileAsString(resourcePath);
                }
                Object file = readFile(directoryPath.resolve(resourceName).resolve( CommonConstants.METADATA + CommonConstants.JSON_EXTENSION), gson);
                actionCollectionBodyMap.put(resourceName + keySuffix, body);
                resource.put(resourceName + keySuffix, file);
            }
        }
        return resource;
    }

    /**
     * This method is to read the content for action and actionCollection or any nested resources which has the new structure - v4
     * Where the user queries and the metadata is split into to different files
     * @param directoryPath directory path for files on which read operation will be performed
     * @param gson
     * @return resources stored in the directory
     */
    private Map<String, Object> readAction(Path directoryPath, Gson gson, String keySuffix, Map<String, String> actionCollectionBodyMap) {
        Map<String, Object> resource = new HashMap<>();
        File directory = directoryPath.toFile();
        if (directory.isDirectory()) {
            for (File dirFile : Objects.requireNonNull(directory.listFiles())) {
                String resourceName = dirFile.getName();
                String body = readFileAsString(directoryPath.resolve(resourceName).resolve( resourceName + CommonConstants.TEXT_FILE_EXTENSION));
                Object file = readFile(directoryPath.resolve(resourceName).resolve( CommonConstants.METADATA + CommonConstants.JSON_EXTENSION), gson);
                actionCollectionBodyMap.put(resourceName + keySuffix, body);
                resource.put(resourceName + keySuffix, file);
            }
        }
        return resource;
    }

    private ApplicationGitReference fetchApplicationReference(Path baseRepoPath, Gson gson) {
        ApplicationGitReference applicationGitReference = new ApplicationGitReference();
        // Extract application metadata from the json
        Object metadata = readFile(baseRepoPath.resolve(CommonConstants.METADATA + CommonConstants.JSON_EXTENSION), gson);
        Integer fileFormatVersion = getFileFormatVersion(metadata);
        // Check if fileFormat of the saved files in repo is compatible
        if(!isFileFormatCompatible(fileFormatVersion)) {
            throw new AppsmithPluginException(AppsmithPluginError.INCOMPATIBLE_FILE_FORMAT);
        }
        // Extract application data from the json
        applicationGitReference.setApplication(readFile(baseRepoPath.resolve(CommonConstants.APPLICATION + CommonConstants.JSON_EXTENSION), gson));
        applicationGitReference.setTheme(readFile(baseRepoPath.resolve(CommonConstants.THEME + CommonConstants.JSON_EXTENSION), gson));
        Path pageDirectory = baseRepoPath.resolve(PAGE_DIRECTORY);
        // Reconstruct application from given file format
        switch (fileFormatVersion) {
            case 1 :
                // Extract actions
                applicationGitReference.setActions(readFiles(baseRepoPath.resolve(ACTION_DIRECTORY), gson, ""));
                // Extract actionCollections
                applicationGitReference.setActionCollections(readFiles(baseRepoPath.resolve(ACTION_COLLECTION_DIRECTORY), gson, ""));
                // Extract pages
                applicationGitReference.setPages(readFiles(pageDirectory, gson, ""));
                // Extract datasources
                applicationGitReference.setDatasources(readFiles(baseRepoPath.resolve(DATASOURCE_DIRECTORY), gson, ""));
                break;

            case 2:
            case 3:
            case 4:
                updateGitApplicationReference(baseRepoPath, gson, applicationGitReference, pageDirectory, fileFormatVersion);
                break;

            default:
        }
        applicationGitReference.setMetadata(metadata);

        Path jsLibDirectory = baseRepoPath.resolve(JS_LIB_DIRECTORY);
        Map<String, Object> jsLibrariesMap = readFiles(jsLibDirectory, gson, "");
        applicationGitReference.setJsLibraries(jsLibrariesMap);

        return applicationGitReference;
    }

    private void updateGitApplicationReference(Path baseRepoPath, Gson gson, ApplicationGitReference applicationGitReference, Path pageDirectory, int fileFormatVersion) {
        // Extract pages and nested actions and actionCollections
        File directory = pageDirectory.toFile();
        Map<String, Object> pageMap = new HashMap<>();
        Map<String, Object> actionMap = new HashMap<>();
        Map<String, String> actionBodyMap = new HashMap<>();
        Map<String, Object> actionCollectionMap = new HashMap<>();
        Map<String, String> actionCollectionBodyMap = new HashMap<>();
        // TODO same approach should be followed for modules(app level actions, actionCollections, widgets etc)
        if (directory.isDirectory()) {
            // Loop through all the directories and nested directories inside the pages directory to extract
            // pages, actions and actionCollections from the JSON files
            for (File page : Objects.requireNonNull(directory.listFiles())) {
                pageMap.put(page.getName(), readFile(page.toPath().resolve(CommonConstants.CANVAS + CommonConstants.JSON_EXTENSION), gson));

                if (fileFormatVersion >= 4) {
                    actionMap.putAll(readAction(page.toPath().resolve(ACTION_DIRECTORY), gson, page.getName(), actionBodyMap));
                } else {
                    actionMap.putAll(readFiles(page.toPath().resolve(ACTION_DIRECTORY), gson, page.getName()));
                }

                if (fileFormatVersion >= 3) {
                    actionCollectionMap.putAll(readActionCollection(page.toPath().resolve(ACTION_COLLECTION_DIRECTORY), gson, page.getName(), actionCollectionBodyMap));
                } else {
                    actionCollectionMap.putAll(readFiles(page.toPath().resolve(ACTION_COLLECTION_DIRECTORY), gson, page.getName()));
                }
            }
        }
        applicationGitReference.setActions(actionMap);
        applicationGitReference.setActionBody(actionBodyMap);
        applicationGitReference.setActionCollections(actionCollectionMap);
        applicationGitReference.setActionCollectionBody(actionCollectionBodyMap);
        applicationGitReference.setPages(pageMap);
        // Extract datasources
        applicationGitReference.setDatasources(readFiles(baseRepoPath.resolve(DATASOURCE_DIRECTORY), gson, ""));
    }

    private Integer getFileFormatVersion(Object metadata) {
        if (metadata == null) {
            return 1;
        }
        Gson gson = new Gson();
        JsonObject json = gson.fromJson(gson.toJson(metadata), JsonObject.class);
        JsonElement fileFormatVersion = json.get(CommonConstants.FILE_FORMAT_VERSION);
        return fileFormatVersion.getAsInt();
    }

    private boolean isFileFormatCompatible(int savedFileFormat) {
        return savedFileFormat <= CommonConstants.fileFormatVersion;
    }
}
