// Import Lodash
const _ = require('lodash')


// dummy function always returns one
const dummy = (blogs) => {
  console.log(blogs)
  return 1
}

const totalLikes = (blogs) => {

  const reducer = (sum, { likes }) => {
    return sum + likes
  }

  return blogs.length === 0 ? 0 : blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  // find out witch blog has the most likes
  // if there are too many favorite blog return one of them
  if (blogs.length === 0) {
    return null
  }

  const { title, author, likes } = blogs.filter(blog => blog.likes === Math.max(...blogs.map(blog => blog.likes)))[0]

  const result = { title: title, author: author, likes: likes }
  return result
}

// we use lodash for finding an Author with most blogs
const mostBlogs = (blogs) => {

  if (blogs.length === 0) {
    return null
  }
  // Count occurrences of each name
  const nameCounts = _.countBy(blogs, 'author')

  // Find the name with the maximum count
  const mostFrequentName = _.maxBy(Object.keys(nameCounts), name => nameCounts[name])

  return { author: mostFrequentName, blogs: nameCounts[mostFrequentName] }

}


const mostLikesBlogs = (blogs) => {
  /*
    The function returns the author, whose blog posts have the largest amount of likes.
    The return value also contains the total number of likes that the author has received
    */

  if (blogs.length === 0) {
    return null
  }

  // Group by author
  const groupedByAuthor = _.groupBy(blogs, 'author')

  // Calculate total likes for each author
  const totalLikesByAuthor = _.mapValues(groupedByAuthor, group => _.sumBy(group, 'likes'))

  // Find the author with the most likes
  const mostLikedAuthor = _.maxBy(Object.keys(totalLikesByAuthor), author => totalLikesByAuthor[author])

  // Return the author and the total number of likes
  return { author: mostLikedAuthor, likes: totalLikesByAuthor[mostLikedAuthor] }
}

module.exports = {
  dummy, totalLikes, favoriteBlog, mostBlogs, mostLikesBlogs
}