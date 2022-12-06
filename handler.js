const AWS = require('aws-sdk')
const express = require('express')
const serverless = require('serverless-http')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()

const ADVISOR_TABLE = process.env.ADVISOR_TABLE
const PRODUCT_TABLE = process.env.PRODUCT_TABLE
const JWT_SECRET = process.env.JWT_SECRET

const dynamoDbClient = new AWS.DynamoDB.DocumentClient()

app.use(express.json())

app.post('/signup', signUp)
app.post('/signin', signIn)
app.post('/products', createProduct)
app.get('/products', getProducts)

app.use((_req, res, _next) => {
  return res.status(404).json({
    error: 'Not found'
  })
})

async function signUp (req, res) {
  const { email, password, name } = req.body
  if (typeof email !== 'string') {
    res.status(400).json({ error: '"email" must be a string' })
  } else if (typeof password !== 'string') {
    res.status(400).json({ error: '"password" must be a string' })
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' })
  }

  const { Items } = await dynamoDbClient.scan({
    TableName: ADVISOR_TABLE,
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email
    }
  }).promise()

  if (Items.length >= 1) res.status(400).json({ error: 'An advisor with this email is already registered' })

  const advisorId = uuidv4()
  const passwordHash = bcrypt.hashSync(password)

  try {
    await dynamoDbClient.put({
      TableName: ADVISOR_TABLE,
      Item: {
        id: advisorId,
        email,
        password: passwordHash,
        name
      }
    }).promise()

    const token = jwt.sign(
      {
        email,
        id: advisorId
      },
      JWT_SECRET,
      { expiresIn: '24h' }

    )

    res.json({ id: advisorId, token })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Could not create advisor' })
  }
}

async function signIn (req, res) {
  const { email, password } = req.body
  if (typeof email !== 'string') {
    res.status(400).json({ error: '"email" must be a string' })
  } else if (typeof password !== 'string') {
    res.status(400).json({ error: '"password" must be a string' })
  }

  try {
    const { Items } = await dynamoDbClient.scan({
      TableName: ADVISOR_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }).promise()

    const isPasswordCorrect = bcrypt.compareSync(password, Items[0].password)

    if (!isPasswordCorrect) {
      res
        .status(400)
        .json({ message: 'The password you provided is not correct.' })
    }

    const token = jwt.sign(
      {
        email: Items[0].email,
        id: Items[0].id
      },
      JWT_SECRET,
      { expiresIn: '24h' }

    )

    res.json({ id: Items[0].id, token })
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
}

async function createProduct (req, res) {
  let advisorId = ''
  const jwtToken = req.headers.authorization.replace('Bearer ', '')

  jwt.verify(jwtToken, JWT_SECRET, function (error, decoded) {
    if (error) res.status(500).json({ error: 'Failed to authenticate' })

    advisorId = decoded.id
  })

  const { name, description, price } = req.body
  if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' })
  } else if (typeof description !== 'string') {
    res.status(400).json({ error: '"description" must be a string' })
  } else if (typeof price !== 'number') {
    res.status(400).json({ error: '"price" must be a number' })
  }

  const productId = uuidv4()

  try {
    await dynamoDbClient.put({
      TableName: PRODUCT_TABLE,
      Item: {
        id: productId,
        advisorId,
        name,
        description,
        price
      }
    }).promise()
    res.json({ id: productId, advisorId, name, description, price })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Could not create the product' })
  }
}

async function getProducts (req, res) {
  let advisorId = ''
  const jwtToken = req.headers.authorization.replace('Bearer ', '')

  jwt.verify(jwtToken, JWT_SECRET, function (error, decoded) {
    if (error) res.status(500).json({ error: 'Failed to authenticate' })

    advisorId = decoded.id
  })

  try {
    const { Items } = await dynamoDbClient.scan({
      TableName: PRODUCT_TABLE,
      FilterExpression: 'advisorId = :advisorId',
      ExpressionAttributeValues: {
        ':advisorId': advisorId
      }
    }).promise()

    if (Items.length >= 1) {
      res.json(Items)
    } else {
      res
        .status(404)
        .json({ error: "The provided advisor doesn't have any products" })
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to get products for the provided advisor' })
  }
}

module.exports.handler = serverless(app)
