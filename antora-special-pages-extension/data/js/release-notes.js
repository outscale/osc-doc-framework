(function () {
  const mobileThreshold = 1024
  const introSelector = ".sect1"
  const tocMenuSelector = ".toc.sidebar .toc-menu div"

  function getTags () {
    const array = []
    const textContents = []
    const tags = document.querySelectorAll(".tags span")
    for (let tag of tags) {
      let s = tag.textContent
      if (!textContents.includes(s)) {
        textContents.push(s)
        array.push(tag)
      }
    }
    array.sort(sortFunction1)
    array.sort(sortFunction2)

    return array
  }

  function sortFunction1 (a, b) {
    const c = a.textContent
    const d = b.textContent
    if (c < d) return -1
    if (c > d) return 1
    return 0
  }

  function sortFunction2 (a, b) {
    const c = a.className
    const d = b.className
    if (c < d) return -1
    if (c > d) return 1
    return 0
  }

  function createMenu (tags) {
    const tocMenu = document.querySelector(introSelector)
    const h3 = document.createElement("h3")
    const button = document.createElement("button")
    const div = document.createElement("div")
    const ul1 = document.createElement("ul")
    const ul2 = document.createElement("ul")
    const lang = document.querySelector("html")["lang"]
    if (lang === "fr") {h3.textContent = "Filtres"}
    else {h3.textContent = "Filters"}
    button.className = "closeButton"
    button.type = "button"
    div.id = "filterbox"
    for (let tag of tags) {
      const s = tag.textContent
      const li = document.createElement("li")
      const input = document.createElement("input")
      const label = document.createElement("label")
      input.type = "checkbox"
      input.id = s
      input.name = s
      input.addEventListener("click", urlUpdaterFunction)
      label.className = tag.className
      label.htmlFor = s
      label.textContent = s
      li.append(input, label)
      if (!tag.classList.contains("tag")) {
        ul1.append(li)
      } else {
        ul2.append(li)
      }
    }
    h3.append(button)
    div.append(h3, ul1, ul2)
    tocMenu.before(div)
    moveMenu()
  }

  function urlUpdaterFunction () {
    const filters = getFiltersFromClickedCheckboxes()
    updateVisibleEntries(filters)
    updateUrl(filters)
  }

  function checkboxUpdaterFunction () {
    const filters = getFiltersFromUrl()
    updateVisibleEntries(filters)
    updateCheckboxes(filters)
  }

  function getCheckboxes () {
    return document.querySelectorAll("#filterbox input")
  }

  function getCloseButton () {
    const closeButton = document.querySelector("#filterbox .closeButton")
    closeButton.addEventListener("click", checkboxReseterFunction)

    return closeButton
  }

  function checkboxReseterFunction () {
    for (let box of checkboxes) box.checked = false
    urlUpdaterFunction()
  }

  function getFiltersFromClickedCheckboxes () {
    const filters = []
    for (let box of checkboxes) {
      if (box.checked) filters.push(box.name)
    }

    return filters
  }

  function getFiltersFromUrl () {
    const url = new URL(window.location)
    const queryString = url.searchParams.get("f")
    if (queryString) {
      return queryString.split(",")
    } else {
      return []
    }
  }

  function updateUrl (filters) {
    const url = new URL(window.location)
    if (filters.length) {
      url.searchParams.set("f", filters)
    } else {
      url.searchParams.delete("f")
    }
    history.pushState(null, "", url)
  }

  function updateCheckboxes (filters) {
    for (let box of checkboxes) {
      if (filters.includes(box.name)) {
        box.checked = true
      } else {
        box.checked = false
      }
    }
  }

  function updateVisibleEntries (filters) {
    const [sect1s, entries] = getSectionsAndEntries()

    for (let sect1 of sect1s) {
      sect1.style.display = "none"
    }

    for (entry of entries) {
      const entryTags = entry.querySelectorAll(".tags span")
      entry.style.display = "none"
      for (let entryTag of entryTags) {
        if (filters.includes(entryTag.textContent) || !filters.length) {
          entry.style.display = "block"
        }
      }
    }

    for (let sect1 of sect1s) {
      if (sect1.querySelector(".sect2[style='display: block;']")) {
        sect1.style.display = "block"
      }
    }

    closeButton.style.display = "none"
    for (let box of checkboxes) {
      if (box.checked) closeButton.style.display = "initial"
    }
  }

  function getSectionsAndEntries () {
    const entries = []
    const sect1s = document.querySelectorAll(".sect1")
    for (let sect1 of sect1s) {
      const sect2s = sect1.querySelectorAll(".sect2")
      if (sect2s.length === 0) {
        entries.push(sect1)
      } else {
        for (let sect2 of sect2s) {
          entries.push(sect2)
        }
      }
    }

    return [sect1s, entries]
  }

  function moveMenu () {
    const filterbox = document.querySelector("#filterbox")
    if (window.innerWidth < mobileThreshold) {
      document.querySelector(introSelector).before(filterbox)
      filterbox.classList.add("mobile-only")
    } else {
      document.querySelector(tocMenuSelector).before(filterbox)
      filterbox.classList.remove("mobile-only")
    }
  }

  const tags = getTags()
  let checkboxes, closeButton
  if (tags.length) {
    createMenu(tags)
    checkboxes = getCheckboxes()
    closeButton = getCloseButton()
    checkboxUpdaterFunction()
    window.addEventListener("popstate", checkboxUpdaterFunction)
    window.matchMedia(`(min-width: ${mobileThreshold}px)`).addEventListener("change", moveMenu)
  }

})()
