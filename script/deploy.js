import ghpages from 'gh-pages'
import fs from 'fs-extra'

function genDest () {
  try {
    fs.copySync('vue2/dist', 'dist/v2')
  } catch (err) {
    console.error(err)
  }
}

genDest()
console.log('ghpages.publish...')
ghpages.publish('dist', {
  message: 'auto publish'
}, function (err) { 
  console.error(err)
})