while True:
    try:
        num = float(input("Enter a number: "))
        break
    except ValueError:
        [print("Invalid input. Please enter a number.") for _ in range(3)]

print("You entered:", num)
