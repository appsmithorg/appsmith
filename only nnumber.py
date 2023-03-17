try:
    user_input = int(input('Enter an integer: '))
    print(user_input)
except ValueError:
    print('Enter a valid integer')
