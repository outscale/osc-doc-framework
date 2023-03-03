(function () {

  function copyToSidebar(tag, strEn, strFr) {
    const s = tag.textContent
    if (s.includes(strEn) || s.includes(strFr)) {
      const heading = tag.parentNode.parentNode
      const content = heading.nextElementSibling
      const headingCopy = heading.cloneNode(true)
      const contentCopy = content.cloneNode(true)
      tocMenu.append(headingCopy, contentCopy)
      heading.classList.add('mobile-only')
      content.classList.add('mobile-only')
    }
  }

  function createSidebar() {
    const sidebar = document.createElement("aside")
    const tocMenu = document.createElement("div")
    sidebar.className = "toc sidebar"
    tocMenu.className = "toc-menu"
    sidebar.appendChild(tocMenu)
    document.getElementsByClassName("content")[0].prepend(sidebar)
  }

  if (document.getElementsByClassName("toc sidebar").length === 0) createSidebar()
  const tocMenu = document.querySelector(".toc.sidebar .toc-menu")
  for (const tag of document.querySelectorAll("div > p > strong")) {
    copyToSidebar(tag, "Related Page", " connexe")
    copyToSidebar(tag, "Corresponding API Method", " API correspondante")
  }
  const editThisPage = document.querySelector(".edit-this-page")
  if (editThisPage) {
    const editThisPageCopy = editThisPage.cloneNode(true)
    tocMenu.appendChild(editThisPageCopy)
    editThisPage.classList.add('mobile-only')
  }

})()
