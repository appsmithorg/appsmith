a = {
  key1 : 'value1',
  'key2' : 'value2',
  2 : 3,
  myFunc : function() {
    console.log("this is my func");
    console.log(this.key1);
    console.log('after printing key1');
  }
}

// console.log(a);
// console.log(a.key1);
// console.log(a.key2);
// console.log(a['key1']);
// console.log(a['2'])
// a['myFunc']();


b = a;



let person = {
    firstName: 'John',
    lastName: 'Doe',
    address: {
        street: 'North 1st street',
        city: 'San Jose',
        state: 'CA',
        country: 'USA'
    }
};


let copiedPerson = Object.assign({}, person);
copiedPerson.firstName = "Rajat"
copiedPerson.address.city = "Noida"

console.log(`person is ${person}`)
console.log(person);

console.log(copiedPerson)


let rajat = {
'agrawal' : 'agrawal'
}
console.log("rajat before assignment")
console.log(rajat);
rajat['rajat'] = 'agrawal'
// rajat = {'key1': 'value1'}
console.log(rajat);



apple = {
  'branch' : 'root'
}
keyof apple
