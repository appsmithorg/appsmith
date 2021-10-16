/*  C++ Program to Find Roots of Quadratic Equation using if else  */

#include <iostream>
#include <cmath>
using namespace std;

int main()
{

    float a, b, c, x1, x2, determinant, realPart, imaginaryPart;
    cout << "Enter coefficient a :: ";
    cin >> a ;
    cout << "\nEnter coefficient b :: ";
    cin >> b ;
    cout << "\nEnter coefficient c :: ";
    cin >> c ;

    determinant = b*b - 4*a*c;

    if (determinant > 0)
    {
        x1 = (-b + sqrt(determinant)) / (2*a);
        x2 = (-b - sqrt(determinant)) / (2*a);
        cout << "\nRoots are real and different." << endl;
        cout << "\nx1 = " << x1 << endl;
        cout << "\nx2 = " << x2 << endl;
    }

    else if (determinant == 0)
    {
        cout << "\nRoots are real and same." << endl;
        x1 = (-b + sqrt(determinant)) / (2*a);
        cout << "\nx1 = x2 = " << x1 << endl;
    }

    else
    {
        realPart = -b/(2*a);
        imaginaryPart =sqrt(-determinant)/(2*a);
        cout << "\nRoots are complex and different."  << endl;
        cout << "\nx1 = " << realPart << "+" << imaginaryPart << "i" << endl;
        cout << "\nx2 = " << realPart << "-" << imaginaryPart << "i" << endl;
    }

    return 0;
}
