// The following code takes prompt input and generates two files from two different templates
module.exports = function (plop) {
    plop.setGenerator('plugin', {
        prompts: [
            {
                type: 'list',
                name: 'pluginType',
                message: 'Enter the type of plugin you wish to contribute',
                choices: ['SQL', 'NoSQL', 'File Storage', 'SAAS']
            },
            {
                type: 'input',
                name: 'name',
                message: 'Integration Name here: '
            },
            {
                type: 'list',
                name: 'entityName',
                message: 'Enter the name of the entity in the plugin, you want to query',
                choices: ['Table', 'Row', 'Bucket', 'File', 'Collection']
            }
        ],
        actions: function(data) {
            var actions = [];

            if (data.pluginType && data.name && data.entityName) {
                // All the inputs were given. Generate the files 

                /*
                    Plugin Authentication UI File
                    Plugin Authentication File
                    Plugin Entity CRUD File
                    Plugin Entity UI File
                    Plugin Entity Test File
                */
               actions.push(
                {
                    type: 'add',
                    // path: '../../server/appsmith-plugins/{{pascalCase name}}/src/main/java/com.external.plugins/{{pascalCase name}}.java',
                    path: '{{pascalCase name}}/{{pascalCase name}}.java',
                    templateFile: 'plop-templates/controller.hbs'
                }
               );

               actions.push(
                {
                    type: 'add',
                    // path: '../../server/appsmith-plugins/{{pascalCase name}}/src/main/java/com.external.plugins/{{pascalCase name}}.java',
                    path: '{{pascalCase name}}/editor.json',
                    templateFile: 'plop-templates/json-template.hbs'
                }
               );


            }
            return actions;
        }
    });
};

