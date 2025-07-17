# [⚠️ WIP ⚠️] Configuration Reference for `antora.yml`

This file lists `osc-doc-framework`-specific configuration keys that you can use in `antora.yml` files (Antora component version descriptors) to generate API documentation.

## Configuration keys

* `api_repository`:
    * `url`: The URL of the DEV repo. For example, `https://<GITLAB_URL>/<NAMESPACE>/<REPO_NAME>.git`.
    * `ref`: The branch (or tag) of the DEV repo. This value is used whenever you generate the doc, **except when the DOC repo is on its default branch**; in that specific case, the default branch of the DEV repo is used instead.
* `api_package`:
    * `url`: The URL of the package registry of the DEV repo. It must be in the format `https://<GITLAB_URL>/api/v4/projects/<NAMESPACE>%2F<REPO_NAME>/packages`.
    * `version`: The version of the package. If you specify for example `1.36.0`, the generator will look for `1.36.0`, but if it doesn't find it, it will look for `1.36.0-rc`, `1.36.0-beta`, and `1.36.0-alpha` (in this order). This value is used whenever you generate the doc, **except when the DOC repo is on its default branch**; in that specific case, the package corresponding to the default branch of the DEV repo is used instead.
* `build_options`:
    * `api_file`: The path of the API definition file (prefixed with the DEV repo name as parent directory, if there is one). For example, `oAPI/oapi.yaml`.
    * `descriptions_file`: (optional) The path of the CSV descriptions file. For example, `oapi-description.csv`.
    * `reset_description_keys`: If true, all existing description keys in the API definition file are removed and replaced with the descriptions of the CSV. If false, the description keys of the API definition file are supposed to contain placeholder values that are filled with the descriptions of the CSV.
    * `no_sort_keys`: If true, the keys of the API definition file are sorted in alphabetical order. If false, they are kept as is.
    * `separator`: The character used in the naming pattern of the CSV placeholder keys (by default, `_`).
    * `examples_file`: (optional) The path of the YAML examples definition file. For example, `oapi-examples.yaml`.
    * `errors_file`: (optional) The path of the YAML errors definition file (prefixed with the DEV repo name as parent directory, if there is one). For example, `oAPI/errors.yaml`.
    * `languages`: The languages for the auto-generated example tabs, separated by commas. The following values are supported: `shell--osc-cli`, `shell--oapi-cli`, `shell--curl`, `python`, `javascript`, `text--hcl`, `http`.
    * `osc_cli_partials`: (optional) If `true`, Antora partials are generated for the OSC CLI User Guide sections of this API (`shell--osc-cli` must be among the specified `languages`).
    * `oapi_cli_partials`: (optional) If `true`, Antora partials are generated for the oapi-cli User Guide sections of this API (`shell--oapi-cli` must be among the specified `languages`).
    * `output_yaml_path`: The filepath where you want to save the API definition file that's used in the generation (possibly augmented with descriptions and examples). If not specified, the augmented API definition file is not saved to disk.
    * `output_page_name`: The name used for the generated HTML page. For example, if you specify `api`, the generated page will be `api.html`.
