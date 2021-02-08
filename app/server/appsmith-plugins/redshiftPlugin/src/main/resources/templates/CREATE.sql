INSERT INTO users
  (name, gender, email)
VALUES
  (
    '{{ nameInput.text }}',
    '{{ genderDropdown.selectedOptionValue }}',
    '{{ nameInput.text }}'
  ); -- nameInput and genderDropdown are example widgets, replace them with your widget names. Read more at http://bit.ly/capture-widget-data
