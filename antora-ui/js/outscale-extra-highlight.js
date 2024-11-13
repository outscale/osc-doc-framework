(function () {

  const prompts = document.querySelectorAll('.language-shell .hljs-meta')

  for (let i = 0, length = prompts.length; i < length; i++) {
    const prompt = prompts[i]
    const command = prompts[i].nextSibling
    if (prompt.textContent.startsWith('\n')) {
      prompts[i].previousSibling.textContent += '\n'
    }
    if (prompt.textContent.endsWith('$')) {
      prompt.textContent = ''
      command.textContent = command.textContent.trimStart()
    }
  }

})()
