//////////////////////////////////////////////////////////////////
//
//  lurdir.js - Node script for running tests
//
//  Syntax: node lurdir.js
//
//    It loops through all .lur files in the subfolder
//    ./lur/ of the current directory and validates all of the .lur
//   files and prints the result to the console. This is easier
//   for editing large libraries of rules and theorems by placing
//   them in .lur files, which should only contain an LC in our
//   stanadard notation (line breaks are allowed).
//
//////////////////////////////////////////////////////////////////
const fs = require( 'fs' )
// import relevant classes and the deduction routine
const {
  OM, LC, Statement, Environment, containsMetavariables, compareLCs,
  applyInstantiation, canonicalPremises, derivationMatches,
  allDerivationMatches, existsDerivation, firstDerivation
} = require( '../classes/all.js' )
const { MatchingProblem } = require( '../classes/matching.js' )

const root = './lur/'

const withProof = ( process.argv[2] ) ? true : false

function validateFile ( filename ) {
    let file = String( fs.readFileSync( root+filename ) )
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

let files = fs.readdirSync( root ).filter( x => x.slice(-4) === '.lur' )

files.forEach( ( filename ) => validateFile( filename ) )
