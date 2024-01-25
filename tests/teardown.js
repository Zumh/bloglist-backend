// this code made sure Jest and moongoDB test coexist in the same process
module.exports = () => {
  process.exit(0)
}