import * as fs from "fs"

const path = '/opt/newrelic'
const templatePath = `${path}/newrelic-template.yml`
const outputPath = `${path}/newrelic.yml`

function create_new_relic_config_yml_file() {
    if (!process.env.APPSMITH_NEW_RELIC_APM_LICENSE_KEY || !process.env.APPSMITH_NEW_RELIC_APM_NAME) {
        console.log("both license and name present in appsmith apm license key is not set in newrelic reconfigure mjs")
        return
    } else {
        console.log("appsmith apm license key is set in newrelic reconfigure mjs")
    }
    
    const values = {
        $APPSMITH_NEW_RELIC_APM_LICENSE_KEY: process.env.APPSMITH_NEW_RELIC_APM_LICENSE_KEY,
        $APPSMITH_NEW_RELIC_APM_NAME: process.env.APPSMITH_NEW_RELIC_APM_NAME || "Customer Self Hosted Image"
    }

    let data = fs.readFileSync(templatePath, "utf-8")
    
    for (const [key, value] of Object.entries(values)) {
        data = data.replace(key, value)
    }
    
    fs.writeFileSync(outputPath, data)
}

create_new_relic_config_yml_file()