# importing ZipFile class from zipfile module
from zipfile import ZipFile

# specifying the zip file_name
file = "file_name.zip"

# opening the zip file in READ mode
with ZipFile(file, 'r') as zip:
    # printing all the contents of a zip file 
    zip.printdir()
