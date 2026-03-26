const correspondences = require('./code_hcl.json')

function generateHclExamples(data) {
    const api_name = find_api_name(data)
    const correspondence = correspondences[api_name + '.' + data.operationUniqueName]
    if (correspondence) {
        let s1 = correspondence.join(" or ")
        let s2 = 'resource'
        if (s1.includes('data-source')) {
            s2 = 'data source'
        }
        if (correspondence.length > 1) {
            s2 += 's'
        }
        if (correspondence.length > 2) {
            s1 = correspondence.slice(0, -1).join(", ") + ", or " + correspondence.slice(-1)
        }
        return 'See the ' + s1 + ' ' + s2 + ' in the Terraform OUTSCALE provider.'
    } else {
        return 'There is no equivalent for this method in the Terraform OUTSCALE provider.'
    }
}

function find_api_name(data) {
    if (data.host.startsWith('api') && !data.host.includes('oks')) {
        return 'oapi'
    } else if (data.api.info?.title === 'OKS API' || data.host?.includes('oks.outscale.')) {
        return 'oks'
    } else {
        return data.host.split('.')[0]
    }
}

module.exports = generateHclExamples
