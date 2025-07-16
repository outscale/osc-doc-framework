const fs = require('fs')

const buffer = fs.readFileSync(__dirname + '/package.json')
const data = JSON.parse(buffer)

const newData = {
  dependencies: { "@outscale/osc-doc-framework": "file:osc-doc-framework" },
  overrides: data.overrides,
}
const newBuffer = JSON.stringify(newData, null, 2)

fs.writeFileSync('package.json', newBuffer)
