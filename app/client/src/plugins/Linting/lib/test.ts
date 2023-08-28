let x = {};

function y() {
	
}

export function setX(param)  {
	santiseParam(param);
	x = param;
}

export default {
	setX: () => { return "Hii" },
	myVar2: {},
	x,
	myFun1 () {
		//	write code here
		//	this.myVar1 = [1,2,3]
	},
	async myFun2 () {
		//	use async-await or promises
		//	await storeValue('varName', 'hello world')
		debugger;
		const { stripe }  = _esm;
	}
}