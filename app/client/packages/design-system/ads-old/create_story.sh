# usage ./create_story.sh -f <Folder name under src fodler>
while getopts f: flag
do
    case "${flag}" in
        f) folder=${OPTARG};;
    esac
done

echo "Creating story for folder: $folder"
cat story_template.txt >> src/$folder/$folder.stories.tsx
