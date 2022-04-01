package com.appsmith.server.helpers;

import com.appsmith.server.dtos.DslActionDTO;
import org.junit.Test;

import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;

public class CompareDslActionDTOTest {

    List<String> sortedActionIds = new LinkedList<>();
    TreeSet<DslActionDTO> orderedActionSet = new TreeSet<>(new CompareDslActionDTO());

    @Test
    public void convert_whenNullActionIds_returnsSetInInputOrder() {
        DslActionDTO action1 = new DslActionDTO();
        DslActionDTO action2 = new DslActionDTO();
        action1.setName("testName");
        action2.setName("testName2");
        Set<DslActionDTO> unorderedSet = Set.of(action1, action2);
        orderedActionSet.addAll(unorderedSet);
        List<String> sortedActionNames = new LinkedList<>();
        for (DslActionDTO dslActionDTO : orderedActionSet) {
            sortedActionNames.add(dslActionDTO.getName());
        }
        List<String> actionNames = new LinkedList<>();
        for (DslActionDTO dslActionDTO : unorderedSet) {
            actionNames.add(dslActionDTO.getName());
        }
        assertThat(sortedActionNames).isEqualTo(actionNames);
    }

    @Test
    public void convert_whenEmptyActionIdSet_returnsSetInInputOrder() {
        DslActionDTO action1 = new DslActionDTO();
        DslActionDTO action2 = new DslActionDTO();
        action1.setId("");
        action2.setId("abcd");
        Set<DslActionDTO> actionSet = Set.of(action1, action2);
        orderedActionSet.addAll(actionSet);
        for (DslActionDTO dslActionDTO : orderedActionSet) {
            sortedActionIds.add(dslActionDTO.getId());
        }
        List<String> actionIds = new LinkedList<>();
        for (DslActionDTO dslActionDTO : actionSet) {
            actionIds.add(dslActionDTO.getId());
        }
        // Two lists are defined to be equal if they contain the same elements in the same order.
        assertThat(sortedActionIds).isEqualTo(actionIds);
    }

    @Test
    public void convert_whenNonEmptySet_returnsOrderedResult() {
        DslActionDTO action1 = new DslActionDTO();
        DslActionDTO action2 = new DslActionDTO();
        DslActionDTO action3 = new DslActionDTO();
        DslActionDTO action4 = new DslActionDTO();
        DslActionDTO action5 = new DslActionDTO();
        DslActionDTO action6 = new DslActionDTO();
        action1.setId("abc");
        action2.setId("0abc");
        action3.setId("1abc");
        action4.setId("abc0");
        action5.setId("abc1");
        action6.setId("abcd");
        Set<DslActionDTO> actionSet = Set.of(action1, action2, action3, action4, action5, action6);
        orderedActionSet.addAll(actionSet);
        for (DslActionDTO dslActionDTO : orderedActionSet) {
            sortedActionIds.add(dslActionDTO.getId());
        }
        // Two lists are defined to be equal if they contain the same elements in the same order.
        assertThat(sortedActionIds).isEqualTo(List.of("0abc", "1abc", "abc", "abc0", "abc1", "abcd"));
    }
}
