#!/bin/bash
# assumes yarn is installed globally

cd "$(dirname "$0")"
mkdir fonts;
find ./ -maxdepth 1 -mindepth 1 -type d \! -name fonts | sed -e "s/^\.\/\///g" | while read d;
do
	mkdir fonts/${d};
	npx icon-font-generator ${d}/*.svg -o fonts/${d} -n "${d}-icons";
done;

# using relative path for now
cp -rf fonts ../../../public/
rm -r fonts
