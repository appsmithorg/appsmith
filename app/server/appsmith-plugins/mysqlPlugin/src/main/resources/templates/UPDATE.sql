UPDATE users
  SET status = 'APPROVED'
  WHERE id = {{ usersTable.selectedRow.id }};