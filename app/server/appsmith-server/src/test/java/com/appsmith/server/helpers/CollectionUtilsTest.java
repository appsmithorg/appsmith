package com.appsmith.server.helpers;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class CollectionUtilsTest {

    @Test
    public void testPutAtFirstWhenItemDoesNotExist() {
        List<String> sampleList = new ArrayList<>(3);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");
        CollectionUtils.putAtFirst(sampleList, "d");
        assertEquals(4, sampleList.size());
        assertArrayEquals(new String[] {"d", "a", "b", "c"}, sampleList.toArray());
    }

    @Test
    public void testPutAtFirstWhenItemAlreadyAtFirst() {
        List<String> sampleList = new ArrayList<>(3);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");
        CollectionUtils.putAtFirst(sampleList, "a");
        assertEquals(3, sampleList.size());
        assertArrayEquals(new String[] {"a", "b", "c"}, sampleList.toArray());
    }

    @Test
    public void testPutAtFirstWhenItemExistsButNotAtFirst() {
        List<String> sampleList = new ArrayList<>(3);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");
        CollectionUtils.putAtFirst(sampleList, "b");
        assertEquals(3, sampleList.size());
        assertArrayEquals(new String[] {"b", "a", "c"}, sampleList.toArray());
    }

    @Test
    public void removeDuplicatesWhenThereAreDuplicates() {
        List<String> sampleList = new ArrayList<>(4);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");
        sampleList.add("c");

        CollectionUtils.removeDuplicates(sampleList);
        assertEquals(3, sampleList.size());
        assertArrayEquals(new String[] {"a", "b", "c"}, sampleList.toArray());
    }

    @Test
    public void removeDuplicatesWhenThereAreNoDuplicates() {
        List<String> sampleList = new ArrayList<>(4);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");

        CollectionUtils.removeDuplicates(sampleList);
        assertEquals(3, sampleList.size());
        assertArrayEquals(new String[] {"a", "b", "c"}, sampleList.toArray());
    }

    @Test
    public void removeDuplicatesWhenThereAreMultipleDuplicates() {
        List<String> sampleList = new ArrayList<>(5);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");
        sampleList.add("c");
        sampleList.add("b");

        CollectionUtils.removeDuplicates(sampleList);
        assertEquals(3, sampleList.size());
        assertArrayEquals(new String[] {"a", "b", "c"}, sampleList.toArray());
    }

    @Test
    public void removeDuplicates_WhenThereAreDuplicates_DuplicatesRemovedFromFirst() {
        List<String> sampleList = new ArrayList<>(5);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");
        sampleList.add("a");
        sampleList.add("b");

        CollectionUtils.removeDuplicates(sampleList);
        assertEquals(3, sampleList.size());
        assertArrayEquals(new String[] {"a", "b", "c"}, sampleList.toArray());
    }
}
