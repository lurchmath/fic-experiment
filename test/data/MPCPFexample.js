//
//  MPCPFexample.js - loads a giant string that contains a good example

const fs = require('fs')

// we keep it in a separate text file for syntax highlighting purposes
const MPCPFstr = fs.readFileSync(__dirname+'/MPCPFexampleTxt.js', 'utf8')

module.exports.MPCPFstr = MPCPFstr
