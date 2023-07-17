(function () {

    function getPageOrigin() {
      if (document.location.protocol === "file:") {
        const pathInSite = (document.location.pathname + window.location.search).split("build/site/").pop()
        return decodeURI(pathInSite)
      }
      else {
        const a = document.createElement("a")
        const urlWithQuery = document.location.origin + document.location.pathname + window.location.search
        a.href = urlWithQuery
        a.textContent = decodeURI(urlWithQuery)
        return a
      }
    }
  
    function getSitePath() {
      const fullUrl = document.querySelector("head [rel=canonical]").href
      const currentPageName = document.location.pathname.split("/").pop() 
  
      return fullUrl.replace(currentPageName, "")
    }
  
    function createTimestamp(pageOrigin) {
      const p = document.createElement("p")
      let text = "Retrieved from"
      if (document.documentElement.lang === "fr") text = "Récupéré depuis"
      p.classList.add("print-only")
      p.append(text, " ", pageOrigin, " (", new Date().toISOString(), ")")
      document.querySelector(".doc h1").after(p)
    }
  
    function adaptToPrint() {
      // Make xrefs absolute
      const sitePath = getSitePath()
      const xrefs = document.querySelectorAll("a.xref:not([href^=http])")
      for (const xref of xrefs) {
        xref.href = sitePath + xref.getAttribute("href")
      }
      // remove parentheses in tooltip texts
      const tooltipTexts = document.getElementsByClassName("tooltiptext")
      for (const tooltipText of tooltipTexts) {
        let word = "or"
        if (document.documentElement.lang === "fr") word = "ou"
        tooltipText.textContent = tooltipText.textContent.replace(/\((.+?)\)/g, word + " $1")
      }
    }
  
    function adaptToScreen() {
      // Make xrefs relative
      const sitePath = getSitePath()
      const xrefs = document.querySelectorAll("a.xref[href^=http]")
      for (const xref of xrefs) {
        xref.href = xref.href.replace(sitePath, "")
      }
      // Add parentheses back in tooltip texts
      const tooltipTexts = document.getElementsByClassName("tooltiptext")
      for (const tooltipText of tooltipTexts) {
        tooltipText.textContent = tooltipText.textContent.replace(/\b(or|ou) (.+?)\b/g, "($2)")
      }
    }
  
    const pageOrigin = getPageOrigin()
    createTimestamp(pageOrigin)
    window.addEventListener("beforeprint", adaptToPrint)
    window.addEventListener("afterprint", adaptToScreen)
  
  })()
  
  let hasClickedPrintButton
  
  function printPage() {
    if (!hasClickedPrintButton) {
      if (document.documentElement.lang === "fr") alert('Dans la prochaine fenêtre, sélectionnez l\'imprimante "Enregistrer au format PDF" pour exporter cette page en PDF.')
      else alert('In the next window, select the "Save as PDF" printer to export this page to PDF.')
      hasClickedPrintButton = true
    }
    window.print()
  }
  