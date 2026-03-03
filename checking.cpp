/*  C++ Program to Check Whether a character is Vowel or Consonant  */

#include <iostream>
using namespace std;

int main()
{
    char c;
    int isLowercaseVowel, isUppercaseVowel;

    cout << "Enter any character to check :: ";
    cin >> c;

    // evaluates to 1 (true) if c is a lowercase vowel
    isLowercaseVowel = (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u');

    // evaluates to 1 (true) if c is an uppercase vowel
    isUppercaseVowel = (c == 'A' || c == 'E' || c == 'I' || c == 'O' || c == 'U');

    // evaluates to 1 (true) if either isLowercaseVowel or isUppercaseVowel is true
    if (isLowercaseVowel || isUppercaseVowel)
    {
         cout<<"\nThe Entered Character [ "<<c<<" ] is a Vowel.\n";
    }
    else
    {
         cout<<"\nThe Entered Character [ "<<c<<" ] is a Consonant.\n";
    }


    return 0;
}
