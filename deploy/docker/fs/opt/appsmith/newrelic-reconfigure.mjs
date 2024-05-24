import * as fs from "fs"

const path = '/opt/newrelic'
const templatePath = `${path}/newrelic-template.yml`
const outputPath = `${path}/newrelic.yml`

function create_new_relic_config_yml_file() {
    if (!(process.env.APPSMITH_NEW_RELIC_ENABLED == true)) {
        return
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