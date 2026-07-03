package com.appsmith.server.helpers;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.MongoTransactionException;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

class ImportExportUtilsTest {

    @Test
    void getErrorMessage_filterTransactionalError_returnEmptyString() {
        Throwable throwable = new MongoTransactionException(
                "Command failed with error 251 (NoSuchTransaction): 'Transaction 1 has been aborted.");
        String errorMessage = ImportExportUtils.getErrorMessage(throwable);
        Assertions.assertEquals(errorMessage, "");
    }

    @Test
    void getErrorMessage_genericException_returnActualMessage() {
        Throwable throwable = new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR);
        String errorMessage = ImportExportUtils.getErrorMessage(throwable);
        Assertions.assertEquals(errorMessage, "Error: " + throwable.getMessage());
    }

    @Test
    void isPageNameInUpdatedList() {
        String pageName = "Page1";
        Set<String> updatedPageNames = Set.of("Page1", "Page2");
        ApplicationJson applicationJson = new ApplicationJson();
        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, pageName));

        applicationJson.setModifiedResources(new ModifiedResources());
        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, pageName));

        ModifiedResources modifiedResources = new ModifiedResources();
        modifiedResources.putResource(FieldName.PAGE_LIST, Set.of("Page1", "Page2"));
        applicationJson.setModifiedResources(modifiedResources);
        Assertions.assertTrue(ImportExportUtils.isPageNameInUpdatedList(applicationJson, pageName));

        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, pageName.toLowerCase()));
        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, "test"));
        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, ""));
        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, null));
    }

    @Test
    public void isDatasourceUpdatedSinceLastCommit() {
        Map<String, Instant> map = Map.of("Datasource1", Instant.now());
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setDatasource(new Datasource());
        // should return true if datasource has no id set
        Assertions.assertFalse(ImportExportUtils.isDatasourceUpdatedSinceLastCommit(
                map, actionDTO, Instant.now().minusSeconds(10)));

        actionDTO.getDatasource().setName("Datasource1");
        // should return false if datasource has name set but no id
        Assertions.assertFalse(ImportExportUtils.isDatasourceUpdatedSinceLastCommit(
                map, actionDTO, Instant.now().minusSeconds(10)));

        actionDTO.getDatasource().setId("Datasource2");
        // should return false if datasource id does not exist in the map
        Assertions.assertFalse(ImportExportUtils.isDatasourceUpdatedSinceLastCommit(
                map, actionDTO, Instant.now().minusSeconds(10)));

        actionDTO.getDatasource().setId("Datasource1");
        // should return true if datasource has name set but no id
        Assertions.assertTrue(ImportExportUtils.isDatasourceUpdatedSinceLastCommit(
                map, actionDTO, Instant.now().minusSeconds(10)));

        // should return false if datasource was modified before last commit
        Assertions.assertFalse(ImportExportUtils.isDatasourceUpdatedSinceLastCommit(
                map, actionDTO, Instant.now().plusSeconds(10)));

        // should return false if last commit date is null
        Assertions.assertFalse(ImportExportUtils.isDatasourceUpdatedSinceLastCommit(map, actionDTO, null));
    }

    @Test
    void generateUniqueNameForImport_noClash_returnsNameUnchanged() {
        Assertions.assertEquals(
                "JSObject1", ImportExportUtils.generateUniqueNameForImport("JSObject1", Set.of("Query1")));
    }

    @Test
    void generateUniqueNameForImport_numberedNameClashes_incrementsFromExistingNumber() {
        // JSObject1 already exists -> JSObject2 (not JSObject11)
        Assertions.assertEquals(
                "JSObject2", ImportExportUtils.generateUniqueNameForImport("JSObject1", Set.of("JSObject1")));
        // JSObject1 and JSObject2 exist -> JSObject3
        Assertions.assertEquals(
                "JSObject3",
                ImportExportUtils.generateUniqueNameForImport("JSObject1", Set.of("JSObject1", "JSObject2")));
    }

    @Test
    void generateUniqueNameForImport_unnumberedNameClashes_appendsNumber() {
        Assertions.assertEquals("Query1", ImportExportUtils.generateUniqueNameForImport("Query", Set.of("Query")));
        Assertions.assertEquals(
                "Query2", ImportExportUtils.generateUniqueNameForImport("Query", Set.of("Query", "Query1")));
    }

    @Test
    void generateUniqueNameForImport_nullName_returnsNull() {
        Assertions.assertNull(ImportExportUtils.generateUniqueNameForImport(null, Set.of("Query")));
    }

    @Test
    void generateUniqueNameForImport_gapInSequence_picksFirstFreeAboveOwnSuffix() {
        // JSObject1 clashes; JSObject2 free even though JSObject3 exists -> JSObject2
        Assertions.assertEquals(
                "JSObject2",
                ImportExportUtils.generateUniqueNameForImport("JSObject1", Set.of("JSObject1", "JSObject3")));
    }

    @Test
    void generateUniqueNameForImport_internalDigitOnly_appendsNumber() {
        // "get4Items" has no TRAILING digit -> treated as base, append 1
        Assertions.assertEquals(
                "get4Items1", ImportExportUtils.generateUniqueNameForImport("get4Items", Set.of("get4Items")));
    }

    @Test
    void generateUniqueNameForImport_allDigitName_incrementsNumber() {
        Assertions.assertEquals("124", ImportExportUtils.generateUniqueNameForImport("123", Set.of("123")));
    }

    @Test
    void generateUniqueNameForImport_oversizedNumericSuffix_fallsBackToAppendingOne() {
        // 20-digit suffix overflows long -> NumberFormatException guard -> base=whole name, append 1
        String huge = "Q" + "9".repeat(20);
        Assertions.assertEquals(huge + "1", ImportExportUtils.generateUniqueNameForImport(huge, Set.of(huge)));
    }

    @Test
    void generateUniqueNameForImport_maxLongSuffix_fallsBackToAppendingOne() {
        // Suffix == Long.MAX_VALUE parses fine but suffix++ would overflow to a negative value;
        // it must fall back to appending 1 to the whole name rather than producing "Q-9223372036854775808".
        String maxLong = "Q" + Long.MAX_VALUE;
        Assertions.assertEquals(maxLong + "1", ImportExportUtils.generateUniqueNameForImport(maxLong, Set.of(maxLong)));
    }
}
