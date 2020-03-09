///////////////////////////////////////////////////////
//
// validate.js - a node script to validate a .lur file
//
// Syntax: node validate.js filename [true]
//
//    Loads filename, validates it, and prints the result.  The file
//    should be a .lur file containing a single LC in our string format.
//    (line breaks in the .lur file are allowed).  If the optional third
//    argument is true, it will print the proof of valid conclusions.
//
// load the fs module
const fs = require( 'fs' )
// import relevant classes and the deduction routine
const {
  OM, LC, Statement, Environment, containsMetavariables, compareLCs,
  applyInstantiation, canonicalPremises, derivationMatches,
  allDerivationMatches, existsDerivation, firstDerivation
} = require( '../classes/all.js' )
const { MatchingProblem } = require( '../classes/matching.js' )

const filename = process.argv[2]
const withProof = ( process.argv[3] ) ? true : false

function validateFile ( filename ) {
    let file = String( fs.readFileSync( filename ) )
    let lc = LC.fromString( file )
    lc.validate( withProof )
    let result = lc.toString( { FIC: true , Scopes: true , Bound: true ,
    Indent: true , tabsize: 2 } )
    console.log("Filename: "+filename+"\n"+result)
    let concs = lc.conclusions()
    concs.forEach( ( X ) => {
       if ( withProof && X.getAttribute('validation').status ) {
          console.log( '\n'+X.getAttribute('validation').proof )
       }
    } )
}

validateFile(filename)
