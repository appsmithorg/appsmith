package com.appsmith.external.helpers;

public interface BaseAppsmithEnum<T> {

//    public static List<T> values() {
//        Class<T> clazz = (Class<T>) ((ParameterizedType) getClass().getGenericSuperclass())
//                .getActualTypeArguments()[0];
//
//        return Arrays.stream(clazz.getDeclaredFields())
//                .filter(field -> Modifier.isStatic(field.getModifiers()))
//                .map(field -> {
//                    try {
//                        return (T) field.get(clazz);
//                    } catch (IllegalAccessException e) {
//                        throw new RuntimeException(e);
//                    }
//                })
//                .collect(Collectors.toList());
//    }
}
