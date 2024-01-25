const jwt = require('jsonwebtoken')
const logger = require('./logger')


// get the token from header
const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')
  request.token = null
  if (authorization && authorization.toLowerCase().startsWith('bearer ')){
    request.token = authorization.replace('bearer ', '')

  }

  next()
}

const userExtractor = (request, response, next) => {

  // we assume that token is extracted first and we can use it to find the user
  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  request.user = null
  // check token for valid user
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  } else {

    request.user = decodedToken

  }
  next()
}


const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name ===  'JsonWebTokenError') {
    return response.status(401).json({ error: error.message })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'token expired'
    })
  }

  next(error)
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler, tokenExtractor, userExtractor
}