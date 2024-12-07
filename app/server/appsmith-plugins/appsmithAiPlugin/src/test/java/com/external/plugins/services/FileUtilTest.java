package com.external.plugins.services;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.utils.FileUtils;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
public class FileUtilTest {
    @Test
    public void getFileIds_withNullDatasourceConfig_returnsEmptyList() {
        DatasourceConfiguration datasourceConfiguration = null;
        List<String> actualFileIds = FileUtils.getFileIds(datasourceConfiguration);
        assertThat(actualFileIds).isEmpty();
    }

    @Test
    public void getFileIds_withValidDatasourceConfig_returnsFileIdList() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("https://example.com");

        // create file object
        Map<String, Object> fileMap = new HashMap<String, Object>();
        fileMap.put("id", "fileId");
        fileMap.put("name", "fileName");
        fileMap.put("size", 10);
        fileMap.put("mimetype", "fileMimetype");

        Property property = new Property();
        property.setKey("Files");
        property.setValue(List.of(fileMap));

        datasourceConfiguration.setProperties(List.of(property));
        List<String> actualFileIds = FileUtils.getFileIds(datasourceConfiguration);
        assertThat(actualFileIds).contains("fileId");
    }
}
