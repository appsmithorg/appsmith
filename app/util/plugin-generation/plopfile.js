// The following code takes prompt input and generates all the required files.
module.exports = function (plop) {
    plop.setGenerator('plugin', {
        prompts: [
            // {
            //     type: 'list',
            //     name: 'pluginType',
            //     message: 'Enter the type of plugin you wish to contribute',
            //     choices: ['SQL', 'NoSQL', 'File Storage', 'SAAS']
            // },
            {
                type: 'input',
                name: 'name',
                message: 'Integration Name here: '
            // },
            // {
            //     type: 'list',
            //     name: 'entityName',
            //     message: 'Enter the name of the entity in the plugin, you want to query',
            //     choices: ['Table', 'Row', 'Bucket', 'File', 'Collection']
            },
            {
                type: 'input',
                name: 'email',
                message: 'Please enter your email here: ',
                default: 'tech@appsmith.com'
            }
        ],
        actions: function(data) {
            var actions = [];

            // if (data.pluginType && data.name && data.entityName) {
            if (data.name) {
                
               actions.push(
                {
                    type: 'add',
                    path: '../../server/appsmith-plugins/{{camelCase name}}/src/main/java/com.external.plugins/{{pascalCase name}}.java',
                    templateFile: 'plop-templates/pluginJava.hbs'
                }
               );

               actions.push(
                {
                    type: 'add',
                    path: '../../server/appsmith-plugins/{{camelCase name}}/src/test/java/com.external.plugins/{{pascalCase name}}Test.java',
                    templateFile: 'plop-templates/pluginTest.hbs'
                }
               );

               actions.push(
                {
                    type: 'add',
                    path: '../../server/appsmith-plugins/{{pascalCase name}}/plugin.properties',
                    templateFile: 'plop-templates/plugin-iml.hbs'
                }
               );

               actions.push(
                {
                    type: 'add',
                    path: '../../server/appsmith-plugins/{{pascalCase name}}/pom.xml',
                    templateFile: 'plop-templates/plugin-pom.hbs'
                }
               );

               actions.push(
                {
                    type: 'add',
                    path: '../../server/appsmith-plugins/{{camelCase name}}/src/main/resources/editor.json',
                    templateFile: 'plop-templates/editor-json.hbs'
                }
               );

               actions.push(
                {
                    type: 'add',
                    path: '../../server/appsmith-plugins/{{camelCase name}}/src/main/resources/form.json',
                    templateFile: 'plop-templates/form-json.hbs'
                }
               );

               actions.push(
                {
                    type: 'modify',
                    pattern :/<\/modules>\n<\/project>/,
                    path: '../../server/appsmith-plugins/pom.xml',
                    templateFile: 'plop-templates/super-plugins-pom.hbs'
                }
               );

               actions.push(
                {
                    type: 'modify',
                    pattern :/}[\n]*$/,
                    path: '../../server/appsmith-server/src/main/java/com/appsmith/server/migrations/DatabaseChangelog.java',
                    templateFile: 'plop-templates/database-changelog.hbs'
                }
               );

            }

            return actions;
        }
    });
};

