package com.appsmith.server.helpers;

import org.junit.Assert;
import org.junit.Test;

import java.util.ArrayList;
import java.util.List;

public class CollectionUtilsTest {

    @Test
    public void testPutAtFirstWhenItemDoesNotExist() {
        List<String> sampleList = new ArrayList<>(3);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");
        CollectionUtils.putAtFirst(sampleList, "d");
        Assert.assertEquals(4, sampleList.size());
        Assert.assertArrayEquals(new String[]{ "d", "a", "b", "c" }, sampleList.toArray());
    }

    @Test
    public void testPutAtFirstWhenItemAlreadyAtFirst() {
        List<String> sampleList = new ArrayList<>(3);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");
        CollectionUtils.putAtFirst(sampleList, "a");
        Assert.assertEquals(3, sampleList.size());
        Assert.assertArrayEquals(new String[]{ "a", "b", "c" }, sampleList.toArray());
    }

    @Test
    public void testPutAtFirstWhenItemExistsButNotAtFirst() {
        List<String> sampleList = new ArrayList<>(3);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");
        CollectionUtils.putAtFirst(sampleList, "b");
        Assert.assertEquals(3, sampleList.size());
        Assert.assertArrayEquals(new String[]{ "b", "a", "c" }, sampleList.toArray());
    }

    @Test
    public void removeDuplicatesWhenThereAreDuplicates() {
        List<String> sampleList = new ArrayList<>(4);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");
        sampleList.add("c");

        CollectionUtils.removeDuplicates(sampleList);
        Assert.assertEquals(3, sampleList.size());
        Assert.assertArrayEquals(new String[]{ "a", "b", "c" }, sampleList.toArray());
    }

    @Test
    public void removeDuplicatesWhenThereAreNoDuplicates() {
        List<String> sampleList = new ArrayList<>(4);
        sampleList.add("a");
        sampleList.add("b");
        sampleList.add("c");

        CollectionUtils.removeDuplicates(sampleList);
        Assert.assertEquals(3, sampleList.size());
        Assert.assertArrayEquals(new String[]{ "a", "b", "c" }, sampleList.toArray());
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
        Assert.assertEquals(3, sampleList.size());
        Assert.assertArrayEquals(new String[]{ "a", "b", "c" }, sampleList.toArray());
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
        Assert.assertEquals(3, sampleList.size());
        Assert.assertArrayEquals(new String[]{ "a", "b", "c" }, sampleList.toArray());
    }

}