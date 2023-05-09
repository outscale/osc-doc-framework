const Vinyl = require('vinyl')
const cheerio = require('cheerio')

module.exports.register = function ({
  config: {
    copyrightName = 'Outscale SAS',
    sectionSelector = 'div.sect2',
    titleSelector = 'h3',
    descriptionSelector = '.ulist',
  },
}) {
  this.once('beforePublish', ({ playbook, contentCatalog, siteCatalog }) => {
    if (!playbook.site.url) return

    const logger = this.getLogger('@outscale/antora-rss-extension')
    const pages = contentCatalog.getPages()
    const sources = []

    for (let i = 0, length = pages.length; i < length; i++) {
      if (pages[i].asciidoc.attributes['page-rssfeed'] === 'true') sources.push(pages[i])
    }

    for (let i = 0, length = sources.length; i < length; i++) {
      const rssPath = sources[i].out.dirname + '/_rss/' + sources[i].out.basename.replace('.html', '.xml')
      const htmlContent = sources[i].contents.toString()
      const link = $(htmlContent)('link[rel=canonical]').attr('href')
      const language = $(htmlContent)('html').attr('lang')

      let rss = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n'
      rss += addCommonPart(htmlContent, link, language, copyrightName)
      rss += addItems(htmlContent, link, language, sectionSelector, titleSelector, descriptionSelector, logger)
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

function addItems (htmlContent, link, language, sectionSelector, titleSelector, descriptionSelector, logger) {
  let rss = ''

  const sections = $(htmlContent)(sectionSelector)
  for (let i = 0, length = sections.length; i < length; i++) {
    const section = sections[i]
    const sectionContent = $(section).html()
    const title = $(sectionContent)(titleSelector).text()
    const anchor = $(sectionContent)(titleSelector + ' > a').attr('href')
    const baseUrl = link.substring(0, link.lastIndexOf(link.replace(/.+\//g, '')))
    const pubDate = getDate(sectionContent, link, language, title, logger)

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
    rss += '  </item>\n'
  }

  return rss
}

function getDate (sectionContent, link, language, title, logger) {
  const m = $(sectionContent)
    .text()
    .match(/([A-zÀ-ÿ-\d]+) ([A-zÀ-ÿ-\d]+),* (\d\d\d\d)/)

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
  if (date === 'Invalid Date') {
    const pageName = link.replace(/^.+\/(.+)\.html/, '$1.adoc')
    logger.error('In "' + pageName + '", the date in the "' + title + '" section is not correctly formatted.')
    process.exit(1)
  } else return date
}
