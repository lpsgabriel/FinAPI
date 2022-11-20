const { response } = require("express")
const express = require("express")
const { stat } = require("fs")
const { request } = require("http")
const { v4: uuidv4 } = require("uuid")

const app = express()
app.listen("3333", () => console.log("Server running at port 3333"))
app.use(express.json())

const customers = [
	{
		"cpf": "98",
		"name": "kuririm",
		"id": "c60cfadf-661a-4354-aeab-196baefc1184",
		"statement": []
	},
	{
		"cpf": "1",
		"name": "pedrim",
		"id": "7a2a3dcf-7adc-48c6-accb-63b157211e97",
		"statement": []
	},
	{
		"cpf": "2",
		"name": "chupa cu",
		"id": "0f0080ad-2d98-4f8e-8a73-6e9f7d239c9b",
		"statement": []
	},
	{
		"cpf": "3",
		"name": "raffy",
		"id": "6f86c807-ee8f-47c6-845b-987ebd09f064",
		"statement": []
	},
	{
		"cpf": "99",
		"name": "eu",
		"id": "5308b46c-8ce4-41be-aaf1-8939dfabd044",
		"statement": []
	}
]

//middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers

  const customer = customers.find((customer) => customer.cpf === cpf)

  if (!customer) {
    return response.status(400).json({ error: "Customer not found" })
  }

  request.customer = customer

  return next()
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0)
  return balance
}

//app.use(verifyIfExistsAccountCPF) //DAQUI PARA BAIXO SEMPRE PASSARA PELO MIDDLEWARE

/*
criando conta
cpf - string
nome - string
id - uuid universaly unic identifier
statement[]
*/
app.post("/account", (request, response) => {
  const { cpf, name } = request.body

  const customersAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  )

  if (customersAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists!" })
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  })

  return response.status(201).send()
})

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  return response.json(customer.statement)
})

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body
  const { customer } = request

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  }
  customer.statement.push(statementOperation)

  return response.status(201).send()
})

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body
  const { customer } = request

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    response.status(400).json({ error: "Insufficient founds!" })
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  }
  customer.statement.push(statementOperation)
  return response.status(201).send()
})

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { date } = request.query

  const dateFormat = new Date(date + " 00:00")

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  )
  return response.json(statement)
})

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body
  const { customer } = request

  customer.name = name
  return response.status(201).send()
})

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  return response.json(customer)
})

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { cpf } = request.headers
  console.log(cpf)

  const idx = customers.findIndex((item) => item.cpf === cpf)

  //splice
  //   customers.splice(idx, 1)
  //   console.log(customer)
  customers.splice(idx, 1)

  return response.status(200).json(customers)
})

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  const balance = getBalance(customer.statement)

  return response.json(balance)
})

app.get("/customers", (request, response) => {
  if (customers.length == 0) {
    return response.status(400).json({ error: "There are no customers" })
  }
  return response.status(200).json(customers)
})
