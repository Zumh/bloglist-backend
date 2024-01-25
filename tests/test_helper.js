const User = require('../models/user')

const Blog = require('../models/blog')

// Blogs initialization
const initialBlogs = [
  {
    'title': 'Web Development Fundamentals',
    'author': 'Emma Johnson',
    'url': 'http://example.com/web-dev-fundamentals'

  },
  {
    'title': 'Data Science Essentials',
    'author': 'Michael Brown',
    'url': 'http://example.com/data-science-essentials',
    'likes': 200
  }
]

const nonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon' })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(note => note.toJSON())
}

// help us to verify after user is created
const usersInDb = async () => {
  const users = await User.find({})
  return users.map(user => user.toJSON())
}
module.exports = {
  initialBlogs, nonExistingId, blogsInDb, usersInDb
}