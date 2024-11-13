# osc-doc-framework Changelog

## 1.16.0 (2024-11-13)

### Improvements

* General refactoring:
    * (antora-theme) Instead of supplementing the [Antora Default UI](https://gitlab.com/antora/antora-ui-default), osc-doc-framework now directly builds a full UI package during doc generation f9187042caa8c89022b2e6c1307cd07a9811a460...6b693b85bba49befef937a3ecbd59bf8fc7b05f7
        * You can use this full UI package by modifying your playbook file as follows:
            ```yaml
            ui:
                bundle:
                    url: ./node_modules/@outscale/osc-doc-framework/antora-ui/build/ui-bundle.zip
                    snapshot: true
            ```
    * (antora-extension / widdershins) Separate Widdershins scripts from template files 778c9a6c5347423612ef649880a81f88927ffd5c
    * (antora-extension) Improve generation of API docs, by making it executable by Node instead of just sh f9187042caa8c89022b2e6c1307cd07a9811a460
    * (antora-extension) Merge asciidoctor-extensions back into antora-extension in order to make the AWS disclaimer code more customizable 1a76d9adf1d09adf1443e17cb88a7c1450e77996
    * Updated the README.adoc file and copied the GitHub release note entries into a CHANGELOG.md file 05116710dbdf5fd4f02f40b482fca7d72483d2ab

### Bugfixes

* (antora-extension / widdershins) Fix bugs in API doc generation 7a01777b067a0f2e9cec520084b11d1aa4cdde3c c76455e7ed52bc7eaf2ccc77bcb13922ba22a249

## 1.15.0 (2024-11-05)

### New features

* (antora-extension) Add code examples generation for oapi-cli 3039f663336ca51894d4568efe87ae8bdcd7cd9a
* (antora-extension) Add correspondences between oAPI calls and Terraform resources/data sources 0189721f83af3a4b2341951b5855b071b6906a9a

### Improvements

* (Vale) Added exceptions in TitleCaps.yml rule 2d936aa13c8581c118cf857d4e62e7e7f7d42e93
* (Vale) Improved MergeConflicts.yml rule 4ff5772f193d9c22685a03954241e518d9679db7

### Bugfixes

* (antora-extension / antora-theme / antora-tooltipper-extension) Various bugfixes

## 1.14.0 (2024-09-20)

### New features

* (antora-extension) The layout of the [API documentation](https://docs.outscale.com/api.html) has been improved: c33054eea7869261873c2d35af647b2352ee3d50
    * Nested request parameters and nested response elements are now indicated by vertical lines and nodes, instead of indent symbols (`»`) previously.
    * In the response part of each method, the response 200 elements are now directly listed, instead of only having a link to the response schema.
    * When there are more than one examples for a response, the first example is visible by default while the other examples are enclosed in expandable blocks.
* (antora-tooltipper-extension) There are now tooltips in the API DOCs too 3a18badcc628138db2df678037ae0b7dd17df5bf, 8a2a3ec264b02bce33427f4c4d63dcb2d64faed7
* (antora-theme) In the [EIM Policy Generator](https://docs.outscale.com/en/userguide/EIM-Policy-Generator.html), you can now select a "NotAction" option ca4d7331300b345c01682a28d8153e03fbc43704
* (Vale) Vale now also runs on the CSV files of the API DOCs 4baa86e7f610e260aa67283e8c5139c2aefec27a, 0777e3829f892c1dec6af62011b266c4bc7e0cc7

### Improvements

* (antora-extension) Made the links to API DOCs relative instead of absolute e6ab48a2f30cf591259c05e938fc6da70291529a
* (antora-extension) Made all external links open in a new tab 909b81c3f01efe91a2f59c9a83cefb4df45d15e8
* (antora-theme) Improved the [EIM Policy Generator](https://docs.outscale.com/en/userguide/EIM-Policy-Generator.html):
    * Made sure that "All Read actions" also captures Get/Describe/List actions f5383644ada7f84f82a0ccfa7b5b4a20e7aa9af2
    * Added error if policy exceeds max length 2714dbde2889aaed5b0753831cf9e32cd180c7e3
* (Vale) Updated some Vale rules e0848f3b8ad4e72b57590f93de74a13281cdb3fd, 433037a64d9e4fa7e942bd4ae631e12860e746bc 

### Bugfixes

* (antora-extension) API DOC refactoring + Fixed the scrolling when accessing the API DOCs from anchor links 8f772b76015cfda1c3b69530b075c9560b156320, 8d394b0cfc49fc6d6ee54cdad19f84c369905058, e8c22fc8ce84628c864e6171e7091a9bff018092, 40e531685ea9bb01fa848b0fd123d45b1d480c76, e19f9589a30ded4e984de573ce8c74082387ac72, b1bf39496d8db82b83c6e10be291123d9c8bd324
* (antora-extension) Fixed SSH bug in osc-doc-framework update checker 54560d4865f4d6bacdf0cab366bec0ae0a5efd5f
* (antora-rss-extension) Fixed relative links in generated RSS feeds 365677d6ef51afcb95d4928b2700c36d5950571f

## 1.13.0 (2024-29-07)

### New features

* (antora-extension) Add the possibility to check for updates of osc-doc-framework: https://github.com/outscale/osc-doc-framework/compare/5dd8d92523b04e78d697d5b0099da829ad443c72...b873a85946ccdd89e61c44d36fb1175970ffb525
    * Explanation: If the below keys are specified in the Antora playbook, osc-doc-framework will check for updates when the `antora` generate command is run. If there is an update available, the generation will be stopped so that the user can update the framework. If there is no update available, the generation happens normally.
        ```yaml
        antora:
            extensions:
                - require: ./node_modules/@outscale/osc-doc-framework/antora-extension
                update_checker: true
        ```
* (antora-extension) In the generated API docs, add the possibility to tag API calls or API parameters as "Deprecated" 571278c6ec275c387181ae0977a916bb3d119266...8363216de157914ade77d0e8f8eaad2c40dbdde3, b50fd0526d53d24c5205b8ea0a45a822de554fa7...e15d61360affe64c839cca5abf8b97dc5f1dcfb9, b3f3ae764df5f664a535b10096c0e9c174e56511
    * Explanation: In the OpenAPI definition of an API, if the string `Deprecated:` appears in the description of an API call or the description of an API parameter, the call or parameter will be visually marked as "Deprecated" in the generated API docs.

### Improvements

* (Vale) Updated the Vale rules: e15d61360affe64c839cca5abf8b97dc5f1dcfb9...67c4331abd41874bb275c56ed93ec34f2cb62569
    * (Vale) Added the rules for the new Release Note format
    * (Vale) Added a rule for bad monospace format

### Bugfixes

* (antora-extension) In the generated OSC CLI sections (Antora partials), fix missing subparameters 571278c6ec275c387181ae0977a916bb3d119266
* (antora-theme) Fix various CSS bugs

## 1.12.1 (2024-06-19)

### Bugfixes

* (antora-special-pages-extension) Make the release notes page more responsive/mobile-friendly: 8e020b38147d47aa657b1206d3251ff46e4f5182
* (antora-special-pages-extension) Remove the HTML IDs from the h3-h6 headings of the release notes (to avoid old RSS entries from changing when new entries with similar headings are created): 77fbc9b24d60096dec8d7eddb0b2bf19720df950

## 1.12.0 (2024-06-18)

### New features

* (antora-special-pages-extension) Implement a new [Release Notes](https://docs.outscale.com/en/userguide/Release-Notes.html) page with a new format: c59e9c30c2eb442eb08454f9aec5a1bfb3b15fe8...cf9cbd96856f889c9cb008cd1de7dd13cf656792
* (antora-extension) Add support for [sitemap](https://docs.outscale.com/sitemap.xml) and [robots.txt](https://docs.outscale.com/robots.txt): 9bc310e84b63e5dc5304c12ac4eae99a472d9a84
* (antora-extension) In the generated API docs, display the `pattern` fields (for example, in [CreatePolicyVersion](https://docs.outscale.com/api.html#createpolicyversion)): 289b578ca43c4b92383ec9ee4708ef86ac1f33e1
* (antora-extension) In the generated API docs, add support for a new format of API errors file (for example, in [this page](https://docs.outscale.com/en/userguide/Creating-an-Organization-as-a-Seller-Partner.html)): 71b1511f4ae1d53add393674cd6f58cd222da98f

### Improvements

* (antora-theme) Modify the CSS of collapsible blocks: c1aa13c8290a3269ca8ea74f03bccc3716527fca, ba12f147ac3f938af3b0c5a482522081507e2893
* (antora-theme) Disable the tooltip explanation box that was at the top right of pages: 0208dc09ab6fce008acb6ac328b94958cde128d0

### Bugfixes

* (antora-theme) In the EIM Policy Generator, fix incorrect extra spaces in the JSON string output: 604012615446c407bc6d7c9750ff90ecc2f3fa39
* (antora-theme) Make Matomo integration more compatible with Content Security Policy: e7bf9660eed10c7b93ec4ddb68ac67d0a9ebdc21
* (antora-extension) Fix various bugs in the API doc generator
* (antora-theme) Fix various CSS bugs

## 1.11.0 (2024-04-26)

### New features

* (antora-theme) The terminal prompt (`$`) is no longer selectable in code blocks
* (antora-theme) Table columns can now be sorted, thanks to [cpkio/JSTable](https://github.com/cpkio/JSTable) plugin
* (antora-theme) The EIM Policy Generator now also outputs its result as a JSON string
* (antora-special-pages-extension / antora-theme) Revamped the 404 page

### Improvements

* (Vale) Improved the TitleCaps.yml rule and the Harmonization.yml rule

## 1.10.0 (2024-04-11)

### New features

* (Vale) Updated the Vale rules:
    * (Vale) Added rule to prevent linking to timesensitive URLs
    * (Vale) Added rule to prevent Shell format in code block response samples.
    * (Vale) Added more terms, phrasings, and anglicisms to avoid.
    * (Vale) Fixed the FR title capitalization rule.
* (antora-extension) The script for merging the text descriptions into the API YAML now adds the names of any missing descriptions in the generated API DOC page (next to the NOT_FOUND mentions).

### Bugfixes

* (antora-theme) Fixed various CSS bugs that appeared following the implementation of the new corporate visual theme

## 1.9.0 (2024-03-15)

### New features

* (antora-theme) Implement new corporate visual theme (charte graphique)
* (antora-extension) API docs are now generated directly from Antora
* (antora-extension) Make the detection of errors in API examples possible via an environment variable (`OPENAPI_EXAMPLES_VALIDATOR`)

### Bugfixes

* (antora-extension / widdershins) Fix display of "nullable" API parameters
* (antora-theme) Fix slowdown when changing code sample language in API docs
* (antora-theme) Fix various CSS bugs

## 1.8.0 (2024-02-19)

### New features

* (antora-theme) Add [EIM (AWS IAM) policy generator](https://github.com/outscale/osc-doc-framework/blob/bc5338ffa3c02ffc8bd55155b99655f43df900f6/antora-theme/js/outscale-eim-policy-generator.js)
* (antora-extension / widdershins) Adapt API doc generator to be able to handle multiple API docs

### Bugfixes

* (antora-extension / widdershins) Fix format of JSON strings in API examples
* (antora-extension / widdershins) Fix display of "OneOf" API parameters
* (antora-theme) Fix link on top-left Outscale logo

## 1.7.0 (2024-01-22)

### New features

* (antora-extension) osc-doc-framework can now generate API documentation by using a combination of [Widdershins](https://github.com/Mermade/widdershins), [Shins](https://github.com/mermade/shins), [Antora Collector Extension](https://gitlab.com/antora/antora-collector-extension), and custom scripts. (To be documented.)
* (antora-extension) osc-doc-framework can now generate a custom 404 page. (Not yet in production on docs.outscale.com.)

### Bugfixes

* (antora-theme) Various UI adjustments

## 1.6.0 (2023-12-14)

### New features

* (antora-git-log-extension) Add antora-git-log-extension to insert "Page modified on" timestamps in pages

### Improvements

* (Vale) Improve rule to avoid multiple `:page-aliases:` invocations
* (Vale) Improve rule to detect bad `xref` formats
* (Vale) Add rule to detect bad `include` formats

### Minor changes
* (antora-theme) Modify Zendesk widget integration and Matomo integration for cookie compliance

### Bugfixes
* (antora-theme) Fixed various minor CSS issues

## 1.5.1 (2023-11-24)

### Improvements

* (antora-theme) Fix inability to click links in dropdown menus of the top menu bar.

## 1.5.0 (2023-11-24)

### New features

* (antora-theme) Added ability to integrate Matomo (disabled by default). 9fda0cffa7919fa85040a31ae51d005a622fec70

### Improvements
* (antora-theme) Reworked the top menu bar to make it more responsive (removal of a jQuery dependency) and more customizable (ability to specify the menu entries in Antora configuration rather than them being hardcoded). 7fe912177069ac8f94964b0f08f494c853b671a7

## 1.4.0 (2023-10-26)

### New features

* (antora-theme) In the top menu bar, added a link to the [AWS Compatibility Matrix](https://docs.outscale.com/en/userguide/AWS-Compatibility-Matrix.html) page.
* (antora-extension) Broken links are now detected in `:page-fr:` and `:page-en:` Antora attributes, like normal `xref:` links.
* (Vale) Added a rule to detect bad date formats in the release notes pages.
* (Vale) Added some cryptography-related exceptions in the spellcheck rule.

### Minor changes

* (antora-theme) Changed "Cockpit v2-beta" to "Cockpit v2" in the top-right green box.

### Bugfixes

* (antora-theme) In tables that are very wide horizontally, such as [VM Types](https://docs.outscale.com/en/userguide/VM-Types.html), the text in the rightmost column can now be selected normally.
* (antora-theme) A line break is now added before all the autogenerated AWS disclaimers in order to avoid some visual bug.

## 1.3.0 (2023-09-06)

### New features

* (Vale) Added new rules:
  * If the page contains at least one section, you don't need to use the `preamble` formatting.
  * In a list of more than two items, use the serial comma (`, and`, `, or`).
  * Shell code blocks must start with a prompt (`$ `).
  * If a sentence ends with an `xref` link, don't forget to put a period at the end.

### Improvements

* (Vale) Improved some existing rules:
  * Improved the Spelling and TitleCaps rules with more exceptions. Also removed the `Vocab` folder as it was confusing these rules (exceptions are now directly listed in these rules).
  * Improved the BulletSyntax and SpaceColon rules. When they detect an error, they now highlight the whole first word or the whole sentence, respectively.
  * Improved the XrefSyntax rule.
* (antora-theme) The footer of the generated site now contains a link to this repo.

### Bugfixes

* (antora-theme) When accessing a section via an anchor link, the top menu bar no longer hides the section title.

## 1.2.0 (2023-07-27)

### New features
* (antora-extension / antora-theme) Add search page feature
* (antora-theme) Make it possible to export pages to PDF

### Minor changes
* (antora-theme) Tooltips no longer start with an uppercase letter (unless the term is actually capitalized)

## 1.1.0 (2023-07-07)

### New features
* (Vale) Add English spellcheck and new rules
* (Vale) Improve Vale's output style
* (antora-theme) Add favicon
* (antora-theme) Make table headers sticky when scrolling

### Bugfixes
* (antora-extension) Use MacOS system certificates if necessary
* (antora-extension) Allow CI to access private repos

## 1.0.1 (2023-03-21)

* Bugfixes

## 1.0.0 (2023-03-15)

* First general release

## 0.0.0 (2023-03-03)

* First version
