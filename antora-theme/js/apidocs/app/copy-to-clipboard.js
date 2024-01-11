;(function () {
  'use strict'

  var CMD_RX = /^\$ (\S[^\\\n]*(\\\n(?!\$ )[^\\\n]*)*)(?=\n|$)/gm
  var LINE_CONTINUATION_RX = /( ) *\\\n *|\\\n( ?) */g
  var TRAILING_SPACE_RX = / +$/gm

  var config = (document.getElementById('site-script') || { dataset: {} }).dataset
  var supportsCopy = window.navigator.clipboard

  ;[].slice.call(document.querySelectorAll('.api pre.highlight:not(.tab-bash,.tab-json)')).forEach(function (pre) {
    var code, language, lang, copy, copy2, toast, toast2, toolbox
    if (pre.classList.contains('highlight')) {
      code = pre.querySelector('code')
      if ((language = code.dataset.lang) && language !== 'console') {
        ;(lang = document.createElement('span')).className = 'source-lang'
        lang.appendChild(document.createTextNode(language))
      }
    } else if (pre.innerText.startsWith('$ ')) {
      var block = pre.parentNode.parentNode
      block.classList.remove('literalblock')
      block.classList.add('listingblock')
      pre.classList.add('highlightjs', 'highlight')
      ;(code = document.createElement('code')).className = 'language-console hljs'
      code.dataset.lang = 'console'
      code.appendChild(pre.firstChild)
      pre.appendChild(code)
    } else {
      return
    }
    ;(toolbox = document.createElement('div')).className = 'source-toolbox'
    if (lang) toolbox.appendChild(lang)
    if (supportsCopy) {
      ;(copy = document.createElement('button')).className = 'copy-button'
      copy.setAttribute('title', 'Copy to clipboard')
      var img = document.createElement('img')
      img.src = '_/img/octicons-16.svg#view-clippy'
      img.alt = 'copy icon'
      img.className = 'copy-icon'
      copy.appendChild(img)
      ;(toast = document.createElement('span')).className = 'copy-toast'
      toast.appendChild(document.createTextNode('Copied!'))
      copy.appendChild(toast)
      toolbox.appendChild(copy)
      ;if (pre.classList.contains('tab-console') || pre.classList.contains('tab-shell')) {
        (copy2 = document.createElement('button')).className = 'copy-button'
        copy2.setAttribute('title', 'Copy to clipboard (on a single line)')
        var img = document.createElement('img')
        img.src = '_/img/octicons-16.svg#view-clippy'
        img.alt = 'copy icon'
        img.className = 'copy-icon'
        copy2.appendChild(img)
        ;(toast2 = document.createElement('span')).className = 'copy-toast'
        toast2.appendChild(document.createTextNode('Copied!'))
        toast2.appendChild(document.createElement('br'))
        toast2.appendChild(document.createTextNode('(on a single line)'))
        copy2.appendChild(toast2)
        toolbox.appendChild(copy2)
      }
    }
    pre.appendChild(toolbox)
    if (copy) copy.addEventListener('click', writeToClipboard.bind(copy, code))
    if (copy2) copy2.addEventListener('click', writeToClipboard2.bind(copy2, code))
  })

  function extractCommands (text) {
    var cmds = []
    var m
    while ((m = CMD_RX.exec(text))) cmds.push(m[1].replace(LINE_CONTINUATION_RX, '$1$2'))
    return cmds.join(' && ')
  }

  function writeToClipboard (code) {
    var text = code.innerText.replace(TRAILING_SPACE_RX, '')
    text = text.replace(/^# .+?\n\n/g, '')
    text = text.replace(/^# .+?\n\n/g, '')
    text = text.replace(/\n$/, '')
    if (code.dataset.lang === 'console' && text.startsWith('$ ')) text = extractCommands(text)
    window.navigator.clipboard.writeText(text).then(
      function () {
        this.classList.add('clicked')
        this.offsetHeight // eslint-disable-line no-unused-expressions
        setTimeout(() => { this.classList.remove('clicked'); }, 1000);
      }.bind(this),
      function () {}
    )
  }
  function writeToClipboard2 (code) {
    var text = code.innerText.replace(TRAILING_SPACE_RX, '')
    text = text.replace(/^# .+?\n\n/g, '')
    text = text.replace(/^# .+?\n\n/g, '')
    text = text.replace(/( \\)?\n +/g, ' ')
    text = text.trim()
    if (code.dataset.lang === 'console' && text.startsWith('$ ')) text = extractCommands(text)
    window.navigator.clipboard.writeText(text).then(
      function () {
        this.classList.add('clicked')
        this.offsetHeight // eslint-disable-line no-unused-expressions
        setTimeout(() => { this.classList.remove('clicked'); }, 1000);
      }.bind(this),
      function () {}
    )
  }
})()
