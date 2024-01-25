const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

// we set Blog here for intialization of a fake data before we use it
const Blog = require('../models/blog')
const User = require('../models/user')

// we set a timer for the tests to run for 30 seconds
mongoose.set('bufferTimeoutMS', 30000)

// Function to login user
async function loginUser() {
  const response = await api.post('/api/login').send({
    username: 'Edsger',
    password: 'johndoe'
  })
  return response
}

let token = null
// Create a new user Before each test
beforeEach(async () => {
  // delete users
  await User.deleteMany({})
  // create a new user
  const user = new User({
    username: 'Edsger',
    name: 'Edsger W. Dijkstra',
    blogs: [],
    passwordHash: await bcrypt.hash('johndoe', 10)
  })

  // save the user
  await user.save()

}, 120000)

// login Befor each and extract the token
// beforeEach(async () => {
//   const response = await loginUser()
//   token = response.body.token
// }, 120000)


// Befor each is executed before each test
beforeEach(async () => {
  const user = await User.find({})

  await Blog.deleteMany({})

  // we can initialize with many blogs
  // each blog is an object and we have to create fresh mongoose objects
  const blogObjects = helper.initialBlogs
    .map(blog => new Blog({
      user: user[0]._id,
      likes: user[0].likes?user[0].likes:0,
      ...blog }))

  // after saving each blog, we add it to the promise array
  const promiseArray = blogObjects.map(blog => {

    blog.save()
    user[0].blogs = user[0].blogs.concat(blog._id)
  })




  //  wait for all of the asynchronous operations to finish executing with the Promise.all
  // this solve the problem of the test failing because of the timeout
  // promise all execute in parallel
  // we can use for loop if we want them to execute in order
  await Promise.all(promiseArray)
  // save the user
  await user[0].save()

}, 120000)


/*


Use the supertest package for writing a test that makes an HTTP GET request to the /api/blogs URL.
Verify that the blog list application returns the correct amount of blog posts in the JSON format.
*/
describe('Blogs view', () => {

  test('Blogs are returned as json', async () => {
    const userLogin = await loginUser()
    // Verify using supertest
    await api
      .get('/api/blogs')
      .set('authorization', `bearer ${userLogin.body.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)


  }, 120000)

  // Verifies unique identifier property
  test('Verifies that the unique identifier property of the blog posts is named id', async() => {

    const blogsAtStart = await helper.blogsInDb()

    const blogToView = blogsAtStart[0]
    expect(blogToView.id).toBeDefined()

  })

})

describe('Blogs adding', () => {
// Add a new blog
  test('Verifies HTTP POST request adding a new blog', async () => {
    const newBlog = {
      'title': 'Async/await simplifies making async calls',
      'author': 'John doe',
      'url': 'http://example.com/js-async-essentials',
      'likes': 300
    }
    const userLogin = await loginUser()

    // add the blog to the database
    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('authorization', `bearer ${userLogin.body.token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()


    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    // retrieve the only the title of the blog
    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).toContainEqual('Async/await simplifies making async calls')
  })

  //Write a test that verifies that if the likes property is missing from the request,
  // it will default to the value 0. Do not test the other properties of the created blogs yet.

  test('Likes property defaults to 0 if no likes is define in object', async () => {
    const newBlog = {
      'title': 'likes property defaults to 0',
      'author': 'likes is 0',
      'url': 'http://example.com/Exercise 4.11'
    }
    const userLogin = await loginUser()
    // add the blog to the database
    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('authorization', `bearer ${userLogin.body.token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd[blogsAtEnd.length - 1].likes).toBe(0)

  })

  // Bad request if url and title are missing
  test('Verifies HTTP POST code 400 Bad Request for missing url and title', async () => {
    const newBlog = {
      'author': 'Missing title or url property',
      'likes': 900
    }
    const userLogin = await loginUser()
    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('authorization', `bearer ${userLogin.body.token}`)
      .expect(400)

    // making sure the blog is not in the database
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  // write a new test to ensure adding a blog fails with the proper status code 401 Unauthorized if a token is not provided.
  test('Verifies HTTP POST code 401 Unauthorized if no token provided', async () => {
    const newBlog = {
      'title': 'Unauthorized',
      'author': 'Unauthorized',
      'url': 'http://example.com/Unauthorized'
    }
    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('authorization', 'bearer ')
      .expect(401)
  })
})



describe('Blogs delete', () => {

  // Delete a single blog
  test('Functionality for deleting a single blog post resource', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]
    const userLogin = await loginUser()

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('authorization', `bearer ${userLogin.body.token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(
      helper.initialBlogs.length - 1
    )

    // get all the titles from the database
    const titles = blogsAtEnd.map(blogs => blogs.title)
    // check if blogToDelete title is not contain in current titles after delete
    expect(titles).not.toContain(blogToDelete.title)
  })

})


describe('Update blog', () => {
  test('Update the number of likes for a blog post', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]
    const updatedLikes = 450

    const userLogin = await loginUser()

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send({ likes: updatedLikes })
      .set('authorization', `bearer ${userLogin.body.token}`)
      .expect(200)
    // verify reponsed like is updated
    expect(response.body.likes).toBe(updatedLikes)

    const blogsAtEnd = await helper.blogsInDb()
    const updatedBlog = blogsAtEnd.find(blog => blog.id === blogToUpdate.id)
    // verify if data from database is updated
    expect(updatedBlog.likes).toBe(updatedLikes)
  })

})



afterAll(async () => {
  await mongoose.connection.close()
})