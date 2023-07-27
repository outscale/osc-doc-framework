(function () {

  function modifyTitle(q) {
    const h1 = document.querySelector("h1")
    document.title = document.title.replace(h1.textContent, h1.textContent + " ‘" + q + "’")

    const strong = document.createElement("strong")
    strong.textContent = q
    h1.append(" ‘", strong, "’")

    const otherLangLink = document.querySelector("#lang-switcher a[href]")
    if (otherLangLink) otherLangLink.href += "?q=" + q.replace(" ", "+")
  }

  function displaySearchResults(q) {
    const searchInput = document.getElementById("search-input")

    const spinner = document.createElement("span")
    spinner.id = "search-spinner"
    spinner.classList.add("fa", "fa-spinner", "fa-pulse", "fa-2x", "fa-fw")
    appendTagToDoc(spinner)

    searchInput.addEventListener("loadedindex", (event) => {
      setTimeout(performSearch, 0)
      setTimeout(copyResultsToPageBody, 200)
    })
  }

  function appendTagToDoc(tag) {
    const docMobile = document.querySelector(".doc .mobile-only")
    if (docMobile) docMobile.before(tag)
    else document.querySelector(".doc").append(tag)
  }

  function performSearch() {
    document.querySelector(".search-result-dropdown-menu").style.display = "none"

    const urlParams = new URLSearchParams(window.location.search)
    const q = urlParams.get("q")

    const searchInput = document.getElementById("search-input")
    searchInput.value = q
    searchInput.dispatchEvent(new KeyboardEvent("keydown"))
  }

  function copyResultsToPageBody() {
    document.querySelector(".doc #search-spinner").remove()
    const searchInput = document.getElementById("search-input")
    searchInput.value = ""
    searchInput.dispatchEvent(new KeyboardEvent("keydown"))

    const results = document.querySelector(".search-result-dataset")
    appendTagToDoc(results)

    document.querySelector(".search-result-dropdown-menu").style.display = "initial"
  }

  if (document.getElementById("search-field")) {
    // preventEmptySearchSubmission()
    if (document.querySelector("meta[name=page-role][content=search]")) {
      const q = new URLSearchParams(window.location.search).get("q")
      modifyTitle(q)
      if (q) displaySearchResults(q)
    }
  }

})()
