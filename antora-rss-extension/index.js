const Vinyl = require('vinyl')
const cheerio = require('cheerio')

module.exports.register = function ({
  config: {
    copyrightName = 'Outscale SAS',
    sectionSelector = 'div.sect2',
    titleSelector = 'h3',
    sectionSelector_v2 = 'div.sect1',
    titleSelector_v2 = 'h2',
  },
}) {
  this.once('beforePublish', ({ playbook, contentCatalog, siteCatalog }) => {
    if (!playbook.site.url) return

    const logger = this.getLogger('@outscale/antora-rss-extension')
    const pages = contentCatalog.getPages()
    const sources = []

    for (let i = 0, length = pages.length; i < length; i++) {
      if (
        pages[i].asciidoc.attributes['page-rssfeed'] === 'true' ||
        pages[i].asciidoc.attributes['page-rssfeed'] === 'v1' ||
        pages[i].asciidoc.attributes['page-rssfeed'] === 'v2'
      ) sources.push(pages[i])
    }

    for (let i = 0, length = sources.length; i < length; i++) {
      let rssPath = sources[i].out.dirname + '/_rss/' + sources[i].out.basename.replace('.html', '.xml')
      rssPath = rssPath.replace('-old-page', '').replace('-ancienne-page', '')
      const htmlContent = sources[i].contents.toString()
      const link = $(htmlContent)('link[rel=canonical]').attr('href')
      const language = $(htmlContent)('html').attr('lang')
      let selectors = [sectionSelector, titleSelector]
      if (sources[i].asciidoc.attributes['page-rssfeed'] === 'v2') {
        selectors = [sectionSelector_v2, titleSelector_v2]
      }

      let rss = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n'
      rss += addCommonPart(htmlContent, link, language, copyrightName)
      rss += addItems(htmlContent, link, language, selectors, logger)
      rss += '</channel>\n</rss>'

      const rssFile = new Vinyl({
        out: { path: rssPath },
        contents: Buffer.from(rss),
      })
      siteCatalog.addFile(rssFile)
    }
  })
}

function $ (x) {
  return cheerio.load(x)
}

function addCommonPart (htmlContent, link, language, copyrightName) {
  const title = $(htmlContent)('title').text()
  const description = $(htmlContent)('#preamble div:first-child > p')
    .text().trim()
    .replace('This page', 'This feed')
    .replace('Cette page', 'Ce flux')
  const copyrightYear = new Date().getFullYear()
  const pubDate = new Date().toUTCString()

  let rss = '  <title>' + title + '</title>\n'
  rss += '  <link>' + link + '</link>\n'
  rss += '  <description>' + description + '</description>\n'
  rss += '  <language>' + language + '</language>\n'
  if (copyrightName) rss += '  <copyright>Copyright © ' + copyrightYear + ' ' + copyrightName + '</copyright>\n'
  rss += '  <pubDate>' + pubDate + '</pubDate>\n'

  return rss
}

function addItems (htmlContent, link, language, selectors, logger) {
  const [sectionSelector, titleSelector] = selectors
  let rss = ''

  const sections = $(htmlContent)(sectionSelector)
  for (let i = 0, length = sections.length; i < length; i++) {
    const section = sections[i]
    const title = $(section)(titleSelector).html().replace(/<.+> */, '')
    const anchor = $(section)(titleSelector + ' > a').attr('href')
    const baseUrl = link.substring(0, link.lastIndexOf(link.replace(/.+\//g, '')))
    const pubDate = getDate(section, link, language, title, logger)
    const tags = $(section)('.tags')
    const categories = getCategories(tags)
    tags.remove()

    $(section)(titleSelector).remove()
    let description = $(section).html()
    description = description.replace(/\n/g, '')
    description = description.replace(/href="(?!http)/g, 'href="' + baseUrl)

    rss += '  <item>\n'
    rss += '    <title>' + title + '</title>\n'
    rss += '    <link>' + link + '</link>\n'
    rss += '    <guid>' + link + anchor + '</guid>\n'
    rss += '    <description><![CDATA[' + description + ']]></description>\n'
    rss += '    <pubDate>' + pubDate + '</pubDate>\n'
    for (let j = 0, length = categories.length; j < length; j++) {
      rss += '    <category>' + categories[j] + '</category>\n'
    }
    rss += '  </item>\n'
  }

  return rss
}

function getDate (sectionContent, link, language, title, logger) {
  const m = $(sectionContent)
    .text()
    .match(/([A-zÀ-ÿ-\d]+) ([A-zÀ-ÿ-\d]+),* (\d\d\d\d)/)
  if (!m) throwError(link, title, logger)

  if (language === 'fr') {
    const frToEn = {
      janvier: 'January',
      février: 'February',
      mars: 'March',
      avril: 'April',
      mai: 'May',
      juin: 'June',
      juillet: 'July',
      août: 'August',
      septembre: 'September',
      octobre: 'October',
      novembre: 'November',
      décembre: 'December',
    }
    m[2] = frToEn[m[2]]
  }

  const date = new Date(m[1] + ' ' + m[2] + ' ' + m[3] + ' 00:00:00 GMT').toUTCString()
  if (date === 'Invalid Date') throwError(link, title, logger)
  else return date
}

function throwError (link, title, logger) {
  const pageName = link.replace(/^.+\/(.+)\.html/, '$1.adoc')
  logger.error(
    'In "' + pageName + '", the date in the "' + title + '" section is not correctly formatted.'
    + ' You can use placeholder elements if you don\'t know the final date yet,'
    + ' but there still has to be three elements in the date (for example: "June XX, 2024").')
  process.exit(1)
}

function getCategories (tags) {
  const categories = []
  for (let i = 0, length = tags.length; i < length; i++) {
    const spans = $(tags[i])('span')
    for (let j = 0, length = spans.length; j < length; j++) {
      const cat = $(spans[j]).text()
      if (!(categories.includes(cat))) categories.push(cat)
    }
  }

  return categories
}
