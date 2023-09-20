package com.external.plugins.constants;

public class MssqlPluginConstants {
    public static final String GENERATE_CRUD_PAGE_SELECT_QUERY =
            "SELECT * FROM public.template_table\n" + "WHERE col2 like '%{{data_table.searchText || \"\"}}%'\n"
                    + "ORDER BY {{data_table.sortOrder.column || 'col1'}} {{data_table.sortOrder.order || "
                    + "\"ASC\"}}\n"
                    + "OFFSET {{(data_table.pageNo - 1) * data_table.pageSize}} ROWS\n"
                    + "FETCH NEXT {{data_table.pageSize}} ROWS ONLY;\n";
}
