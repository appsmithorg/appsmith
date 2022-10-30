# Python Program to Calculate Sum of Even Numbers from 1 to N
 
maximum = int(input(" Please Enter the Maximum Value : "))
total = 0
number = 1
 
while number <= maximum:
    if(number % 2 == 0):
        print("{0}".format(number))
        total = total + number
    number = number + 1

print("The Sum of Even Numbers from 1 to N = {0}".format(total))
