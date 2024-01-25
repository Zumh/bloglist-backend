const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs', { title: 1, author: 1, url: 1 })
  response.json(users)
})

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body


  // without using Mongoose validations mongoose-unique-validator
  // check that the username is long enough, that the username only consists of permitted characters, or that the password is strong enough. The username must be unique.
  if (username.length < 3 || username.match(/[^a-zA-Z0-9]/) || password.length < 3) {
    return response.status(400).json({
      error: 'username or password too short'
    })
  }

  // check that the username is unique in the database using Mongoose
  if (await User.findOne({ username })) {
    return response.status(400).json({
      error: 'expected `username` to be unique'
    })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)


})

module.exports = usersRouter