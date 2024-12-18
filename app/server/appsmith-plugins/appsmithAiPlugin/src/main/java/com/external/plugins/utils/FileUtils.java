package com.external.plugins.utils;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.dtos.FileMetadataDTO;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiConstants.DATA;
import static com.external.plugins.constants.AppsmithAiConstants.FILES;
import static com.external.plugins.constants.AppsmithAiConstants.FILE_IDS;

public class FileUtils {
    public static boolean hasFiles(DatasourceConfiguration datasourceConfiguration) {
        return getFileIds(datasourceConfiguration).size() > 0;
    }

    public static List<String> getFileIds(DatasourceConfiguration datasourceConfiguration) {
        if (datasourceConfiguration != null
                && datasourceConfiguration.getProperties() != null
                && datasourceConfiguration.getProperties().size() > 0) {
            for (Property property : datasourceConfiguration.getProperties()) {
                if (property.getKey().equalsIgnoreCase(FILES)
                        && property.getValue() != null
                        && property.getValue() instanceof List) {
                    List<FileMetadataDTO> files = convertIntoFiles((List<Map<String, Object>>) property.getValue());
                    return files.stream().map(FileMetadataDTO::getId).toList();
                }
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

    private static List<FileMetadataDTO> convertIntoFiles(List<Map<String, Object>> files) {
        List<FileMetadataDTO> fileMetadataDTOList = new ArrayList<>();
        for (Map<String, Object> file : files) {
            FileMetadataDTO fileMetadataDTOObj = new FileMetadataDTO();
            fileMetadataDTOObj.setId((String) file.get("id"));
            fileMetadataDTOObj.setName((String) file.get("name"));
            fileMetadataDTOObj.setSize((Integer) file.get("size"));
            fileMetadataDTOObj.setMimetype((String) file.get("mimetype"));
            fileMetadataDTOList.add(fileMetadataDTOObj);
        }
        return fileMetadataDTOList;
    }
}
