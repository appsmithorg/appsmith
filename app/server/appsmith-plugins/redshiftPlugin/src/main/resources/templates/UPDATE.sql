UPDATE users
  SET status = 'APPROVED'
  WHERE id = '{{ usersTable.selectedRow.id }}'; -- usersTable is an example table widget from where the id is being read. Replace it with your own Table widget or a static value. Read more at http://bit.ly/capture-widget-data

