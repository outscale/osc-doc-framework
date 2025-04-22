const fs = require('fs')
const yaml = require('js-yaml')

const ERROR_START = '\u001b[31m'
const ERROR_END = '\u001b[0m'

function parseArgs () {
  const dictionary = {}
  const argv = process.argv
  for (const [i, key] of Object.entries(argv)) {
    if (key.startsWith('--')) {
      dictionary[camelCase(key)] = argv[parseInt(i) + 1]
    }
  }

  return dictionary
}

function camelCase(str){
  const arr = str.substring(2).split('-')
  const capital = arr.map((item, index) => index ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() : item)

  return capital.join('')
}

function parseYaml (path_or_string) {
  try {
    if (path_or_string.includes('\n') === false) {
      const path = path_or_string
      const file = fs.readFileSync(path, 'utf-8')

      // https://github.com/nodeca/js-yaml#load-string---options-
      const yamlOptions = {
        filename: path,
      }

      return yaml.load(file, yamlOptions)
    } else {
      const string = path_or_string
      return yaml.load(string)
    }
  } catch (err) {
    if (err instanceof yaml.YAMLException) {
      console.error(ERROR_START + err.toString() + ERROR_END)
    } else {
      console.error(ERROR_START + err + ERROR_END)
    }
    process.exit(1)
  }
}

function dumpYaml (api) {
  // https://github.com/nodeca/js-yaml/blob/master/README.md#dump-object---options-
  const yamlOptions = {
    noArrayIndent: true,
    sortKeys: true,
    lineWidth: -1,
  }

  return yaml.dump(api, yamlOptions)
}

module.exports = {
  parseArgs,
  parseYaml,
  dumpYaml,
}
