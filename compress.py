file_name = 'image-1-compressed.jpg'
picture = Image.open('image-1.jpg')
dim = picture.size
print(f"This is the current width and height of the image: {dim}")
This is the current width and height of the image: (1920, 1280)
picture.save("Compressed_"+file_name,optimize=True,quality=30) 
