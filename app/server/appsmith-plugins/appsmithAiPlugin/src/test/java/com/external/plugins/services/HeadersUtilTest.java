package com.external.plugins.services;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.external.plugins.utils.HeadersUtil;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class HeadersUtilTest {

    @Test
    void testCreateSourceDetailsHeader_ValidInput() {
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId("action123");
        executeActionDTO.setDatasourceId("datasource456");
        executeActionDTO.setWorkspaceId("workspace789");
        executeActionDTO.setInstanceId("instance987");

        String expectedHeader =
                "actionId:action123;datasourceId:datasource456;workspaceId:workspace789;instanceId:instance987";
        String actualHeader = HeadersUtil.createSourceDetailsHeader(executeActionDTO);

        assertEquals(expectedHeader, actualHeader);
    }

    @Test
    void testCreateSourceDetailsHeader_NullInput() {
        //        assertThrows(NullPointerException.class, () -> HeadersUtil.createSourceDetailsHeader( null));
    }

    @Test
    void testCreateSourceDetailsHeader_NullFields() {
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();

        String expectedHeader = "actionId:null;datasourceId:null;workspaceId:null;instanceId:null";
        String actualHeader = HeadersUtil.createSourceDetailsHeader(executeActionDTO);

        assertEquals(expectedHeader, actualHeader);
    }
}
