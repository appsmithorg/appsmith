## Steps to add a custom JS library in Appsmith

1. Install the npm library of your choice in the client codebase
```
$ cd app/client
$ yarn install myLibrary
```
2. In the file `app/client/src/utils/DynamicBindingUtils.ts` find the const `extraLibraries` and add details about your library in the codebase
```
import myLibrary from "myLibrary";

...
...

const extraLibraries = [
	...
	{  
	 accessor: "myLibrary",// The namespace for access
	 lib: myLibrary, // the javascript module from npm
	 version: "3.17.5", // version number of the module
	 docsURL: "https://github.com/NaturalIntelligence/fast-xml-parser",  
	 displayName: "xmlParser", // Display name on the left pane
	},
]
```
3. To make this show up in autocomplete of appsmith we will need to add this to the Tern server file `app/client/src/utils/autocomplete/TernServer.ts`
	- Add a new def file for your library usages [ref](https://ternjs.net/doc/manual.html#typedef) under  `app/client/src/constants/defs/`
	- Import that file in the Tern Server file and add the def in the `DEFS` array right at the top of file
	```
	const DEFS = [..., myLibraryDef];
	```
	
Notes:
- Step 3 is optional but really helpful to get the hints in autocomplete.
- All JS libraries run in a worker thread with a protected context. Make sure they run as expected during testing
