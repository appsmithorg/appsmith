package com.appsmith.git.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.converters.GsonDoubleToLongConverter;
import com.appsmith.git.converters.GsonUnorderedToOrderedSetConverter;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
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
import reactor.core.publisher.Mono;

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
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.appsmith.git.constants.GitDirectories.ACTION_COLLECTION_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.ACTION_DIRECTORY;
import static com.appsmith.git.constants.GitDirectories.DATASOURCE_DIRECTORY;
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

    private static final Pattern FILE_EXTENSION_PATTERN = Pattern.compile("(.*?)\\.(md|git|gitignore)$");


    /**
     * This method will save the complete application in the local repo directory.
     * Path to repo will be : ./container-volumes/git-repo/organizationId/defaultApplicationId/repoName/{application_data}
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
                .then(gitExecutor.checkoutToBranch(baseRepoSuffix, branchName))
                .flatMap(isSwitched -> {

                    Path baseRepo = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix);

                    // Gson to pretty format JSON file
                    // Keep Long type as is by default GSON have behavior to convert to Double
                    // Convert unordered set to ordered one
                    Gson gson = new GsonBuilder()
                            .registerTypeAdapter(Double.class,  new GsonDoubleToLongConverter())
                            .registerTypeAdapter(Set.class, new GsonUnorderedToOrderedSetConverter())
                            .disableHtmlEscaping()
                            .setPrettyPrinting()
                            .create();

                    Set<String> validFileNames = new HashSet<>();

                    /*
                    Application will be stored in the following structure :
                    repo
                    --Application
                    ----Datasource
                        --datasource1Name
                        --datasource2Name
                    ----Actions (Only requirement here is the filename should be unique)
                        --action1_page1
                        --action2_page2
                    ----Pages
                        --page1
                        --page2
                     */

                    // Save application
                    saveFile(applicationGitReference.getApplication(), baseRepo.resolve("application.json"), gson);

                    // Save application metadata
                    saveFile(applicationGitReference.getMetadata(), baseRepo.resolve("metadata.json"), gson);

                    // Save pages
                    for (Map.Entry<String, Object> resource : applicationGitReference.getPages().entrySet()) {
                        saveFile(resource.getValue(), baseRepo.resolve(PAGE_DIRECTORY).resolve(resource.getKey() + ".json"), gson);
                        validFileNames.add(resource.getKey() + ".json");
                    }
                    // Scan page directory and delete if any unwanted file if present
                    scanAndDeleteFileForDeletedResources(validFileNames, baseRepo.resolve(PAGE_DIRECTORY));
                    validFileNames.clear();

                    // Save actions
                    for (Map.Entry<String, Object> resource : applicationGitReference.getActions().entrySet()) {
                        saveFile(resource.getValue(), baseRepo.resolve(ACTION_DIRECTORY).resolve(resource.getKey() + ".json"), gson);
                        validFileNames.add(resource.getKey() + ".json");
                    }
                    // Scan actions directory and delete if any unwanted file if present
                    if (!applicationGitReference.getActions().isEmpty()) {
                        scanAndDeleteFileForDeletedResources(validFileNames, baseRepo.resolve(ACTION_DIRECTORY));
                        validFileNames.clear();
                    }

                    // Save jsActionCollections
                    for (Map.Entry<String, Object> resource : applicationGitReference.getActionsCollections().entrySet()) {
                        saveFile(resource.getValue(), baseRepo.resolve(ACTION_COLLECTION_DIRECTORY).resolve(resource.getKey() + ".json"), gson);
                        validFileNames.add(resource.getKey() + ".json");
                    }
                    // Scan actionCollections directory and delete if any unwanted file if present
                    if (!applicationGitReference.getActionsCollections().isEmpty()) {
                        scanAndDeleteFileForDeletedResources(validFileNames, baseRepo.resolve(ACTION_COLLECTION_DIRECTORY));
                        validFileNames.clear();
                    }

                    // Save datasources ref
                    for (Map.Entry<String, Object> resource : applicationGitReference.getDatasources().entrySet()) {
                        saveFile(resource.getValue(), baseRepo.resolve(DATASOURCE_DIRECTORY).resolve(resource.getKey() + ".json"), gson);
                        validFileNames.add(resource.getKey() + ".json");
                    }
                    // Scan page directory and delete if any unwanted file if present
                    if (!applicationGitReference.getDatasources().isEmpty()) {
                        scanAndDeleteFileForDeletedResources(validFileNames, baseRepo.resolve(DATASOURCE_DIRECTORY));
                    }
                    processStopwatch.stopAndLogTimeInMillis();
                    return Mono.just(baseRepo);
                });
    }

    /**
     * This method will be used to store the DB resource to JSON file
     * @param sourceEntity resource extracted from DB to be stored in file
     * @param path file path where the resource to be stored
     * @param gson
     * @return if the file operation is successful
     */
    private boolean saveFile(Object sourceEntity, Path path, Gson gson) {
        try {
            Files.createDirectories(path.getParent());
            try (BufferedWriter fileWriter = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
                gson.toJson(sourceEntity, fileWriter);
                return true;
            }
        } catch (IOException e) {
            log.debug(e.getMessage());
        }
        return false;
    }

    /**
     * This method will delete the JSON resource available in local git directory on subsequent commit made after the
     * deletion of respective resource from DB
     * @param validResources resources those are still available in DB
     * @param resourceDirectory directory which needs to be scanned for possible file deletion operations
     */
    private void scanAndDeleteFileForDeletedResources(Set<String> validResources, Path resourceDirectory) {
        // Scan resource directory and delete any unwanted file if present
        // unwanted file : corresponding resource from DB has been deleted
        try (Stream<Path> paths = Files.walk(resourceDirectory)) {
            paths
                .filter(path -> Files.isRegularFile(path) && !validResources.contains(path.getFileName().toString()))
                .forEach(path -> deleteFile(path, false));
        } catch (IOException e) {
            log.debug("Error while scanning directory: {}, with error {}", resourceDirectory, e);
        }
    }

    /**
     * This method will delete the file from local repo
     * @param filePath file that needs to be deleted
     * @param isDirectory if the file is directory
     */
    private void deleteFile(Path filePath, boolean isDirectory) {
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
        ApplicationGitReference applicationGitReference = new ApplicationGitReference();

        // Checkout to mentioned branch if not already checked-out
        return gitExecutor.checkoutToBranch(baseRepoSuffix, branchName)
                .map(isSwitched -> {

                    Path baseRepoPath = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix);

                    // Instance creator is required while de-serialising using Gson as key instance can't be invoked with
                    // no-args constructor
                    Gson gson = new GsonBuilder()
                        .registerTypeAdapter(DatasourceStructure.Key.class, new DatasourceStructure.KeyInstanceCreator())
                        .create();

                    // Extract application data from the json
                    applicationGitReference.setApplication(readFile(baseRepoPath.resolve("application.json"), gson));

                    // Extract application metadata from the json
                    applicationGitReference.setMetadata(readFile(baseRepoPath.resolve("metadata.json"), gson));

                    // Extract actions
                    applicationGitReference.setActions(readFiles(baseRepoPath.resolve(ACTION_DIRECTORY), gson));

                    // Extract actionCollections
                    applicationGitReference.setActionsCollections(readFiles(baseRepoPath.resolve(ACTION_COLLECTION_DIRECTORY), gson));

                    // Extract pages
                    applicationGitReference.setPages(readFiles(baseRepoPath.resolve(PAGE_DIRECTORY), gson));

                    // Extract datasources
                    applicationGitReference.setDatasources(readFiles(baseRepoPath.resolve(DATASOURCE_DIRECTORY), gson));

                    processStopwatch.stopAndLogTimeInMillis();
                    return applicationGitReference;
                });
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
    public Mono<Path> initializeGitRepo(Path baseRepoSuffix,
                                        String viewModeUrl,
                                        String editModeUrl) throws IOException {
        ClassLoader classLoader = getClass().getClassLoader();
        InputStream inputStream = classLoader.getResourceAsStream(gitServiceConfig.getReadmeTemplatePath());

        StringWriter stringWriter = new StringWriter();
        IOUtils.copy(inputStream, stringWriter, "UTF-8");
        String data = stringWriter.toString().replace(EDIT_MODE_URL_TEMPLATE, editModeUrl).replace(VIEW_MODE_URL_TEMPLATE, viewModeUrl);

        File file = new File(Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix).toFile().toString());
        FileUtils.writeStringToFile(file, data, "UTF-8", true);

        // Remove readme.md from the path
        return Mono.just(file.toPath().getParent());
    }

    @Override
    public Mono<Boolean> detachRemote(Path baseRepoSuffix) {
        File file = Paths.get(gitServiceConfig.getGitRootPath()).resolve(baseRepoSuffix).toFile();
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
                if(!FILE_EXTENSION_PATTERN.matcher(file.getName()).matches() && !file.getName().equals("LICENSE")) {
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
    private Map<String, Object> readFiles(Path directoryPath, Gson gson) {
        Map<String, Object> resource = new HashMap<>();
        File directory = directoryPath.toFile();
        if (directory.isDirectory()) {
            Arrays.stream(Objects.requireNonNull(directory.listFiles())).forEach(file -> {
                try (JsonReader reader = new JsonReader(new FileReader(file))) {
                    resource.put(file.getName(), gson.fromJson(reader, Object.class));
                } catch (Exception e) {
                    log.debug(e.getMessage());
                }
            });
        }
        return resource;
    }
}
