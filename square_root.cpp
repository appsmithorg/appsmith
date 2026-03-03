/*  C++ Program to find Square  Root of a number using sqrt() function */

#include<iostream>
#include<math.h>

using namespace std;

int main()
{
    float sq,n;

    cout<<"Enter any positive number :: ";
    cin>>n;

    sq=sqrt(n);

    cout<<"\nSquare  root of Entered Number [ "<<n<<" ] is :: "<<sq<<"\n";

    return 0;
}
