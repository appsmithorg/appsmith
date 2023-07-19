export default {
  env_switcher: '[data-cy="t--switch-env"]',
  env_switcher_dropdown_opt_prod: '[data-cy="t--switch-env-dropdown-option-production"]',
  env_switcher_dropdown_opt_stage: '[data-cy="t--switch-env-dropdown-option-staging"]',
  ds_data_filter_disabled: '[data-cy="t--filter-disabled"]',
  env_switcher_dropdown_opt: (envName) => `[data-cy="t--switch-env-dropdown-option-${envName}"]`,
  ds_editor_env_filter: (envName) => `[data-cy="t--ds-data-filter-${envName}"]`,
}