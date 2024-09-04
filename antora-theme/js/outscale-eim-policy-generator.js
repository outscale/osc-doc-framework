(function () {
    const oapiActions = ["api:*", "api:Read*", "api:AcceptNetPeering", "api:AddUserToUserGroup", "api:CheckAuthentication", "api:CreateAccessKey", "api:CreateAccount", "api:CreateApiAccessRule", "api:CreateCa", "api:CreateClientGateway", "api:CreateDedicatedGroup", "api:CreateDhcpOptions", "api:CreateDirectLink", "api:CreateDirectLinkInterface", "api:CreateFlexibleGpu", "api:CreateImage", "api:CreateImageExportTask", "api:CreateInternetService", "api:CreateKeypair", "api:CreateListenerRule", "api:CreateLoadBalancer", "api:CreateLoadBalancerListeners", "api:CreateLoadBalancerPolicy", "api:CreateLoadBalancerTags", "api:CreateNatService", "api:CreateNet", "api:CreateNetAccessPoint", "api:CreateNetPeering", "api:CreateNic", "api:CreatePolicy", "api:CreatePolicyVersion", "api:CreateProductType", "api:CreatePublicIp", "api:CreateRoute", "api:CreateRouteTable", "api:CreateSecurityGroup", "api:CreateSecurityGroupRule", "api:CreateServerCertificate", "api:CreateSnapshot", "api:CreateSnapshotExportTask", "api:CreateSubnet", "api:CreateTags", "api:CreateUser", "api:CreateUserGroup", "api:CreateVirtualGateway", "api:CreateVmGroup", "api:CreateVmTemplate", "api:CreateVms", "api:CreateVolume", "api:CreateVpnConnection", "api:CreateVpnConnectionRoute", "api:DeleteAccessKey", "api:DeleteApiAccessRule", "api:DeleteCa", "api:DeleteClientGateway", "api:DeleteDedicatedGroup", "api:DeleteDhcpOptions", "api:DeleteDirectLink", "api:DeleteDirectLinkInterface", "api:DeleteExportTask", "api:DeleteFlexibleGpu", "api:DeleteImage", "api:DeleteInternetService", "api:DeleteKeypair", "api:DeleteListenerRule", "api:DeleteLoadBalancer", "api:DeleteLoadBalancerListeners", "api:DeleteLoadBalancerPolicy", "api:DeleteLoadBalancerTags", "api:DeleteNatService", "api:DeleteNet", "api:DeleteNetAccessPoint", "api:DeleteNetPeering", "api:DeleteNic", "api:DeletePolicy", "api:DeletePolicyVersion", "api:DeletePublicIp", "api:DeleteRoute", "api:DeleteRouteTable", "api:DeleteSecurityGroup", "api:DeleteSecurityGroupRule", "api:DeleteServerCertificate", "api:DeleteSnapshot", "api:DeleteSubnet", "api:DeleteTags", "api:DeleteUser", "api:DeleteUserGroup", "api:DeleteUserGroupPolicy", "api:DeleteVirtualGateway", "api:DeleteVmGroup", "api:DeleteVmTemplate", "api:DeleteVms", "api:DeleteVolume", "api:DeleteVpnConnection", "api:DeleteVpnConnectionRoute", "api:DeregisterVmsInLoadBalancer", "api:LinkFlexibleGpu", "api:LinkInternetService", "api:LinkLoadBalancerBackendMachines", "api:LinkManagedPolicyToUserGroup", "api:LinkNic", "api:LinkPolicy", "api:LinkPrivateIps", "api:LinkPublicIp", "api:LinkRouteTable", "api:LinkVirtualGateway", "api:LinkVolume", "api:PutUserGroupPolicy", "api:ReadAccessKeys", "api:ReadAccounts", "api:ReadAdminPassword", "api:ReadApiAccessPolicy", "api:ReadApiAccessRules", "api:ReadApiLogs", "api:ReadCas", "api:ReadCatalog", "api:ReadCatalogs", "api:ReadClientGateways", "api:ReadConsoleOutput", "api:ReadConsumptionAccount", "api:ReadDedicatedGroups", "api:ReadDhcpOptions", "api:ReadDirectLinkInterfaces", "api:ReadDirectLinks", "api:ReadFlexibleGpuCatalog", "api:ReadFlexibleGpus", "api:ReadImageExportTasks", "api:ReadImages", "api:ReadInternetServices", "api:ReadKeypairs", "api:ReadLinkedPolicies", "api:ReadListenerRules", "api:ReadLoadBalancerTags", "api:ReadLoadBalancers", "api:ReadLocations", "api:ReadManagedPoliciesLinkedToUserGroup", "api:ReadNatServices", "api:ReadNetAccessPointServices", "api:ReadNetAccessPoints", "api:ReadNetPeerings", "api:ReadNets", "api:ReadNics", "api:ReadPolicies", "api:ReadPolicy", "api:ReadPolicyVersion", "api:ReadPolicyVersions", "api:ReadProductTypes", "api:ReadPublicCatalog", "api:ReadPublicIpRanges", "api:ReadPublicIps", "api:ReadQuotas", "api:ReadRegions", "api:ReadRouteTables", "api:ReadSecretAccessKey", "api:ReadSecurityGroups", "api:ReadServerCertificates", "api:ReadSnapshotExportTasks", "api:ReadSnapshots", "api:ReadSubnets", "api:ReadSubregions", "api:ReadTags", "api:ReadUserGroup", "api:ReadUserGroupPolicies", "api:ReadUserGroupPolicy", "api:ReadUserGroups", "api:ReadUserGroupsPerUser", "api:ReadUsers", "api:ReadVirtualGateways", "api:ReadVmGroups", "api:ReadVmTemplates", "api:ReadVmTypes", "api:ReadVms", "api:ReadVmsHealth", "api:ReadVmsState", "api:ReadVolumes", "api:ReadVpnConnections", "api:RebootVms", "api:RegisterVmsInLoadBalancer", "api:RejectNetPeering", "api:RemoveUserFromUserGroup", "api:ScaleDownVmGroup", "api:ScaleUpVmGroup", "api:SetDefaultPolicyVersion", "api:StartVms", "api:StopVms", "api:UnlinkFlexibleGpu", "api:UnlinkInternetService", "api:UnlinkLoadBalancerBackendMachines", "api:UnlinkManagedPolicyFromUserGroup", "api:UnlinkNic", "api:UnlinkPolicy", "api:UnlinkPrivateIps", "api:UnlinkPublicIp", "api:UnlinkRouteTable", "api:UnlinkVirtualGateway", "api:UnlinkVolume", "api:UpdateAccessKey", "api:UpdateAccount", "api:UpdateApiAccessPolicy", "api:UpdateApiAccessRule", "api:UpdateCa", "api:UpdateDedicatedGroup", "api:UpdateDirectLinkInterface", "api:UpdateFlexibleGpu", "api:UpdateImage", "api:UpdateListenerRule", "api:UpdateLoadBalancer", "api:UpdateNet", "api:UpdateNetAccessPoint", "api:UpdateNic", "api:UpdateRoute", "api:UpdateRoutePropagation", "api:UpdateRouteTableLink", "api:UpdateServerCertificate", "api:UpdateSnapshot", "api:UpdateSubnet", "api:UpdateUser", "api:UpdateUserGroup", "api:UpdateVm", "api:UpdateVmGroup", "api:UpdateVmTemplate", "api:UpdateVolume", "api:UpdateVpnConnection"]
    const fcuActions = ["ec2:*", "ec2:Describe*", "ec2:AcceptVpcPeeringConnection", "ec2:AllocateAddress", "ec2:AssignPrivateIpAddresses", "ec2:AssociateAddress", "ec2:AssociateDhcpOptions", "ec2:AssociateRouteTable", "ec2:AttachInternetGateway", "ec2:AttachNetworkInterface", "ec2:AttachVolume", "ec2:AttachVpnGateway", "ec2:AuthorizeSecurityGroupEgress", "ec2:AuthorizeSecurityGroupIngress", "ec2:CancelExportTask", "ec2:CopyImage", "ec2:CopySnapshot", "ec2:CreateCustomerGateway", "ec2:CreateDhcpOptions", "ec2:CreateImage", "ec2:CreateImageExportTask", "ec2:CreateInternetGateway", "ec2:CreateKeyPair", "ec2:CreateNatGateway", "ec2:CreateNetworkInterface", "ec2:CreateRoute", "ec2:CreateRouteTable", "ec2:CreateSecurityGroup", "ec2:CreateSnapshot", "ec2:CreateSnapshotExportTask", "ec2:CreateSubnet", "ec2:CreateTags", "ec2:CreateVolume", "ec2:CreateVpc", "ec2:CreateVpcEndpoint", "ec2:CreateVpcPeeringConnection", "ec2:CreateVpnConnection", "ec2:CreateVpnConnectionRoute", "ec2:CreateVpnGateway", "ec2:DeleteCustomerGateway", "ec2:DeleteDhcpOptions", "ec2:DeleteInternetGateway", "ec2:DeleteKeyPair", "ec2:DeleteNatGateway", "ec2:DeleteNetworkInterface", "ec2:DeleteRoute", "ec2:DeleteRouteTable", "ec2:DeleteSecurityGroup", "ec2:DeleteSnapshot", "ec2:DeleteSubnet", "ec2:DeleteTags", "ec2:DeleteVolume", "ec2:DeleteVpc", "ec2:DeleteVpcEndpoints", "ec2:DeleteVpcPeeringConnection", "ec2:DeleteVpnConnection", "ec2:DeleteVpnConnectionRoute", "ec2:DeleteVpnGateway", "ec2:DeregisterImage", "ec2:DescribeAddresses", "ec2:DescribeAvailabilityZones", "ec2:DescribeCustomerGateways", "ec2:DescribeDhcpOptions", "ec2:DescribeImageAttribute", "ec2:DescribeImageExportTasks", "ec2:DescribeImages", "ec2:DescribeInstanceAttribute", "ec2:DescribeInstanceStatus", "ec2:DescribeInstanceTypes", "ec2:DescribeInstances", "ec2:DescribeInternetGateways", "ec2:DescribeKeyPairs", "ec2:DescribeNatGateways", "ec2:DescribeNetworkInterfaces", "ec2:DescribePrefixLists", "ec2:DescribeProductTypes", "ec2:DescribeQuotas", "ec2:DescribeRegions", "ec2:DescribeRouteTables", "ec2:DescribeSecurityGroups", "ec2:DescribeSnapshotAttribute", "ec2:DescribeSnapshotExportTasks", "ec2:DescribeSnapshots", "ec2:DescribeSubnets", "ec2:DescribeTags", "ec2:DescribeVolumes", "ec2:DescribeVpcAttribute", "ec2:DescribeVpcEndpointServices", "ec2:DescribeVpcEndpoints", "ec2:DescribeVpcPeeringConnections", "ec2:DescribeVpcs", "ec2:DescribeVpnConnections", "ec2:DescribeVpnGateways", "ec2:DetachInternetGateway", "ec2:DetachNetworkInterface", "ec2:DetachVolume", "ec2:DetachVpnGateway", "ec2:DisableVgwRoutePropagation", "ec2:DisassociateAddress", "ec2:DisassociateRouteTable", "ec2:EnableVgwRoutePropagation", "ec2:GetConsoleOutput", "ec2:GetPasswordData", "ec2:GetProductType", "ec2:GetProductTypes", "ec2:ImportKeyPair", "ec2:ImportSnapshot", "ec2:ModifyImageAttribute", "ec2:ModifyInstanceAttribute", "ec2:ModifyInstanceKeypair", "ec2:ModifyNetworkInterfaceAttribute", "ec2:ModifySnapshotAttribute", "ec2:ModifySubnetAttribute", "ec2:ModifyVpcEndpoint", "ec2:ReadPublicIpRanges", "ec2:RebootInstances", "ec2:RegisterImage", "ec2:RejectVpcPeeringConnection", "ec2:ReleaseAddress", "ec2:ReplaceRoute", "ec2:ReplaceRouteTableAssociation", "ec2:RevokeSecurityGroupEgress", "ec2:RevokeSecurityGroupIngress", "ec2:RunInstances", "ec2:StartInstances", "ec2:StopInstances", "ec2:TerminateInstances", "ec2:UnassignPrivateIpAddresses"]
    const lbuActions = ["elasticloadbalancing:*", "elasticloadbalancing:Describe*", "elasticloadbalancing:AddTags", "elasticloadbalancing:ConfigureHealthCheck", "elasticloadbalancing:CreateAppCookieStickinessPolicy", "elasticloadbalancing:CreateLBCookieStickinessPolicy", "elasticloadbalancing:CreateLoadBalancer", "elasticloadbalancing:CreateLoadBalancerListeners", "elasticloadbalancing:CreateLoadBalancerPolicy", "elasticloadbalancing:DeleteLoadBalancer", "elasticloadbalancing:DeleteLoadBalancerListeners", "elasticloadbalancing:DeleteLoadBalancerPolicy", "elasticloadbalancing:DeregisterInstancesFromLoadBalancer", "elasticloadbalancing:DescribeInstanceHealth", "elasticloadbalancing:DescribeLoadBalancerAttributes", "elasticloadbalancing:DescribeLoadBalancers", "elasticloadbalancing:DescribeTags", "elasticloadbalancing:ModifyLoadBalancerAttributes", "elasticloadbalancing:RegisterInstancesWithLoadBalancer", "elasticloadbalancing:RemoveTags", "elasticloadbalancing:SetLoadBalancerListenerSSLCertificate", "elasticloadbalancing:SetLoadBalancerPoliciesForBackendServer", "elasticloadbalancing:SetLoadBalancerPoliciesOfListener"]
    const eimActions = ["iam:*", "iam:Describe*", "iam:AddUserToGroup", "iam:AttachGroupPolicy", "iam:AttachUserPolicy", "iam:CreateAccessKey", "iam:CreateGroup", "iam:CreatePolicy", "iam:CreatePolicyVersion", "iam:CreateUser", "iam:DeleteAccessKey", "iam:DeleteGroup", "iam:DeleteGroupPolicy", "iam:DeletePolicy", "iam:DeletePolicyVersion", "iam:DeleteServerCertificate", "iam:DeleteUser", "iam:DeleteUserPolicy", "iam:DetachGroupPolicy", "iam:DetachUserPolicy", "iam:GetGroup", "iam:GetGroupPolicy", "iam:GetPolicy", "iam:GetPolicyVersion", "iam:GetServerCertificate", "iam:GetUser", "iam:GetUserPolicy", "iam:ListAccessKeys", "iam:ListAttachedGroupPolicies", "iam:ListAttachedUserPolicies", "iam:ListGroupPolicies", "iam:ListGroups", "iam:ListGroupsForUser", "iam:ListPolicies", "iam:ListPolicyVersions", "iam:ListServerCertificates", "iam:ListUserPolicies", "iam:ListUsers", "iam:PutGroupPolicy", "iam:PutUserPolicy", "iam:RemoveUserFromGroup", "iam:SetDefaultPolicyVersion", "iam:UpdateAccessKey", "iam:UpdateGroup", "iam:UpdateServerCertificate", "iam:UpdateUser", "iam:UploadServerCertificate"]
    const directlinkActions = ["directconnect:*", "directconnect:Describe*", "directconnect:AllocatePrivateVirtualInterface", "directconnect:ConfirmPrivateVirtualInterface", "directconnect:CreateConnection", "directconnect:CreatePrivateVirtualInterface", "directconnect:DeleteConnection", "directconnect:DeleteVirtualInterface", "directconnect:DescribeConnections", "directconnect:DescribeLocations", "directconnect:DescribeVirtualGateways", "directconnect:DescribeVirtualInterfaces"]
    const text = {
        "api": {"en": "OUTSCALE API", "fr": "API OUTSCALE"},
        "allowDeny": {"en": "Allow or deny:", "fr": "Autoriser ou interdire :"},
        "allow": {"en": "Allow", "fr": "Autoriser"},
        "deny": {"en": "Deny", "fr": "Interdire"},
        "what": {"en": "What:", "fr": "Quoi :"},
        "actions": {"en": "The following actions", "fr": "Les actions suivantes"},
        "notActions": {"en": "All except the following actions", "fr": "Tout sauf les actions suivantes"},
        "statement": {"en": "Statement", "fr": "Déclaration"},
        "allActions": {"en": "All actions in this API", "fr": "Toutes les actions de cette API"},
        "allReadActions": {"en": "All Read actions in this API", "fr": "Toutes les actions Read de cette API"},
        "allDescribeActions": {"en": "All Describe actions in this API", "fr": "Toutes les actions Describe de cette API"},
        "addAnotherStatement": {"en": "Add another statement", "fr": "Ajouter une déclaration"},
        "removeLastStatement": {"en": "Remove statement", "fr": "Supprimer la déclaration"},
        "generateJson": {"en": "Generate policy", "fr": "Générer la politique"},
        "labelJson": {"en": "JSON:", "fr": "JSON :"},
        "labelJsonString": {"en": "JSON string (for use with OSC CLI):", "fr": "JSON dans une chaîne de texte (pour utilisation avec OSC CLI) :"},
        "errorNeedOneAction": {"en": "Error: You must select at least one action in statement #", "fr": "Erreur : Vous devez sélectionner au moins une action dans la déclaration #"},
        "disclaimer": {"en": "Note: Make sure you verify that this policy correctly fits your needs before you apply it.", "fr": "Note : Vérifiez bien que cette politique remplit correctement vos besoins avant de l'appliquer."},
    }
    const lang = document.querySelector("html")["lang"]
    const actions = [
        [oapiActions, text.api[lang]],
        [fcuActions, "FCU (AWS EC2)"],
        [lbuActions, "LBU (AWS ELB)"],
        [eimActions, "EIM (AWS IAM)"],
        [directlinkActions, "DirectLink (AWS Direct Connect)"],
    ]

    function createStatement () {
        const num = document.querySelectorAll("#eim-policy-generator > fieldset").length + 1
        const effects = [text.allow[lang], text.deny[lang]]
        const what = [text.actions[lang], text.notActions[lang]]
        const superArray = [
            createFieldSet("effect", effects, "radio", text.allowDeny[lang], false, num),
            createFieldSet("what", what, "radio", text.what[lang], false, num),
            createActionsSuperFieldSet("actions", actions, "checkbox", num),
        ]
        const fieldset = document.createElement("fieldset")
        fieldset.id = "statement-" + num
        const legend = document.createElement("legend")
        legend.textContent = text.statement[lang] + " #" + num
        const divs = document.createElement("div")
        for (let item of superArray) {
            divs.append(item)
        }
        fieldset.append(legend, divs)
        return fieldset
    }
    function createActionsSuperFieldSet (name, superArray, inputType, num) {
        const fieldset = document.createElement("fieldset")
        const divs = document.createElement("div")
        divs.id = name + "-" + num
        for (let array of superArray) {
            const div = createFieldSet(array[1], array[0], inputType, array[1], true, num)
            divs.append(div)
        }
        fieldset.append(divs)
        return fieldset
    }
    function createFieldSet (name, array, inputType, legendText, collapsible=false, num) {
        const fieldset = document.createElement("fieldset")
        const legend = document.createElement("legend")
        legend.textContent = legendText
        const divs = document.createElement("div")
        for (let item of array) {
            const div = createInputDiv(name, item, inputType, num)
            divs.append(div)
        }
        fieldset.append(legend, divs)
        if (collapsible) {
            const button = document.createElement("button")
            button.type = "button"
            button.textContent = legendText
            legend.classList.add("collapsible", "full-width")
            legend.textContent = ""
            legend.append(button)
            divs.id = legendText + "-" + num
            divs.classList.add("collapse")
        }
        return fieldset
    }
    function createInputDiv (name, item, inputType, num) {
        const div = document.createElement("div")
        const input = document.createElement("input")
        input.type = inputType
        input.id = item + "-" + num
        input.name = name + "-" + num
        input.value = item
        if (inputType === "radio" && (item === text.allow[lang] || item === text.actions[lang])) input.checked = true
        div.append(input)
        const label = document.createElement("label")
        label.classList.add("full-width")
        label.htmlFor = input.id
        label.textContent = item
        if (inputType === "checkbox") {
            if (item.endsWith(":*")) {
                label.textContent = text.allActions[lang] + ""
                input.addEventListener("click", selectAllActions)
            }
            else if (item.endsWith("Read*")) {
                label.textContent = text.allReadActions[lang]
                input.addEventListener("click", selectReadActions)
                input.classList.add("spacing-below")
            }
            else if (item.endsWith("Describe*")) {
                label.textContent = text.allDescribeActions[lang]
                input.addEventListener("click", selectDescribeActions)
                input.classList.add("spacing-below")
            }
            else {
                input.addEventListener("click", resetSpecialCheckboxes)
            }
        }
        div.append(label)
        return div
    }
    function selectAllActions () {
        const checkboxes = document.querySelectorAll('[id="' + this.name + '"] [type="checkbox"]')
        const value = this.checked
        for (let checkbox of checkboxes) {
            checkbox.checked = value
        }
    }
    function selectReadActions () {
        const checkboxes = document.querySelectorAll('[id="' + this.name + '"] [type="checkbox"]')
        const value = this.checked
        for (let checkbox of checkboxes) {
            checkbox.checked = false
            if (checkbox.value.includes("Read")) checkbox.checked = value
        }
    }
    function selectDescribeActions () {
        const checkboxes = document.querySelectorAll('[id="' + this.name + '"] [type="checkbox"]')
        const value = this.checked
        for (let checkbox of checkboxes) {
            checkbox.checked = false
            if (checkbox.value.includes("Describe")) checkbox.checked = value
        }
    }
    function resetSpecialCheckboxes () {
        const checkboxes = document.querySelectorAll('[id="' + this.name + '"] [type="checkbox"]')
        for (let checkbox of checkboxes) {
            if (checkbox.value.includes("*")) checkbox.checked = false
        }
    }
    function addStatementButton () {
        const button = document.createElement("button")
        button.type = "button"
        button.id = "add"
        button.textContent = text.addAnotherStatement[lang]
        button.addEventListener("click", addStatement)
        return button
    }
    function removeStatementButton () {
        const num = document.querySelectorAll("#eim-policy-generator > fieldset").length
        const button = document.createElement("button")
        button.type = "button"
        button.id = "remove"
        button.textContent = text.removeLastStatement[lang] + " #" + num
        button.addEventListener("click", removeStatement)
        return button
    }
    function addStatement () {
        const num = document.querySelectorAll("#eim-policy-generator > fieldset").length + 1
        const lastStatement = document.querySelector("#eim-policy-generator > fieldset:last-of-type")
        lastStatement.after(createStatement())
        const removeButton = document.querySelector("#eim-policy-generator #remove")
        if (removeButton) removeButton.remove()
        const addButton = document.querySelector("#eim-policy-generator #add")
        addButton.before(removeStatementButton())
        addButton.blur()
        const generateds = document.querySelectorAll("#eim-policy-generator [id^=generated-], #eim-policy-generator [for^=generated-], #disclaimer")
        for (let generated of generateds) generated.remove()
        const disclaimer = document.querySelector("#eim-policy-generator #disclaimer")
        if (disclaimer) disclaimer.remove()
        initCollapseFunction("statement-" + num)
    }
    function removeStatement () {
        const num = document.querySelectorAll("#eim-policy-generator > fieldset").length
        const lastStatement = document.querySelector("#eim-policy-generator > fieldset:last-of-type")
        lastStatement.remove()
        const removeButton = document.querySelector("#eim-policy-generator #remove")
        if (removeButton) removeButton.remove()
        if (num - 1 > 1) document.querySelector("#eim-policy-generator #add").before(removeStatementButton())
        const generateds = document.querySelectorAll("#eim-policy-generator [id^=generated-], #eim-policy-generator [for^=generated-], #disclaimer")
        for (let generated of generateds) generated.remove()
        const disclaimer = document.querySelector("#eim-policy-generator #disclaimer")
        if (disclaimer) disclaimer.remove()
    }
    function generateButton () {
        const button = document.createElement("button")
        button.type = "button"
        button.id = "generate"
        button.textContent = text.generateJson[lang]
        button.addEventListener("click", generate)
        return button
    }
    function initCollapseFunction (statementNum) {
        const coll = document.querySelectorAll("#" + statementNum + " .collapsible")
        for (let i = 0; i < coll.length; i++) {
            coll[i].addEventListener("click", function() {
                this.classList.toggle("active")
                const content = this.nextElementSibling
                if (content.style.display === "block") content.style.display = "none"
                else content.style.display = "block"
            })
        }
    }
    function generate () {
        const existings = document.querySelectorAll("#eim-policy-generator [id^=generated-], #eim-policy-generator [for^=generated-], #disclaimer")
        for (let existing of existings) existing.remove()
        const result = generateJsonObject()
        const jsonObj = result[0]
        const error = result[1]
        const jsonStr = convertToJsonStr(jsonObj)
        appendTextArea(form, jsonObj, "Json", "2em")
        if (!error) {
            appendTextArea(form, jsonStr, "JsonString", "0em")
            const div = document.createElement("div")
            div.id = "disclaimer"
            div.textContent = text.disclaimer[lang]
            form.append(div)
        }
        document.getElementById("generated-Json").scrollIntoView({ behavior: "smooth", block: "center"})
    }
    function generateJsonObject () {
        const num = document.querySelectorAll("#eim-policy-generator > fieldset").length + 1
        const form = document.forms["eim-policy-generator"]
        const obj = {"Statement": []}
        for (let i = 1; i < num; i++) {
            const selectedActions = []
            for (let n of actions) {
                const selectedCheckboxes = form["statement-" + i].querySelectorAll('[id="' + n[1] + '-' + i + '"] :checked') 
                for (checkbox of selectedCheckboxes) {
                    selectedActions.push(checkbox.value)
                    if (checkbox.value.includes(":*")) break
                    else if (checkbox.value.includes("Read*")) break
                    else if (checkbox.value.includes("Describe*")) break
                }
            }
            let effect = form["effect-" + i].value
            if (effect === text.allow.fr) effect = text.allow.en
            else if (effect === text.deny.fr) effect = text.deny.en
            let what = form["what-" + i].value
            if (what === text.actions.en || what === text.actions.fr) what = "Action"
            else if (what === text.notActions.en || what === text.notActions.fr) what = "NotAction"
            const Statement = {
                "Effect": effect,
                [what]: selectedActions,
                "Resource": ["*"],
            }
            obj.Statement.push(Statement)
            if (selectedActions.length === 0) return [text.errorNeedOneAction[lang] + i, true]
        }
        return [JSON.stringify(obj, null, 2), false]
    }
    function convertToJsonStr (jsonObj) {
        return "'\"" + jsonObj
            .replace(/\n| /g, "")
            .replace(/(":|,)/g, "$1 ")
            .replace(/(\[)(?=\})/g, "$1 ")
            .replace(/(?<=\})(\])/g, " $1")
            .replace(/"/g, '\\"') + "\"'"
    }
    function appendTextArea (form, jsonObj, name, margin) {
        const textarea = document.createElement("textarea")
        const label = document.createElement("label")
        textarea.id = "generated-" + name
        textarea.name = "generated-" + name
        textarea.textContent = jsonObj
        label.htmlFor = "generated-" + name
        label.textContent = text["label" + name][lang]
        form.append(label, textarea)
        textarea.style.height = "calc(" + textarea.scrollHeight + "px + " + margin + ")"
    }

    const form = document.createElement("form")
    form.id = "eim-policy-generator"
    form.append(createStatement(), addStatementButton(), generateButton())
    document.querySelector("#eim-policy-generator-holder").append(form)
    initCollapseFunction("statement-1")
})()
