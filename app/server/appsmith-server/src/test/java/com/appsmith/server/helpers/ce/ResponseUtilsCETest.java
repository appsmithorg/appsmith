package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.helpers.ResponseUtils;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class ResponseUtilsCETest {

    @Autowired
    private ResponseUtils responseUtils;

    @Test
    public void updateCollectionDTOWithDefaultResources() {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setId("child-id");

        DefaultResources defaultResourceIds = new DefaultResources();
        defaultResourceIds.setCollectionId("default-collection-id");
        actionCollectionDTO.setDefaultResources(defaultResourceIds);

        ActionDTO actionDTO = new ActionDTO();
        actionCollectionDTO.setActions(List.of(actionDTO));

        ActionCollectionDTO updatedActionCollectionDTO =
                responseUtils.updateCollectionDTOWithDefaultResources(actionCollectionDTO);
        assertThat(updatedActionCollectionDTO).isNotNull();
        assertThat(updatedActionCollectionDTO.getId()).isEqualTo("default-collection-id");
        updatedActionCollectionDTO.getActions().forEach(actionDTO1 -> {
            assertThat(actionDTO1.getCollectionId()).isEqualTo("default-collection-id");
        });
    }
}
