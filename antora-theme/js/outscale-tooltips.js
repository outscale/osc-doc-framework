// https://stackoverflow.com/a/10618517
// https://www.w3schools.com/css/css_tooltip.asp

(function () {
  const LANG = document.documentElement.lang

  const map_aws2osc = new Map()
  map_aws2osc.set('Availability Zone \\(AZ\\)', { en: 'Subregion', fr : 'Sous-région' })
  map_aws2osc.set('customer gateway', { en: 'client gateway', fr : null })
  map_aws2osc.set('External IP \\(EIP\\)', { en: 'public IP', fr : 'IP publique' })
  map_aws2osc.set('flexible network interface \\(FNI\\)', { en: 'network interface card (NIC)', fr : null })
  map_aws2osc.set('instance', { en: 'virtual machine (VM)', fr : 'machine virtuelle (VM)' })
  map_aws2osc.set('internet gateway', { en: 'Internet service', fr : null })
  map_aws2osc.set('Internet gateway', { en: 'Internet service', fr : null })
  map_aws2osc.set('NAT gateway', { en: 'NAT service', fr : null })
  map_aws2osc.set('private virtual interface', { en: 'DirectLink interface', fr : null })
  map_aws2osc.set('virtual interface privée', { en: 'DirectLink interface', fr : null })
  map_aws2osc.set('virtual interfaces privées', { en: 'DirectLink interfaces', fr : null })
  map_aws2osc.set('Virtual Private Cloud \\(VPC\\)', { en: 'Net', fr : null })
  map_aws2osc.set('virtual private gateway', { en: 'virtual gateway', fr : null })
  map_aws2osc.set('VPC endpoint', { en: 'Net access point', fr : null })
  map_aws2osc.set('VPC peering connection', { en: 'Net peering', fr : null })
  const TEXT_OSC_BEFORE = { en: "", fr: "" }
  const TEXT_OSC_AFTER = { en: " in OUTSCALE API", fr: " dans l'API OUTSCALE" }

  const map_osc2aws = new Map()
  map_osc2aws.set('Subregion', { en: 'Availability Zone (AZ)', fr : null })
  map_osc2aws.set('Sous-région', { en: 'Availability Zone (AZ)', fr : null })
  map_osc2aws.set('client gateway', { en: 'customer gateway', fr : null })
  map_osc2aws.set('public IP', { en: 'External IP (EIP)', fr : null })
  map_osc2aws.set('IP publique', { en: 'External IP (EIP)', fr : null })
  map_osc2aws.set('network interface card \\(NIC\\)', { en: 'flexible network interface (FNI)', fr : null })
  map_osc2aws.set('virtual machine \\(VM\\)', { en: 'instance', fr : null })
  map_osc2aws.set('machine virtuelle \\(VM\\)', { en: 'instance', fr : null })
  map_osc2aws.set('machines virtuelles \\(VM\\)', { en: 'instance', fr : null })
  map_osc2aws.set('Internet service', { en: 'Internet gateway', fr : null })
  map_osc2aws.set('NAT service', { en: 'NAT gateway', fr : null })
  map_osc2aws.set('DirectLink interface', { en: 'private virtual interface', fr : 'virtual interface privée' })
  map_osc2aws.set('DirectLink interfaces', { en: 'private virtual interfaces', fr : 'virtual interfaces privées' })
  map_osc2aws.set('virtual gateway', { en: 'virtual private gateway', fr : null })
  map_osc2aws.set('Net access point', { en: 'VPC endpoint', fr : null })
  map_osc2aws.set('Net peering', { en: 'VPC peering connection', fr : null })
  map_osc2aws.set('Net', { en: 'Virtual Private Cloud (VPC)', fr : null })
  const TEXT_AWS_BEFORE = { en: "", fr: "" }
  const TEXT_AWS_AFTER = { en: " in AWS-Compliant APIs", fr: " dans les API AWS-compliant" }

  const TEXT_SIDEBAR = {
    en: "<strong>Note:</strong><br /><br />Cockpit v2 uses the terminology of the OUTSCALE API.<br /><br />For example, a VPC in the AWS terminology is a Net in OUTSCALE terminology.<br /><br />In this page, you can hover over the underlined terms to see the various correspondences (see also the <a href=\"OUTSCALE-APIs-Reference.html#_differences_in_resource_names\">full list here</a>).",
    fr: "<strong>Remarque :</strong><br /><br />Cockpit v2 utilise la terminologie de l'API OUTSCALE.<br /><br />Par exemple, un VPC dans la terminologie AWS est un Net dans la terminologie OUTSCALE.<br /><br />Dans cette page, vous pouvez survoler les termes soulignés pour voir les différentes correspondances (voir aussi la <a href=\"Référentiel-des-API-OUTSCALE.html#_différences_entre_les_noms_de_ressource\">liste complète</a>)."
  }

  function expandMap (map, textBefore, textAfter) {
    const map2 = new Map()
    map.forEach(function (valuesEnFr, key) {
      const abbreviatableKey = key.split(' \\(')
      if (abbreviatableKey.length > 1) {
        map.set(abbreviatableKey[0], valuesEnFr)
        map.set(abbreviatableKey[1].replace('\\)', ''), valuesEnFr)
      }

      let keyPlural = key + 's'
      let abbrS = 's'
      if (LANG === 'fr') abbrS = ''
      if (key.charAt(key.length - 1) === ')') keyPlural = key.replace(/ \\\((.+)\\\)/g, 's \\($1' + abbrS + '\\)')

      let value = valuesEnFr[LANG] || valuesEnFr.en
      let valuePlural = value + 's'
      if (value.charAt(value.length - 1) === ')') valuePlural = value.replace(/ \((.+)\)/g, 's \($1' + abbrS + '\)')
      valuePlural = valuePlural.replace('achine virtuelle', 'achines virtuelle')
      value = (textBefore[LANG] || textBefore.en) + value + (textAfter[LANG] || textAfter.en)
      valuePlural = (textBefore[LANG] || textBefore.en) + valuePlural + (textAfter[LANG] || textAfter.en)

      map2.set(keyPlural, valuePlural)
      map2.set(key, value)
    })
    return map2
  }

  // Reusable generic function
  function surroundInElement (el, regex, surrounderCreateFunc) {
    // script and style elements are left alone
    if (!/^(script|style)$/.test(el.tagName)) {
      let child = el.lastChild
      while (child) {
        if (
          child.nodeType === 1 && !child.classList.contains('tooltip') && !child.classList.contains('print-only') &&
          child.tagName !== 'CODE' && child.tagName !== 'STRONG' && child.tagName !== 'ASIDE' && child.tagName !== 'A'
        ) {
          surroundInElement(child, regex, surrounderCreateFunc)
        } else if (child.nodeType === 3) {
          surroundMatchingText(child, regex, surrounderCreateFunc)
        }
        child = child.previousSibling
      }
    }
  }

  // Reusable generic function
  function surroundMatchingText (textNode, regex, surrounderCreateFunc) {
    const parent = textNode.parentNode
    let result, surroundingNode, matchedTextNode, matchLength, matchedText
    while (textNode && (result = regex.exec(textNode.data))) {
      matchedTextNode = textNode.splitText(result.index)
      if (matchedTextNode.textContent.includes('Netw')) break
      if (matchedTextNode.textContent.includes('Nett')) break
      if (matchedTextNode.textContent.includes('instance is a vir')) break
      if (matchedTextNode.textContent.includes('instance est une mac')) break
      if (matchedTextNode.textContent.includes('virtual machine launched in')) break
      if (matchedTextNode.textContent.includes('machine virtuelle lancée dans')) break
      matchedText = result[0]
      matchLength = matchedText.length
      textNode = (matchedTextNode.length > matchLength)
        ? matchedTextNode.splitText(matchLength)
        : null
      surroundingNode = surrounderCreateFunc(matchedTextNode.cloneNode(true))
      parent.insertBefore(surroundingNode, matchedTextNode)
      parent.removeChild(matchedTextNode)
      surroundingNode.childNodes[0].textContent = surroundingNode.childNodes[0].textContent.replaceAll(' ', ' ')
      const x = - (surroundingNode.offsetWidth + surroundingNode.firstElementChild.offsetWidth) / 2
      surroundingNode.firstElementChild.style['margin-left'] = x + 'px'
    }
  }

  // This function does the surrounding for every matched piece of text and can be customized to do what you like
  function createSpan (matchedTextNode) {
    const term = matchedTextNode.textContent.replace(/(\(|\))/g, '\\$1')
    const tooltipClass = map2.get(term).replace(/( |'|\(|\)|s\W)/g, '')

    const el = document.createElement('span')
    el.classList.add('tooltip')

    const child = document.createElement('span')
    child.classList.add('tooltiptext', tooltipClass)

    child.textContent = map2.get(term)

    el.appendChild(matchedTextNode)
    el.appendChild(child)
    return el
  }

  function removeExtraTooltips (value, section) {
    if (section) {
      const tooltipClass = value.replace(/( |'|\(|\)|s\W)/g, '')
      const n = section.getElementsByClassName(tooltipClass)
      for (var j = 1, length = n.length; j < length; j++) {
        n[j].classList.add('delete')
      }
      const m = section.getElementsByClassName('delete')
      while (m[0]) {
        m[0].parentNode.classList.remove('tooltip')
        m[0].remove()
      }
    }
  }

  function addRightSidebarBox () {
    const tocMenu = document.querySelector('.toc.sidebar .toc-menu')
    const box = document.createElement('div')
    box.id = 'term-box'

    const div = document.createElement('div')
    div.className = 'paragraph'
    const p = document.createElement('p')
    // const strong = document.createElement('strong')
    // strong.textContent = 'Note:'
    // p.append(strong)
    div.append(p)

    const div2 = document.createElement('div')
    div2.className = 'ulist'
    const ul = document.createElement('ul')
    const li = document.createElement('li')
    const p2 = document.createElement('p')
    p2.innerHTML = (TEXT_SIDEBAR[LANG] || TEXT_SIDEBAR.en)
    li.append(p2)
    ul.append(li)
    div2.append(ul)

    box.append(div, div2)
    tocMenu.prepend(box)
  }

  // The main function
  function wrapText (container, text) {
    surroundInElement(container, new RegExp(text), createSpan)
  }

  const temp1 = expandMap(map_aws2osc, TEXT_OSC_BEFORE, TEXT_OSC_AFTER)
  const temp2 = expandMap(map_osc2aws, TEXT_AWS_BEFORE, TEXT_AWS_AFTER)
  const map2 = new Map([...temp1, ...temp2])
  map2.forEach(function (value, key) {
    wrapText(document.getElementsByClassName('doc')[0], key)
    var section = document.getElementsByClassName('sectionbody')
    if (!section.length) var section = document.getElementsByClassName('doc')
    removeExtraTooltips(value, section[0])
    removeExtraTooltips(value, section[1])
    removeExtraTooltips(value, section[2])
    removeExtraTooltips(value, section[3])
    removeExtraTooltips(value, section[4])
    removeExtraTooltips(value, section[5])
    removeExtraTooltips(value, section[6])
  })
  addRightSidebarBox()
})()
