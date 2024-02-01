package com.external.plugins.utils;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.dtos.File;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.DATA;
import static com.external.plugins.constants.AppsmithAiConstants.FILE_IDS;

public class FileUtils {
    public static boolean hasFiles(DatasourceConfiguration datasourceConfiguration) {
        return getFileIds(datasourceConfiguration).size() > 0;
    }

    public static List<String> getFileIds(DatasourceConfiguration datasourceConfiguration) {
        if (datasourceConfiguration.getProperties() != null
                && datasourceConfiguration.getProperties().size() > 0) {
            Property fileProperty = datasourceConfiguration.getProperties().get(0);
            if (fileProperty.getKey().equalsIgnoreCase("files")
                    && fileProperty.getValue() != null
                    && fileProperty.getValue() instanceof List) {
                List<File> files = convertIntoFiles((List<Map<String, Object>>) fileProperty.getValue());
                return files.stream().map(File::getId).toList();
            }
        }
        return List.of();
    }

    public static List<String> getFileIds(ActionConfiguration actionConfiguration) {
        if (actionConfiguration.getFormData() != null
                && actionConfiguration.getFormData().size() > 0) {
            Map<String, Object> formData = actionConfiguration.getFormData();
            if (formData.containsKey(FILE_IDS) && formData.get(FILE_IDS) != null) {
                List<String> fileIds = (List<String>) ((Map<String, Object>) formData.get(FILE_IDS)).get(DATA);
                return fileIds;
            }
        }
        return List.of();
    }

    private static List<File> convertIntoFiles(List<Map<String, Object>> files) {
        List<File> fileList = new ArrayList<>();
        for (Map<String, Object> file : files) {
            File fileObj = new File();
            fileObj.setId((String) file.get("id"));
            fileObj.setName((String) file.get("name"));
            fileObj.setSize((Integer) file.get("size"));
            fileObj.setMimetype((String) file.get("mimetype"));
            fileList.add(fileObj);
        }
        return fileList;
    }
}
