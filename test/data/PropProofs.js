//
//  PropProofs.js - loads a giant string that a few proofs for testing purposes.
//  We store it in a separate file since it's 300 lines long, and then just
//  import it as needed.

const fs = require('fs')

// we keep it in a separate text file for syntax highlighting purposes
const Proofstr = fs.readFileSync(__dirname+'/PropProofsTxt.js', 'utf8')

module.exports.Proofstr = Proofstr
