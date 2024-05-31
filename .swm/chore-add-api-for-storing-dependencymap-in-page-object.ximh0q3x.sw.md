---
title: 'chore: Add API for storing dependencyMap in page object'
---
# Introduction

This document will walk you through the implementation of the feature for storing a dependency map in the page object. This feature allows us to keep track of dependencies between different elements on a page, which is crucial for maintaining the integrity of the application and ensuring that changes to one element do not inadvertently affect others.

We will cover:

1. How the API endpoint for updating the dependency map is defined.


2. How the dependency map is stored in the page object.


3. How the service for updating the dependency map is implemented.


4. How the repository for updating the dependency map is implemented.


5. How the feature is tested to ensure its correct functionality.

# Defining the API endpoint

<SwmSnippet path="/app/server/appsmith-server/src/main/java/com/appsmith/server/controllers/ce/PageControllerCE.java" line="158">

---

The API endpoint for updating the dependency map is defined in the PageControllerCE.java file. This endpoint accepts a PUT request at the path /{defaultPageId}/dependencyMap. The request body should contain the dependency map to be stored, and optionally, a branch name can be provided in the request header. The endpoint calls the updateDependencyMap method of the newPageService to perform the update operation.

```java
    @JsonView(Views.Public.class)
    @PutMapping("/{defaultPageId}")
    public Mono<ResponseDTO<PageDTO>> updatePage(
            @PathVariable String defaultPageId,
            @RequestBody @Valid PageUpdateDTO resource,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to update page with id: {}, branchName: {}", defaultPageId, branchName);
        return newPageService
                .updatePageByDefaultPageIdAndBranch(defaultPageId, resource, branchName)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }
```

---

</SwmSnippet>

# Storing the dependency map in the page object

<SwmSnippet path="/app/server/appsmith-server/src/main/java/com/appsmith/server/domains/NewPage.java" line="49">

---

The dependency map is stored in the unpublishedPage object of the NewPage class. This is done by defining a static string unpublishedPage_dependencyMap which is a concatenation of unpublishedPage and dependencyMap. This allows us to directly access and manipulate the dependency map of the unpublished page.

```java
        public static String unpublishedPage_deletedAt = unpublishedPage + "." + PageDTO.Fields.deletedAt;
```

---

</SwmSnippet>

<SwmSnippet path="/app/server/appsmith-server/src/main/java/com/appsmith/server/dtos/PageDTO.java" line="77">

---

The PageDTO class also has a dependencyMap field. This field is annotated with @JsonView(Views.Public.class), which means it will be included in the JSON view when the page object is serialized. The sanitiseToExportDBObject method sets the dependencyMap to null, ensuring that it is not included when the page object is exported.

```java
    @JsonView(Views.Public.class)
    DefaultResources defaultResources;

    public void sanitiseToExportDBObject() {
```

---

</SwmSnippet>

# Implementing the service for updating the dependency map

# Implementing the repository for updating the dependency map

# Testing the feature

<SwmSnippet path="/app/server/appsmith-server/src/test/java/com/appsmith/server/services/NewPageServiceTest.java" line="171">

---

The NewPageServiceTest.java file contains tests that ensure the correct functionality of the feature. These tests create a new application and a new page, then call the updateDependencyMap method with different inputs and check if the dependency map of the page is updated correctly.

```java
    @Test
    @WithUserDetails("api_user")
    public void findApplicationPages_WhenPageIdPresent_ReturnsPages() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("app_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = applicationPageService
                .createApplication(application, workspaceId)
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application1.getId());
                    return applicationPageService.createPage(pageDTO);
                })
                .flatMap(pageDTO ->
                        newPageService.findApplicationPages(null, pageDTO.getId(), null, ApplicationMode.EDIT));

        StepVerifier.create(applicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getApplication()).isNotNull();
                    assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo("app_" + randomId);
                    assertThat(applicationPagesDTO.getPages()).isNotEmpty();
                    applicationPagesDTO.getPages().forEach(pageNameIdDTO -> assertThat(
                                    pageNameIdDTO.getUserPermissions())
                            .isNotEmpty());
                })
```

---

</SwmSnippet>

<SwmSnippet path="/app/server/appsmith-server/src/test/java/com/appsmith/server/services/NewPageServiceTest.java" line="171">

---

&nbsp;

```java
    @Test
    @WithUserDetails("api_user")
    public void findApplicationPages_WhenPageIdPresent_ReturnsPages() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("app_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = applicationPageService
                .createApplication(application, workspaceId)
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application1.getId());
                    return applicationPageService.createPage(pageDTO);
                })
                .flatMap(pageDTO ->
                        newPageService.findApplicationPages(null, pageDTO.getId(), null, ApplicationMode.EDIT));

        StepVerifier.create(applicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getApplication()).isNotNull();
                    assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo("app_" + randomId);
                    assertThat(applicationPagesDTO.getPages()).isNotEmpty();
                    applicationPagesDTO.getPages().forEach(pageNameIdDTO -> assertThat(
                                    pageNameIdDTO.getUserPermissions())
                            .isNotEmpty());
                })
```

---

</SwmSnippet>

<SwmSnippet path="/app/server/appsmith-server/src/test/java/com/appsmith/server/services/NewPageServiceTest.java" line="105">

---

&nbsp;

```java
    @Test
    @WithUserDetails("api_user")
    public void findApplicationPages_WhenApplicationIdPresent_ReturnsPages() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("app_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = applicationPageService
                .createApplication(application, workspaceId)
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application1.getId());
                    return applicationPageService.createPage(pageDTO);
                })
                .flatMap(pageDTO -> newPageService.findApplicationPages(
```

---

</SwmSnippet>

<SwmMeta version="3.0.0" repo-id="Z2l0aHViJTNBJTNBYXBwc21pdGglM0ElM0FhcHBzbWl0aG9yZw=="><sup>Powered by [Swimm](https://app.swimm.io/)</sup></SwmMeta>
