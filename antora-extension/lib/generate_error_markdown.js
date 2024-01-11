function generateErrorMarkdown (errors, api) {
  const info = api.info
  let md = '---\n'
  md += 'title: ' + info.title + ' v' + info.version + ' - Errors\n'
  md += '---\n\n'

  md += '<h1 id="errors">' + info.title + ' v' + info.version + ' - Errors</h1>\n\n'

  md += '<div>This page lists the errors that the ' + info.title + ' can return.\n\n'
  md += 'If you encounter an error in a response, '
  md += 'search for the returned `Code` in this page to find more details about the error.\n\n'

  md += '<a href="' + info.termsOfService + '">Terms of service</a>.\n'
  md += 'Email: <a href="mailto:' + info.contact.email + '">' + info.contact.email + '</a>.\n'
  md += 'License: <a href="' + info.license.url + '">' + info.license.name + '</a>.</div>\n\n'

  md += '|Code|Type|Description|HTTP status|\n'
  md += '|---|---|---|---|\n'

  for (const [k, v] of Object.entries(errors)) {
    md += '|`' + k + '`|`' + v.error_code + '`|**' + v.description.split('\n') + '**'
    if (v.error_message) md += ': ' + v.error_message.replace(/(?<=\w+)\.(?=\w+)/g, '\\.')
    md += '|' + v.http_code + '|\n'
  }

  return md
}

module.exports = generateErrorMarkdown
