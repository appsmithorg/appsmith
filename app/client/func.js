a = () => {
  console.log("hello!")
  return 1 + 2
}

console.log(a.toString())
console.log(JSON.stringify({ a : a}))
