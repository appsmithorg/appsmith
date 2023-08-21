package com.appsmith.external.helpers;

import com.appsmith.external.constants.CommonFieldName;
import com.appsmith.external.dtos.EnvironmentDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class EnvironmentNameCaseStrategyTest {

    ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void testSmallerCaseIsSelectivelyChangedWhileDeserialization() throws JsonProcessingException {

        String environmentDTOJsonStaging = "{\n" + "  \"name\" : \"Staging\",\n"
                + "\t\"workspaceId\": \"sampleWorkspaceId\",\n"
                + "\t\"isDefault\" : false\n"
                + "} ";

        EnvironmentDTO environmentDTO = objectMapper.readValue(environmentDTOJsonStaging, EnvironmentDTO.class);
        assertThat(environmentDTO.getName()).isEqualTo(CommonFieldName.STAGING_ENVIRONMENT);

        String environmentDTOJsonProduction = "{\n" + "  \"name\" : \"Production\",\n"
                + "\t\"workspaceId\": \"sampleWorkspaceId\",\n"
                + "\t\"isDefault\" : false\n"
                + "} ";

        EnvironmentDTO environmentDTOProduction =
                objectMapper.readValue(environmentDTOJsonProduction, EnvironmentDTO.class);
        assertThat(environmentDTOProduction.getName()).isEqualTo(CommonFieldName.PRODUCTION_ENVIRONMENT);

        String environmentDTOJsonSample = "{\n" + "  \"name\" : \"Sample\",\n"
                + "\t\"workspaceId\": \"sampleWorkspaceId\",\n"
                + "\t\"isDefault\" : false\n"
                + "} ";

        EnvironmentDTO environmentDTOSample = objectMapper.readValue(environmentDTOJsonSample, EnvironmentDTO.class);
        assertThat(environmentDTOSample.getName()).isEqualTo("Sample");
    }

    @Test
    public void testSmallerCaseIsSelectivelyChangedWhileSerialization() throws JsonProcessingException {

        EnvironmentDTO environmentDTOProduction = new EnvironmentDTO();
        environmentDTOProduction.setName(CommonFieldName.PRODUCTION_ENVIRONMENT);

        String json = objectMapper.writeValueAsString(environmentDTOProduction);
        assertThat(json).contains("Production");

        EnvironmentDTO environmentDTOStaging = new EnvironmentDTO();
        environmentDTOStaging.setName(CommonFieldName.STAGING_ENVIRONMENT);

        String jsonStaging = objectMapper.writeValueAsString(environmentDTOStaging);
        assertThat(jsonStaging).contains("Staging");

        EnvironmentDTO environmentDTOSample = new EnvironmentDTO();
        environmentDTOSample.setName("sample");

        String jsonSample = objectMapper.writeValueAsString(environmentDTOSample);
        assertThat(jsonSample).contains("sample");
        assertThat(jsonSample).doesNotContain("Sample");
    }
}
