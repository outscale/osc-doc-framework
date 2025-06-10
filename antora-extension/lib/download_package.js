const fs = require('fs')
const path = require('path')
const git = require('isomorphic-git')
const helperFunctions = require('./helper_functions')
const { execSync } = require("child_process")
const { Readable } = require('stream')
const { finished } = require('stream/promises')

try {
  require('mac-ca').addToGlobalAgent()
}
catch (e) {}

let AUTH = { headers: {'PRIVATE-TOKEN': process.env.GITLAB_READ_API_TOKEN} }
if (process.env.GITLAB_CI) {
  AUTH = { headers: {'PRIVATE-TOKEN': process.env.TOKEN_FOR_READING_API_OSC} }
}
const COLOR = "\u001b[36m'"
const CLR = "'\u001b[0m"

async function runInCli () {
  const options = helperFunctions.parseArgs()

  if (!options.apiProject || !options.version || !options.api) {
    console.log('Please specify --api-project, --version, --api-file.')
    process.exit(1)
  }
  options.outputDir = '.'
  options.repoName = ''
  const url = options.apiProject
  const package = await figureOutPackage(url, options.version, options.apiProject)

  await extractFilesFromPackage(options, url, package)
}

async function runInNode (options) {
  let package
  const url = options.apiProject
  const name = url.split('/').slice(6)[0].replace(/%2F/g, '/')

  const userguideBranch = await git.currentBranch({ fs, dir: '.' })
  if (userguideBranch === 'master') {
    package = await getLatestPackage(url)
    console.log(`We will download the package ${COLOR}${name}${CLR} (latest version: ${COLOR}${package.version}${CLR}), as required by '${options.repoName}'`)
  }
  else {
    package = await figureOutPackage(url, options.apiVersion)
    console.log(`We will download the package ${COLOR}${name}${CLR} (version ${COLOR}${package.version}${CLR}), as required by '${options.repoName}'`)
  }

  await extractFilesFromPackage(options, url, package)
}

async function extractFilesFromPackage (options, url, package) {
  const latestFilename = await getLatestFilename(url, package.id)
  const file = await getFile(url, package.name, package.version, latestFilename)
  const filepath = options.outputDir + '/' + package.name + '.tar.gz'
  await writeFile(file, filepath)

  const filesToExtract = path.parse(options.api || '').base + ' ' + path.parse(options.errors || '').base
  fs.mkdirSync(options.outputDir + '/' + options.repoName, { recursive: true })
  execSync('tar -xf ' + filepath + ' -C ' + options.outputDir + '/' + options.repoName + ' ' + filesToExtract)
}

async function getLatestPackage (url) {
  let listPackages
  let packages = []

  let page = 1
  while (page) {
    // https://docs.gitlab.com/ee/api/packages.html#list-packages
    listPackages = await fetch(url + '?per_page=100&page=' + page, AUTH)
    checkIfError(listPackages)
    packages.push(...await listPackages.json())
    page = listPackages.headers.get('x-next-page')
  }
  packages.sort(semverSort)

  return packages.pop()
}

async function figureOutPackage (url, specifiedVersion, name) {
  let package = await getPackage(url, specifiedVersion)

  if (package === undefined) {
    package = await getPackage(url, specifiedVersion + '-rc')
  }
  if (package === undefined) {
    package = await getPackage(url, specifiedVersion + '-beta')
  }
  if (package === undefined) {
    package = await getPackage(url, specifiedVersion + '-alpha')
  }
  if (package === undefined) {
    console.error(`\nError: Can't find version ${specifiedVersion} in ${name}`)
    process.exit(1)
  }

  return package
}

async function getPackage (url, specifiedVersion) {
  let listPackages
  let packages = []

  listPackages = await fetch(url + '?package_version=' + specifiedVersion + '&sort=desc&per_page=1', AUTH)
  checkIfError(listPackages)
  packages = await listPackages.json()
  packages.sort(semverSort)

  return packages.pop()
}

function semverSort(a, b) {
  const aSplit = a.version.split('.')
  const bSplit = b.version.split('.')

  // major number
  const _a = Number(aSplit[0])
  const _b = Number(bSplit[0])
  if (_a < _b) {return -1}
  if (_a > _b) {return 1}

  // minor number
  const _aa = Number(aSplit[1])
  const _bb = Number(bSplit[1])
  if (_aa < _bb) {return -1}
  if (_aa > _bb) {return 1}

  // patch number
  const _aaa = Number(aSplit[2])
  const _bbb = Number(bSplit[2])
  if (_aaa < _bbb) {return -1}
  if (_aaa > _bbb) {return 1}

  // '-alpha', '-beta', '-rc', or '' suffix
  let _aaaa
  if (aSplit[2]) {
    _aaaa = aSplit[2].split('-')
    if (!_aaaa[1]) {_aaaa[1] = '\uFFFF'}
  }
  let _bbbb
  if (bSplit[2]) {
    _bbbb = bSplit[2].split('-')
    if (!_bbbb[1]) {_bbbb[1] = '\uFFFF'}
  }
  if (_aaaa < _bbbb) {return -1}
  if (_aaaa > _bbbb) {return 1}

  return 0
}

async function getLatestFilename (url, packageId) {
  let listPackageFiles

  let page = 1
  while (page) {
    // https://docs.gitlab.com/ee/api/packages.html#list-package-files
    listPackageFiles = await fetch(url + '/' + packageId + '/package_files?per_page=100&page=' + page, AUTH)
    checkIfError(listPackageFiles)
    page = listPackageFiles.headers.get('x-next-page')
  }
  const packageFiles = await listPackageFiles.json()

  return packageFiles.at(-1).file_name
}

async function getFile (url, packageName, specifiedVersion, latestFilename) {
  // https://docs.gitlab.com/ee/user/packages/generic_packages/#download-package-file
  const downloadPackageFile = await fetch(`${url}/generic/${packageName}/${specifiedVersion}/${latestFilename}`, AUTH)
  checkIfError(downloadPackageFile)

  return downloadPackageFile.body
}

async function writeFile (file, filename) {
  const body = Readable.fromWeb(file)
  const writeStream = fs.createWriteStream(filename)

  await finished(body.pipe(writeStream))
}

function checkIfError (response) {
  if (!response.ok) {
    console.error('\nError ' + response.status + ': ' + response.statusText + '\n')
  }
}

if (path.parse(process.argv[1]).base === path.parse(__filename).base) {
  runInCli()
}

module.exports = runInNode
