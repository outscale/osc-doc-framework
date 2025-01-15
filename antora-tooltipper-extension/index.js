module.exports.register = function ({ config }) {
  const tooltipsConfig = {}

  this.once('contentAggregated', ({ contentAggregate }) => {
    for (let i = 0, length = contentAggregate.length; i < length; i++) {
      const componentName = contentAggregate[i].name
      tooltipsConfig[componentName] = contentAggregate[i].ext?.antoraTooltipperExtension || {}
    }
    if (Object.keys(tooltipsConfig.ROOT || {}).length === 0) {
      tooltipsConfig.ROOT = tooltipsConfig.en || {}
    }
  })

  this.once('pagesComposed', ({ contentCatalog }) => {
    const pages = contentCatalog.getPages()
    for (let j = 0, length = pages.length; j < length; j++) {
      const componentName = pages[j].src.component
      processPage(pages[j], tooltipsConfig[componentName])
    }
  })
}

function processPage (page, tooltipsComponentConfig) {
  const pattern = tooltipsComponentConfig.pattern || '<h([1-2]).*?>.+?</h\\1>|(?<=</h[1-2]>)[\\s\\S]+?(?=<h2|</main>)'
  const tooltips = tooltipsComponentConfig.tooltips || []
  const flag = tooltipsComponentConfig.flag || ''
  const exemptedTags = '(' + (tooltipsComponentConfig.exemptedTags || 'h1|h2|a|code|span|strong') + ')'

  let text = page.contents.toString()
  const pageChunks = text.match(new RegExp(pattern, 'g'))
  if (pageChunks) {
    const newPageChunks = []
    for (const pageChunk of pageChunks) {
      newPageChunks.push(addTooltips(pageChunk, tooltips, flag))
    }
    text = swapPagePartsWithNewPageParts(text, pageChunks, newPageChunks)
    text = removeTooltipsFromExemptedTags(text, exemptedTags)
    page.contents = Buffer.from(text)
  }
}

function addTooltips (pageChunk, tooltips, flag) {
  for (const n of tooltips) {
    pageChunk = pageChunk.replace(
      new RegExp('(?<!["\\w\\-#])(' + n.find + ')(?!["\\w\\)])', flag),
      '<span class="tooltip" data-tooltip="' + n.tooltip + '">$1</span>'
    )
  }

  return pageChunk
}

function swapPagePartsWithNewPageParts (text, pageChunks, newPageChunks) {
  const startOfFirstPartIndex = text.indexOf(pageChunks[0])
  const lastPart = pageChunks[pageChunks.length - 1]
  const endOfLastPartIndex = text.indexOf(lastPart) + lastPart.length

  return text.substring(0, startOfFirstPartIndex) + newPageChunks.join('') + text.substring(endOfLastPartIndex)
}

function removeTooltipsFromExemptedTags (text, exemptedTags) {
  const tooltipTag = '<span class="tooltip" data-tooltip=".+?">' + '(?<term>.+?)' + '</span>'
  const tagPattern = new RegExp('(?<start><' + exemptedTags + '.*?>[^<]*?)' + tooltipTag + '(?<end>[^<]*?</\\2>)', 'g')
  const idPattern = new RegExp('(?<start>id="[^<]*?)' + tooltipTag + '(?<end>.*?")', 'g')
  text = text.replace(tagPattern, '$<start>$<term>$<end>')
  text = text.replace(idPattern, '$<start>$<term>$<end>')

  return text
}
