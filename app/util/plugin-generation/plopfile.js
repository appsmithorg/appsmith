
// // The below code works in creating java file.
// module.exports = function (plop) {
//     // controller generator
//     plop.setGenerator('controller', {
//         description: 'application controller logic',
//         prompts: [{
//             type: 'input',
//             name: 'name',
//             message: 'Integration Name here: '
//         }],
//         actions: [{
//             type: 'add',
//             // path: '../../server/appsmith-plugins/{{pascalCase name}}/src/main/java/com.external.plugins/{{pascalCase name}}.java',
//             path: '{{pascalCase name}}/{{pascalCase name}}.java',
//             templateFile: 'plop-templates/controller.hbs'
//         }]
//     });
// };

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

            if(data.wantTacos) {
                actions.push({
                    type: 'add',
                    path: 'folder/{{dashCase name}}.txt',
                    templateFile: 'templates/tacos.txt'
                });
            } else {
                actions.push({
                    type: 'add',
                    path: 'folder/{{dashCase name}}.txt',
                    templateFile: 'templates/burritos.txt'
                });
            }

            return actions;
        }
    });
};

