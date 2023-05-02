(function () {

  function countTabGroups(tabs) {
    var count = 0
    for (var i = 0, length = tabs.length; i < length; i++) {
      if (i > 0 && tabs[i].previousElementSibling != tabs[i-1]) {count++}
      tabs[i].classList.add("tabGroup_" + count)
    }
    return count
  }

  function createTabBar(n) {
    const tabs = document.getElementsByClassName("tabGroup_" + n)
    const tabBar = document.createElement("div")
    const ul = document.createElement("ul")
    tabBar.className = "ulist tabBar"
    tabs[0].parentNode.insertBefore(tabBar, tabs[0])
    tabBar.appendChild(ul)

    for (var i = 0, length = tabs.length; i < length; i++) {
      const tabHeading = tabs[i].querySelector("h2:first-child, h3:first-child, h4:first-child, h5:first-child, h6:first-child")
      const id = tabHeading.textContent.replaceAll(" ", "_").replaceAll(/[’:/()]|_+$/g, "")

      const li = document.createElement("li")
      const p = document.createElement("p")
      const a = document.createElement("a")
      const hash = "#_" + id
      a.className = "tabLink tabLinkGroup_" + n
      a.href = hash
      a.textContent = tabHeading.id.replaceAll(/_\d+$/g, "")
      ul.appendChild(li)
      li.appendChild(p)
      p.appendChild(a)

      tabs[i].id = hash
      tabHeading.id = id
      tabHeading.getElementsByClassName("anchor")[0].remove()
    }
  }

  function findParentSection(hash) {
    const target = document.querySelector(hash)
    if (target) {
      if (target.parentNode.classList.contains("tab") && !target.parentNode.classList.contains("active")) {
        hash = document.getElementById(hash.substring(1)).parentNode.id
      }
      else if (target.parentNode.parentNode.classList.contains("tab") && !target.parentNode.parentNode.classList.contains("active")) {
        hash = document.getElementById(hash.substring(1)).parentNode.parentNode.id
      }
      else if (target.parentNode.parentNode.parentNode.classList.contains("tab") && !target.parentNode.parentNode.classList.contains("active")) {
        hash = document.getElementById(hash.substring(1)).parentNode.parentNode.parentNode.id
      }
      else if (target.parentNode.parentNode.parentNode.parentNode.classList.contains("tab") && !target.parentNode.parentNode.classList.contains("active")) {
        hash = document.getElementById(hash.substring(1)).parentNode.parentNode.parentNode.parentNode.id
      }
    }
    return hash
  }

  function updateTabs(n, scrollFlag, hash, scrollBehavior="auto") {
    const tabLinks = document.getElementsByClassName("tabLinkGroup_" + n)
    const tabs = document.getElementsByClassName("tabGroup_" + n)
    hash = findParentSection(hash)

    for (var i = 0, length = tabLinks.length; i < length; i++) {
      const tabOfHash = document.getElementById(hash)
      tabLinks[i].classList.remove("active")
      tabs[i].classList.remove("active")
      if (tabOfHash) {
        document.querySelector("[href='" + hash + "']").classList.add("active")
        tabOfHash.classList.add("active")
      }
    }

    const numOfActiveTabs = document.getElementsByClassName("tabLinkGroup_" + n + " active").length
    if (numOfActiveTabs === 0) {
      document.getElementsByClassName("tabLinkGroup_" + n)[0].classList.add("active")
      document.getElementsByClassName("tabGroup_" + n)[0].classList.add("active")
    }
    if (scrollFlag && numOfActiveTabs > 0) {
      hash = decodeURIComponent(window.location.hash)
      if (hash) {
        const scrollTarget = document.getElementById(hash) || document.querySelector(hash)
        window.scrollTo({top: scrollTarget.offsetTop - 80, behavior: scrollBehavior})
      }
    }

    // Fix for outscale-tooltips.js
    const tooltipTexts = document.getElementsByClassName('tooltiptext')
    for (var i = 0, length = tooltipTexts.length; i < length; i++) {
      const parent = tooltipTexts[i].parentNode
      const x = - (parent.offsetWidth + tooltipTexts[i].offsetWidth) / 2
      tooltipTexts[i].style['margin-left'] = x + 'px'
    }
  }

  function updateTabs2() {
    const tabs = document.getElementsByClassName("tab")
    var n = 0
    var scrollFlag = false
    var hash = decodeURIComponent(window.location.hash) || tabs[0].id
    if (!hash.startsWith("#_")) {
      hash = hash.replace("#", "#_")
      window.location.hash = hash
      scrollFlag = true
    }
    hash2 = findParentSection(hash)
    var test = document.querySelector(".tabLink[href='" + (hash2 || hash) + "']")
    if (test) {
      for (var i = 0, length = tabs.length; i < length; i++) {
        if (test.classList.contains("tabLinkGroup_" + i)) {
          n = i
          break
        }
      }
      updateTabs(n, scrollFlag, hash)
      if (hash !== hash2) updateTabs(n, true, hash2, "smooth")
    }
  }

  function moveSpecialDivs() {
    const mobileOnlyDivs = document.getElementsByClassName('mobile-only')
    const awsDisclaimer = document.getElementById('aws-disclaimer')
    document.getElementsByClassName('doc')[0].append(...mobileOnlyDivs)
    if (awsDisclaimer) document.getElementsByClassName('doc')[0].append(awsDisclaimer)
  }

  const tabs = document.getElementsByClassName("tab")
  if (tabs.length > 0) {
    for (var n = 0, count = countTabGroups(tabs); n <= count; n++) {
      createTabBar(n)
      var hash = decodeURIComponent(window.location.hash) || tabs[0].id
      updateTabs(n, true, hash)
    }
    window.onhashchange = updateTabs2
    moveSpecialDivs()
  }

})()
