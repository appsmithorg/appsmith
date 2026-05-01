package com.external.utils;

import com.appsmith.external.models.DatasourceStructure;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class StructureUtilsTest {

    @Test
    public void testSanitizeCollectionName_normalName() {
        assertEquals("`users`", StructureUtils.sanitizeCollectionName("users"));
    }

    @Test
    public void testSanitizeCollectionName_nameWithBacktick() {
        assertEquals("`col``lection`", StructureUtils.sanitizeCollectionName("col`lection"));
    }

    @Test
    public void testSanitizeCollectionName_nullName() {
        assertEquals("``", StructureUtils.sanitizeCollectionName(null));
    }

    @Test
    public void testSanitizeCollectionName_nameWithInjectionAttempt() {
        String malicious = "users` REMOVE \"1\" IN users //";
        String sanitized = StructureUtils.sanitizeCollectionName(malicious);
        assertEquals("`users`` REMOVE \"1\" IN users //`", sanitized);
    }

    @Test
    public void testEscapeAqlStringLiteral_normalValue() {
        assertEquals("hello", StructureUtils.escapeAqlStringLiteral("hello"));
    }

    @Test
    public void testEscapeAqlStringLiteral_nullValue() {
        assertEquals("", StructureUtils.escapeAqlStringLiteral(null));
    }

    @Test
    public void testEscapeAqlStringLiteral_valueWithDoubleQuotes() {
        assertEquals("say \\\"hello\\\"", StructureUtils.escapeAqlStringLiteral("say \"hello\""));
    }

    @Test
    public void testEscapeAqlStringLiteral_valueWithBackslash() {
        assertEquals("path\\\\to\\\\file", StructureUtils.escapeAqlStringLiteral("path\\to\\file"));
    }

    @Test
    public void testEscapeAqlStringLiteral_valueWithNewlines() {
        assertEquals("line1\\nline2\\rline3", StructureUtils.escapeAqlStringLiteral("line1\nline2\rline3"));
    }

    @Test
    public void testEscapeAqlStringLiteral_injectionAttempt() {
        String malicious = "\" OR 1==1 RETURN document //";
        String escaped = StructureUtils.escapeAqlStringLiteral(malicious);
        assertEquals("\\\" OR 1==1 RETURN document //", escaped);
        assertFalse(escaped.startsWith("\""));
    }

    @Test
    public void testGetOneDocumentQuery_normalCollection() {
        String query = StructureUtils.getOneDocumentQuery("users");
        assertEquals("for doc in `users` limit 1 return doc", query);
    }

    @Test
    public void testGetOneDocumentQuery_injectionInCollectionName() {
        String malicious = "users` REMOVE \"1\" IN users //";
        String query = StructureUtils.getOneDocumentQuery(malicious);
        assertTrue(query.contains("`users`` REMOVE \"1\" IN users //`"));
        assertFalse(query.contains("REMOVE \"1\" IN users") && !query.contains("`"));
    }

    @Test
    public void testGenerateTemplates_withInjectionInFilterValue() {
        String collectionName = "testCollection";
        Map<String, Object> document = new HashMap<>();
        document.put("_id", "testCollection/123");
        document.put("_key", "\" OR 1==1 RETURN document //");
        document.put("_rev", "abc");
        document.put("name", "test");

        ArrayList<DatasourceStructure.Column> columns = new ArrayList<>();
        ArrayList<DatasourceStructure.Template> templates = new ArrayList<>();

        StructureUtils.generateTemplatesAndStructureForACollection(collectionName, document, columns, templates);

        assertEquals(4, templates.size());

        DatasourceStructure.Template selectTemplate = templates.stream()
                .filter(t -> "Select".equals(t.getTitle()))
                .findFirst()
                .orElse(null);
        assertTrue(selectTemplate != null);
        String selectQuery = selectTemplate.getBody();
        assertTrue(selectQuery.contains("\\\" OR 1==1 RETURN document //"));
        assertFalse(selectQuery.contains("== \"\" OR 1==1"));

        DatasourceStructure.Template deleteTemplate = templates.stream()
                .filter(t -> "Delete".equals(t.getTitle()))
                .findFirst()
                .orElse(null);
        assertTrue(deleteTemplate != null);
        String deleteQuery = deleteTemplate.getBody();
        assertTrue(deleteQuery.contains("\\\" OR 1==1 RETURN document //"));
        assertFalse(deleteQuery.contains("\"\" OR 1==1"));

        DatasourceStructure.Template updateTemplate = templates.stream()
                .filter(t -> "Update".equals(t.getTitle()))
                .findFirst()
                .orElse(null);
        assertTrue(updateTemplate != null);
        String updateQuery = updateTemplate.getBody();
        assertTrue(updateQuery.contains("\\\" OR 1==1 RETURN document //"));
    }

    @Test
    public void testGenerateTemplates_withInjectionInCollectionName() {
        String maliciousCollectionName = "users` REMOVE \"1\" IN users //";
        Map<String, Object> document = new HashMap<>();
        document.put("_id", "test/123");
        document.put("_key", "123");
        document.put("_rev", "abc");

        ArrayList<DatasourceStructure.Column> columns = new ArrayList<>();
        ArrayList<DatasourceStructure.Template> templates = new ArrayList<>();

        StructureUtils.generateTemplatesAndStructureForACollection(
                maliciousCollectionName, document, columns, templates);

        assertEquals(4, templates.size());

        for (DatasourceStructure.Template template : templates) {
            String query = template.getBody();
            assertTrue(
                    query.contains("`users`` REMOVE \"1\" IN users //`"),
                    "Template '" + template.getTitle() + "' should contain escaped collection name");
        }
    }

    @Test
    public void testGenerateTemplates_normalValues() {
        String collectionName = "users";
        Map<String, Object> document = new HashMap<>();
        document.put("_id", "users/12345");
        document.put("_key", "12345");
        document.put("_rev", "abc");
        document.put("name", "John");

        ArrayList<DatasourceStructure.Column> columns = new ArrayList<>();
        ArrayList<DatasourceStructure.Template> templates = new ArrayList<>();

        StructureUtils.generateTemplatesAndStructureForACollection(collectionName, document, columns, templates);

        assertEquals(4, templates.size());

        DatasourceStructure.Template selectTemplate = templates.stream()
                .filter(t -> "Select".equals(t.getTitle()))
                .findFirst()
                .orElse(null);
        assertTrue(selectTemplate != null);
        assertTrue(selectTemplate.getBody().contains("`users`"));
        assertTrue(selectTemplate.getBody().contains("\"12345\""));

        DatasourceStructure.Template createTemplate = templates.stream()
                .filter(t -> "Create".equals(t.getTitle()))
                .findFirst()
                .orElse(null);
        assertTrue(createTemplate != null);
        assertTrue(createTemplate.getBody().contains("`users`"));

        DatasourceStructure.Template deleteTemplate = templates.stream()
                .filter(t -> "Delete".equals(t.getTitle()))
                .findFirst()
                .orElse(null);
        assertTrue(deleteTemplate != null);
        assertTrue(deleteTemplate.getBody().contains("`users`"));
        assertTrue(deleteTemplate.getBody().contains("\"12345\""));
    }
}
