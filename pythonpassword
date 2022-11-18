# Python program to check validation of password
# Module of regular expression is used with search()
import re
password = "
R@m@_f0rtu9e$& quot
flag = 0
while True:
	if (len(password) & lt
			8):
		flag = -1
		break
	elif not re.search(& quot
						[a-z]"					 , password):
		flag = -1
		break
	elif not re.search(& quot
						[A-Z]"					 , password):
		flag = -1
		break
	elif not re.search(& quot
						[0-9]"					 , password):
		flag = -1
		break
	elif not re.search(& quot
						[_@$]"					 , password):
		flag = -1
		break
	elif re.search(& quot
					\s"				 , password):
		flag = -1
		break
	else:
		flag = 0
		print(& quot
			Valid Password & quot
			)
		break

if flag == -1:
	print(& quot
		Not a Valid Password & quot
		)
