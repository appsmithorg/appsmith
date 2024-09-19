// #region FixtureData
export const firstJSObjectBody = `export default {
	initData :[
  {
    "employeeId": 101,
    "name": "John Doe",
    "department": "Engineering",
    "position": "Software Engineer",
    "location": "San Francisco",
    "salary": 120000
  },
  {
    "employeeId": 102,
    "name": "Jane Smith",
    "department": "Engineering",
    "position": "DevOps Engineer",
    "location": "New York",
    "salary": 115000
  },
  {
    "employeeId": 103,
    "name": "Alice Johnson",
    "department": "Marketing",
    "position": "Marketing Manager",
    "location": "Chicago",
    "salary": 90000
  },
  {
    "employeeId": 104,
    "name": "Robert Brown",
    "department": "Sales",
    "position": "Sales Executive",
    "location": "Los Angeles",
    "salary": 95000
  },
  {
    "employeeId": 105,
    "name": "Linda Davis",
    "department": "HR",
    "position": "HR Manager",
    "location": "San Francisco",
    "salary": 85000
  },
  {
    "employeeId": 106,
    "name": "Michael Wilson",
    "department": "Engineering",
    "position": "Frontend Developer",
    "location": "San Francisco",
    "salary": 105000
  },
  {
    "employeeId": 107,
    "name": "Emily Clark",
    "department": "Marketing",
    "position": "Content Specialist",
    "location": "Chicago",
    "salary": 75000
  },
  {
    "employeeId": 108,
    "name": "David Martinez",
    "department": "Sales",
    "position": "Sales Manager",
    "location": "New York",
    "salary": 110000
  },
  {
    "employeeId": 109,
    "name": "Sarah Lee",
    "department": "HR",
    "position": "Recruiter",
    "location": "Los Angeles",
    "salary": 70000
  },
  {
    "employeeId": 110,
    "name": "James Anderson",
    "department": "Engineering",
    "position": "Backend Developer",
    "location": "New York",
    "salary": 118000
  }
]
}`;

export const secondJSObjectBody = `export default {
	data: JSObject1.initData,
	makeNewCopy() {
		const my = _.cloneDeep(this.data);
		my[5].name =my[5].name+"1";
		this.data = my;
	}
}`;

// #endregion FixtureData
