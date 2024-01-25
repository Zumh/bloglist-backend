const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')



// we are creating new blog with this post request
blogsRouter.post('/', async (request, response) => {
  const body = request.body

  if (!body.title || !body.url) {
    return response.status(400).json({ error: 'title and url are required' })
  }


  // find the user by id from the data base
  const user = await User.findById(request.user.id)
  if (!user) {
    return response.status(401).json({ error: 'invalid user' })
  }

  const newBlog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id
  })

  // save the blog seperately
  // add the blog id for reference in user's blogs
  // then save the user
  const savedblog = await newBlog.save()
  await savedblog.populate('user', { username: 1, name: 1, id: 1 })
  user.blogs = user.blogs.concat(savedblog._id)
  await user.save()

  // response with status 201
  response.status(201).json(savedblog)

})

blogsRouter.get('/', async (request, response) => {

  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1, id: 1 })
  response.json(blogs)
})


blogsRouter.get('/:id', async (request, response) => {

  const blog = await Blog.findById(request.params.id)
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
  // we use express-sync-error to handle errors
})


blogsRouter.delete('/:id', async (request, response) => {


  const blog  = await Blog.findById(request.params.id)

  if (!blog) {
    return response.status(404).json({ error: 'blog not found' })
  }

  // check for invalid user id
  if (blog.user.toString() !== request.user.id.toString()) {
    return response.status(401).json({ error: 'invalid user' })
  }

  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: Number(body.likes)
  }

  const updatedblog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.json(updatedblog)
})

module.exports = blogsRouter