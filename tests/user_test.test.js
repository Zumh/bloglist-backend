const bcrypt = require('bcrypt')
const User = require('../models/user')

const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

mongoose.set('bufferTimeoutMS', 30000)

describe('when there is initially one user in db', () => {

  // we add one user and password intialization in database
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', name: 'student', passwordHash })

    await user.save()
  })

  // we going to add a new user
  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'Edsger',
      name: 'Edsger W. Dijkstra',
      password: 'johndoe',

    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })


  // test for username that already exist is not allow to add in db
  test('creation fials with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: '123',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toBe('expected `username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    // we expect no user added in database
    expect(usersAtEnd).toEqual(usersAtStart)

  })



})



afterAll(async () => {
  await mongoose.connection.close()
})

