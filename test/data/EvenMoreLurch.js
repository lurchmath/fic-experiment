//
//  EvenMoreLurch.js - loads a giant string that contains a good chunk of the
//  Lurch desktop libraries followed by a few proofs for testing purposes.
//  We store it in a separate file since it's 600 lines long, and then just
//  import it as needed.  This contains formulas for testing SAT + Matching

const fs = require('fs')

// we keep it in a separate text file for syntax highlighting purposes
const EvenMoreLurchstr = fs.readFileSync(__dirname+'/EvenMoreLurchTxt.js', 'utf8')

module.exports.EvenMoreLurchstr = EvenMoreLurchstr
