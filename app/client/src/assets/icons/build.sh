#!/bin/bash
# assumes yarn is installed globally

yarn global add icon-fonts-generator;
cd "$(dirname "$0")"
mkdir fonts;
for d in */;
do
	mkdir fonts/${d%/};
	icon-font-generator ${d}*.svg -o fonts/${d%/} -n "${d%/}-icons";
done;

# using relative path for now
mv fonts ../../../public/
