# osc-doc-framework Changelog

## 1.18.0 (2025-07-17)

### New features

* End-user features:
    * (antora-extension) In API docs, automatically append the descriptions with pieces of info gathered from the following JSON Schema keywords, if these pieces of info are specified in the OpenAPI source documents: `minItems`/`maxItems`, `minLength`/`maxLength`, `pattern`, `multipleOf`, `minimum`/`maximum`, `exclusiveMinimum`/`exclusiveMaximum`, `enum`, `default`, `example`/`examples`, and `const` [758fe2e](https://github.com/outscale/osc-doc-framework/commit/758fe2eb0e3305e0f83dd004b7b9de6b402b4dae), [3c28559...73b4a16](https://github.com/outscale/osc-doc-framework/compare/3c285594536e5990b1e8a62bd84bcd0420e10c01...73b4a16e89cfca2d674994642f1ccb909a39622f), [fd2b182](https://github.com/outscale/osc-doc-framework/commit/fd2b1824d1ffb487f06b818ea7adb96064d2e0af), [166a552](https://github.com/outscale/osc-doc-framework/commit/166a5523ebf7a4b5a4c3ce6925e4bfabb40c4d04)
    * (antora-ui) Adapt the print CSS of the API docs so that API docs can exported to PDF in a pretty layout [ed64599](https://github.com/outscale/osc-doc-framework/commit/ed64599d7a64bf185f441edb4eafa7a1397418c0)
    * (antora-ui) Enhance the appearance of the navigation tree by highlighting the parent pages of the active page, instead of just the active page [61daf6f](https://github.com/outscale/osc-doc-framework/commit/61daf6fdb4afaa06b5e65c9bfc6c5207e57e6caf)
* Authoring/CI-centric features:
    * (antora-extension) Extensively rewrite the API doc generation scripts in order to better support new and future APIs (including OKS API and non-Outscale APIs) [bc23b20](https://github.com/outscale/osc-doc-framework/commit/bc23b202404a2fa2706ed827f41f593e1b53c757), [64df09a...f7822f7](https://github.com/outscale/osc-doc-framework/compare/64df09a24404d5f9ff6e2b592382472b8f2e10a9...f7822f721118b978fe3368a7a7031693a7e3f4ff), [a3b2db6](https://github.com/outscale/osc-doc-framework/commit/a3b2db6296ad03f788430b72936a8083de1c082a), [14af460...a2331e2](https://github.com/outscale/osc-doc-framework/compare/14af46018e010c1f3da696cb317689bbb34f99e3...a2331e2e9a75faaf862fba61db984d84fefc0190), [48b5f6f](https://github.com/outscale/osc-doc-framework/commit/48b5f6f07aaae1cdf34743ea934e8533807dd82e), [94699b4...aad9557](https://github.com/outscale/osc-doc-framework/compare/94699b467e81e33ea620aa32a7efbc47e09ee3d9...aad955716f2b6635d05a10b7751b2b34df2e46c7), [0da99ef](https://github.com/outscale/osc-doc-framework/commit/0da99ef6c099f71971901b06bd1666e7bef2dc6d), [be65399](https://github.com/outscale/osc-doc-framework/commit/be653991c768537aca149f98119ce060c8c268f1), [7f88520](https://github.com/outscale/osc-doc-framework/commit/7f88520bb27c011ed886e7e75c5e65a3f964ffd7), [1775634...37321c7](https://github.com/outscale/osc-doc-framework/compare/1775634a3ecd32b85ab695d1ebc10033c93ac54a...37321c74d0fc45fb0e8a1b2a8198831f98124d19), [88f2ca5](https://github.com/outscale/osc-doc-framework/commit/88f2ca537dc4048cb8f7ddd53020f5d16d76121a), [d9e07ca](https://github.com/outscale/osc-doc-framework/commit/d9e07ca07e992f260c4405c2d6d5d8ad0d532d91), [2268479...e2d2da5](https://github.com/outscale/osc-doc-framework/compare/2268479e510bb84a8eafa6dfed1d6ebc90c880e6...e2d2da57a87d98bab5d34ae0de30da2a49baf1de), [369d4c6](https://github.com/outscale/osc-doc-framework/commit/369d4c6283ccfe0562244339fe904b74dc5b6c50)
    * (antora-sourcer) Add an "antora-sourcer" extension to enable Antora content sources to automatically switch between two possible origins: either a remote repository fetched by Antora during generation, or a local repository cloned by the author beforehand (see [antora-sourcer-extension/README.adoc](antora-sourcer-extension/README.adoc) for more info) [be6b6eb](https://github.com/outscale/osc-doc-framework/commit/be6b6eb719caff07812b5947cc43cc6ea8359ccf)
    * (antora-extension) Add `build_options` config option to enable Antora content sources to collect specific Git repos or packages (via Antora Collector) before API docs is generated (see [antora-extension/Configuration-Reference.md](antora-extension/README.adoc) for more info) [be6b6eb](https://github.com/outscale/osc-doc-framework/commit/be6b6eb719caff07812b5947cc43cc6ea8359ccf), [c1474bd](https://github.com/outscale/osc-doc-framework/commit/c1474bd2ee944cf772bec39389757a0e3cccfcf5), [0da99ef...bd1b443](https://github.com/outscale/osc-doc-framework/compare/0da99ef6c099f71971901b06bd1666e7bef2dc6d...bd1b443f55d20e80e0c484da5319740baa5bc488)
    * (antora-extension) Support overriding content source branches via a `TRIGGER_REF` environment variable, to enable CIs of different repos and branches to dynamically modify the playbook [46ec86d...c6cd3c8](https://github.com/outscale/osc-doc-framework/compare/46ec86da7013d454da971b1df34e9e082e321674...c6cd3c8fe4bbdaf6b319c3f0bf73e52ea1062aed)

### Improvements

* (antora-extension / antora-ui) UI improvements:
    * In API docs, move contact info and terms of service info from below the intro text to below the page title [166a552](https://github.com/outscale/osc-doc-framework/commit/166a5523ebf7a4b5a4c3ce6925e4bfabb40c4d04)
    * In API docs, rename "Shell" tab to "Curl" [0a82bc0...46ec86d](https://github.com/outscale/osc-doc-framework/compare/0a82bc050072d754a9fbaad4915a83603ec96072...46ec86da7013d454da971b1df34e9e082e321674)
    * In API docs, add vertical padding at the bottom of the left panel to prevent the last item of the list from being hidden by the browser's URL text pop-up [450944c](https://github.com/outscale/osc-doc-framework/commit/450944c81ce417eeafdc845cd5b4dc69df1247ba)
    * In the User Guide's search results list, add a small message to inform of the possibility to press Enter to access the standalone search results page [0a82bc0](https://github.com/outscale/osc-doc-framework/commit/0a82bc050072d754a9fbaad4915a83603ec96072)
* (Vale) Update Vale rules, to detect curved quotes, code blocks that should be JSON, and some term exceptions [9973890...5d97239](https://github.com/outscale/osc-doc-framework/compare/99738905ea661f255185352fe4611b8077fb8c79...5d97239500122d0fcbf5d2865ac622812e824340)

### Bugfixes

* (antora-extension) Fix formatting errors in Curl code examples [88f2ca5...78ee897](https://github.com/outscale/osc-doc-framework/compare/88f2ca537dc4048cb8f7ddd53020f5d16d76121a...78ee897392eddb1d9fc0afae8f4e28d30a796fd4)
* (antora-extension) Fix "Copy code" button in API docs to correctly ignore comments and leading/trailing newlines [14af460](https://github.com/outscale/osc-doc-framework/commit/14af46018e010c1f3da696cb317689bbb34f99e3)
* (antora-extension) Correctly display hard-coded nested (i.e. non-$ref) API schemas [fc83d4c](https://github.com/outscale/osc-doc-framework/commit/fc83d4c0ca6a20535bce69315b61f5b528c9532b)
* (antora-tooltipper-extension) Fix incorrectly generated tooltips [f3f0627...e6d9c52](https://github.com/outscale/osc-doc-framework/compare/f3f062759007148c4f2e6a149dd365685cec5830...e6d9c52903eb00338bab01ee2283b8e6720d5a9b)
* (antora-ui) Fix incorrectly generated links [ba10df4...cb3e7a6](https://github.com/outscale/osc-doc-framework/compare/ba10df4621773e09427bd98941cee379f872ed08...cb3e7a6b59b92b72e9a3ff0609338352e13aa1f5), [36f9c9c](https://github.com/outscale/osc-doc-framework/commit/36f9c9c3739c5e357cec877ce9cd38a900e0393f)
* (antora-ui) Fix minor CSS/visual issues [f3f0627](https://github.com/outscale/osc-doc-framework/commit/f3f062759007148c4f2e6a149dd365685cec5830), [64df09a](https://github.com/outscale/osc-doc-framework/commit/64df09a24404d5f9ff6e2b592382472b8f2e10a9), [3c28559](https://github.com/outscale/osc-doc-framework/commit/3c285594536e5990b1e8a62bd84bcd0420e10c01), [92095a3](https://github.com/outscale/osc-doc-framework/commit/92095a3158a6c499fa16f07d13eff51ff647c0db), [17d257b](https://github.com/outscale/osc-doc-framework/commit/17d257bb2ea1e389fe75c256565c23512b8e72b2), [1775634](https://github.com/outscale/osc-doc-framework/commit/1775634a3ecd32b85ab695d1ebc10033c93ac54a), [88c6966](https://github.com/outscale/osc-doc-framework/commit/88c6966d772fa68bb4b418be90fa8126f1edfee2), [2268479](https://github.com/outscale/osc-doc-framework/commit/2268479e510bb84a8eafa6dfed1d6ebc90c880e6)

## 1.17.1 (2024-12-02)

### Bugfixes

* (antora-extension) Fix bug in update-checker.js [a2e5255](https://github.com/outscale/osc-doc-framework/commit/a2e5255731af5b1e1684529d8e9ea4a92da7e851)
* (antora-extension / widdershins) Fix regression in terminal prompt display [46464f5](https://github.com/outscale/osc-doc-framework/commit/46464f5adb838fd90abf36c1bdc93d1ea0f90d7f)
* (antora-extension / widdershins) Fix default value for server/endpoint [f6c769d](https://github.com/outscale/osc-doc-framework/commit/f6c769d81acf2e9d4951fc562303604d8f6d3acc)
* (antora-extension / widdershins) Prevent infinite loop when API has recursive schemas [86792df](https://github.com/outscale/osc-doc-framework/commit/86792dff3a27fa34c02cb9a304bcc9bb923b406e)
* (antora-extension / widdershins) Fix query string syntax in HTTP code samples [f347cfb](https://github.com/outscale/osc-doc-framework/commit/f347cfbcd03aec986f4f13643d11308572afc72b)

## 1.17.0 (2024-11-22)

### New features

* Updated the README.adoc with a link to a demo repository [4d5a5de](https://github.com/outscale/osc-doc-framework/commit/4d5a5deadb22cc03798a7b90a412af934a03f45d)
* (antora-extension / widdershins) Allow shins-templates and widdershins-templates to be overridden [23d5467](https://github.com/outscale/osc-doc-framework/commit/23d5467a96df7f5bd89e8df5b3b5d5ff2a56dd38)

### Improvements

* (antora-extension / widdershins) Updated the API DOC generation scripts:
    * Improve display of oneOf and anyOf [399e33d](https://github.com/outscale/osc-doc-framework/commit/399e33d99d2bb5eb4d1f55dbd614e4e87eca939a)
    * Display path/query/header/body parameters in separate tables [aa30539](https://github.com/outscale/osc-doc-framework/commit/aa3053927e9625ec6e28121e2f0cb39b9ad81540)
    * Adjust some default values [f4f383c](https://github.com/outscale/osc-doc-framework/commit/f4f383c5e2cb06da71a58cf3f839cfeb8bf27ae3), [23faf81](https://github.com/outscale/osc-doc-framework/commit/23faf81694d85e44d06d8cd8e225a1fc0eaa66ca), [69efe51](https://github.com/outscale/osc-doc-framework/commit/69efe51c5de36c3edc5881af2e0cf87cf82d7994)
    * Miscellaneous formatting changes [a0740ae](https://github.com/outscale/osc-doc-framework/commit/a0740ae6da0fc3d9f4987b00c3495c353c52d06a), [1bf0336](https://github.com/outscale/osc-doc-framework/commit/1bf03368f6c81d610ae5a39ad7b1a7f0f97b978e)
* (Vale) Updated some rules [8085238](https://github.com/outscale/osc-doc-framework/commit/8085238cebdd30451b64d01daa288fb4380bf55e), [59f056a](https://github.com/outscale/osc-doc-framework/commit/59f056a1ceea6c265d25442b4b945d0cbe374c65)

### Bugfixes

* (antora-extension / widdershins) Fix display of empty response bodies [c4adbe5](https://github.com/outscale/osc-doc-framework/commit/c4adbe560110a93533ba30d5b873c0e8fba1f4d7)
* (antora-extension / widdershins) Don't omit the nested parameters of repeated objects [b5488b0](https://github.com/outscale/osc-doc-framework/commit/b5488b0eef28fdea7639b5cacefd951c49498c8b)
* (antora-extension / widdershins) Don't omit request body schemas in Schemas section [596d4ae](https://github.com/outscale/osc-doc-framework/commit/596d4ae0eec4c2614c9a0d481c8ff0d4546dc97d)

## 1.16.0 (2024-11-13)

### Improvements

* General refactoring: [3eeca90](https://github.com/outscale/osc-doc-framework/commit/3eeca90c7a59c3c95a0cdaff1f12cf136513b951)
    * (antora-theme) Instead of supplementing the [Antora Default UI](https://gitlab.com/antora/antora-ui-default), osc-doc-framework now directly builds a full UI package during doc generation
        * You can use this full UI package by modifying your playbook file as follows:
            ```yaml
            ui:
              bundle:
                url: ./node_modules/@outscale/osc-doc-framework/antora-ui/build/ui-bundle.zip
                snapshot: true
            ```
    * (antora-extension / widdershins) Separate Widdershins scripts from template files
    * (antora-extension) Improve generation of API docs, by making it executable by Node instead of just sh
    * (antora-extension) Merge asciidoctor-extensions back into antora-extension in order to make the AWS disclaimer code more customizable
    * Updated the README.adoc file and copied the GitHub release note entries into a CHANGELOG.md file

### Bugfixes

* (antora-extension / widdershins) Fix bugs in API doc generation [7a01777](https://github.com/outscale/osc-doc-framework/commit/7a01777b067a0f2e9cec520084b11d1aa4cdde3c), [c76455e](https://github.com/outscale/osc-doc-framework/commit/c76455e7ed52bc7eaf2ccc77bcb13922ba22a249)

## 1.15.0 (2024-11-05)

### New features

* (antora-extension) Add code examples generation for oapi-cli [3039f66](https://github.com/outscale/osc-doc-framework/commit/3039f663336ca51894d4568efe87ae8bdcd7cd9a)
* (antora-extension) Add correspondences between oAPI calls and Terraform resources/data sources [0189721](https://github.com/outscale/osc-doc-framework/commit/0189721f83af3a4b2341951b5855b071b6906a9a)

### Improvements

* (Vale) Added exceptions in TitleCaps.yml rule [2d936aa](https://github.com/outscale/osc-doc-framework/commit/2d936aa13c8581c118cf857d4e62e7e7f7d42e93)
* (Vale) Improved MergeConflicts.yml rule [4ff5772](https://github.com/outscale/osc-doc-framework/commit/4ff5772f193d9c22685a03954241e518d9679db7)

### Bugfixes

* (antora-extension / antora-theme / antora-tooltipper-extension) Various bugfixes

## 1.14.0 (2024-09-20)

### New features

* (antora-extension) The layout of the [API documentation](https://docs.outscale.com/api.html) has been improved: [c33054e](https://github.com/outscale/osc-doc-framework/commit/c33054eea7869261873c2d35af647b2352ee3d50)
    * Nested request parameters and nested response elements are now indicated by vertical lines and nodes, instead of indent symbols (`»`) previously.
    * In the response part of each method, the response 200 elements are now directly listed, instead of only having a link to the response schema.
    * When there are more than one examples for a response, the first example is visible by default while the other examples are enclosed in expandable blocks.
* (antora-tooltipper-extension) There are now tooltips in the API DOCs too [3a18bad](https://github.com/outscale/osc-doc-framework/commit/3a18badcc628138db2df678037ae0b7dd17df5bf), [8a2a3ec](https://github.com/outscale/osc-doc-framework/commit/8a2a3ec264b02bce33427f4c4d63dcb2d64faed7)
* (antora-theme) In the [EIM Policy Generator](https://docs.outscale.com/en/userguide/EIM-Policy-Generator.html), you can now select a "NotAction" option [ca4d733](https://github.com/outscale/osc-doc-framework/commit/ca4d7331300b345c01682a28d8153e03fbc43704)
* (Vale) Vale now also runs on the CSV files of the API DOCs [4baa86e](https://github.com/outscale/osc-doc-framework/commit/4baa86e7f610e260aa67283e8c5139c2aefec27a), [0777e38](https://github.com/outscale/osc-doc-framework/commit/0777e3829f892c1dec6af62011b266c4bc7e0cc7)

### Improvements

* (antora-extension) Made the links to API DOCs relative instead of absolute [e6ab48a](https://github.com/outscale/osc-doc-framework/commit/e6ab48a2f30cf591259c05e938fc6da70291529a)
* (antora-extension) Made all external links open in a new tab [909b81c](https://github.com/outscale/osc-doc-framework/commit/909b81c3f01efe91a2f59c9a83cefb4df45d15e8)
* (antora-theme) Improved the [EIM Policy Generator](https://docs.outscale.com/en/userguide/EIM-Policy-Generator.html):
    * Made sure that "All Read actions" also captures Get/Describe/List actions [f538364](https://github.com/outscale/osc-doc-framework/commit/f5383644ada7f84f82a0ccfa7b5b4a20e7aa9af2)
    * Added error if policy exceeds max length [2714dbd](https://github.com/outscale/osc-doc-framework/commit/2714dbde2889aaed5b0753831cf9e32cd180c7e3)
* (Vale) Updated some Vale rules [e0848f3](https://github.com/outscale/osc-doc-framework/commit/e0848f3b8ad4e72b57590f93de74a13281cdb3fd), [433037a](https://github.com/outscale/osc-doc-framework/commit/433037a64d9e4fa7e942bd4ae631e12860e746bc) 

### Bugfixes

* (antora-extension) API DOC refactoring + Fixed the scrolling when accessing the API DOCs from anchor links [8f772b7](https://github.com/outscale/osc-doc-framework/commit/8f772b76015cfda1c3b69530b075c9560b156320), [8d394b0](https://github.com/outscale/osc-doc-framework/commit/8d394b0cfc49fc6d6ee54cdad19f84c369905058), [e8c22fc](https://github.com/outscale/osc-doc-framework/commit/e8c22fc8ce84628c864e6171e7091a9bff018092), [40e5316](https://github.com/outscale/osc-doc-framework/commit/40e531685ea9bb01fa848b0fd123d45b1d480c76), [e19f958](https://github.com/outscale/osc-doc-framework/commit/e19f9589a30ded4e984de573ce8c74082387ac72), [b1bf394](https://github.com/outscale/osc-doc-framework/commit/b1bf39496d8db82b83c6e10be291123d9c8bd324)
* (antora-extension) Fixed SSH bug in osc-doc-framework update checker [54560d4](https://github.com/outscale/osc-doc-framework/commit/54560d4865f4d6bacdf0cab366bec0ae0a5efd5f)
* (antora-rss-extension) Fixed relative links in generated RSS feeds [365677d](https://github.com/outscale/osc-doc-framework/commit/365677d6ef51afcb95d4928b2700c36d5950571f)

## 1.13.0 (2024-29-07)

### New features

* (antora-extension) Add the possibility to check for updates of osc-doc-framework: [5dd8d92...b873a85](https://github.com/outscale/osc-doc-framework/compare/5dd8d92523b04e78d697d5b0099da829ad443c72...b873a85946ccdd89e61c44d36fb1175970ffb525)
    * Explanation: If the below keys are specified in the Antora playbook, osc-doc-framework will check for updates when the `antora` generate command is run. If there is an update available, the generation will be stopped so that the user can update the framework. If there is no update available, the generation happens normally.
        ```yaml
        antora:
          extensions:
          - require: ./node_modules/@outscale/osc-doc-framework/antora-extension
            update_checker: true
        ```
* (antora-extension) In the generated API docs, add the possibility to tag API calls or API parameters as "Deprecated" [571278c...8363216](https://github.com/outscale/osc-doc-framework/compare/571278c6ec275c387181ae0977a916bb3d119266...8363216de157914ade77d0e8f8eaad2c40dbdde3), [b50fd05...e15d613](https://github.com/outscale/osc-doc-framework/compare/b50fd0526d53d24c5205b8ea0a45a822de554fa7...e15d61360affe64c839cca5abf8b97dc5f1dcfb9), [b3f3ae7](https://github.com/outscale/osc-doc-framework/commit/b3f3ae764df5f664a535b10096c0e9c174e56511)
    * Explanation: In the OpenAPI definition of an API, if the string `Deprecated:` appears in the description of an API call or the description of an API parameter, the call or parameter will be visually marked as "Deprecated" in the generated API docs.

### Improvements

* (Vale) Updated the Vale rules: [e15d613...67c4331](https://github.com/outscale/osc-doc-framework/compare/e15d61360affe64c839cca5abf8b97dc5f1dcfb9...67c4331abd41874bb275c56ed93ec34f2cb62569)
    * (Vale) Added the rules for the new Release Note format
    * (Vale) Added a rule for bad monospace format

### Bugfixes

* (antora-extension) In the generated OSC CLI sections (Antora partials), fix missing subparameters [571278c](https://github.com/outscale/osc-doc-framework/commit/571278c6ec275c387181ae0977a916bb3d119266)
* (antora-theme) Fix various CSS bugs

## 1.12.1 (2024-06-19)

### Bugfixes

* (antora-special-pages-extension) Make the release notes page more responsive/mobile-friendly: [8e020b3](https://github.com/outscale/osc-doc-framework/commit/8e020b38147d47aa657b1206d3251ff46e4f5182)
* (antora-special-pages-extension) Remove the HTML IDs from the h3-h6 headings of the release notes (to avoid old RSS entries from changing when new entries with similar headings are created): [77fbc9b](https://github.com/outscale/osc-doc-framework/commit/77fbc9b24d60096dec8d7eddb0b2bf19720df950)

## 1.12.0 (2024-06-18)

### New features

* (antora-special-pages-extension) Implement a new [Release Notes](https://docs.outscale.com/en/userguide/Release-Notes.html) page with a new format: [c59e9c3...cf9cbd9](https://github.com/outscale/osc-doc-framework/compare/c59e9c30c2eb442eb08454f9aec5a1bfb3b15fe8...cf9cbd96856f889c9cb008cd1de7dd13cf656792)
* (antora-extension) Add support for [sitemap](https://docs.outscale.com/sitemap.xml) and [robots.txt](https://docs.outscale.com/robots.txt): [9bc310e](https://github.com/outscale/osc-doc-framework/commit/9bc310e84b63e5dc5304c12ac4eae99a472d9a84)
* (antora-extension) In the generated API docs, display the `pattern` fields (for example, in [CreatePolicyVersion](https://docs.outscale.com/api.html#createpolicyversion)): [289b578](https://github.com/outscale/osc-doc-framework/commit/289b578ca43c4b92383ec9ee4708ef86ac1f33e1)
* (antora-extension) In the generated API docs, add support for a new format of API errors file (for example, in [this page](https://docs.outscale.com/en/userguide/Creating-an-Organization-as-a-Seller-Partner.html)): [71b1511](https://github.com/outscale/osc-doc-framework/commit/71b1511f4ae1d53add393674cd6f58cd222da98f)

### Improvements

* (antora-theme) Modify the CSS of collapsible blocks: [c1aa13c](https://github.com/outscale/osc-doc-framework/commit/c1aa13c8290a3269ca8ea74f03bccc3716527fca), [ba12f14](https://github.com/outscale/osc-doc-framework/commit/ba12f147ac3f938af3b0c5a482522081507e2893)
* (antora-theme) Disable the tooltip explanation box that was at the top right of pages: [0208dc0](https://github.com/outscale/osc-doc-framework/commit/0208dc09ab6fce008acb6ac328b94958cde128d0)

### Bugfixes

* (antora-theme) In the EIM Policy Generator, fix incorrect extra spaces in the JSON string output: [6040126](https://github.com/outscale/osc-doc-framework/commit/604012615446c407bc6d7c9750ff90ecc2f3fa39)
* (antora-theme) Make Matomo integration more compatible with Content Security Policy: [e7bf966](https://github.com/outscale/osc-doc-framework/commit/e7bf9660eed10c7b93ec4ddb68ac67d0a9ebdc21)
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

* (antora-theme) Added ability to integrate Matomo (disabled by default). [9fda0cf](https://github.com/outscale/osc-doc-framework/commit/9fda0cffa7919fa85040a31ae51d005a622fec70)

### Improvements

* (antora-theme) Reworked the top menu bar to make it more responsive (removal of a jQuery dependency) and more customizable (ability to specify the menu entries in Antora configuration rather than them being hardcoded). [7fe9121](https://github.com/outscale/osc-doc-framework/commit/7fe912177069ac8f94964b0f08f494c853b671a7)

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
