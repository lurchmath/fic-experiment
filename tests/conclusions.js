
const { OM } = require( '../dependencies/openmath.js' )
const { LC, Statement, Environment } = require( '../classes/lc.js' )

var A, B, C, outer

// How to print conclusion lists
function printcons ( lc ) {
  return lc.conclusions().map( x => x.toString() ).join( ', ' )
}
// Quick way to make identifiers
function ident ( name, given = false ) {
  let result = new Statement()
  result.identifier = name
  result.isAGiven = given
  return result
}

// In { A B }, both are conclusions.
outer = new Environment( A = ident( 'A' ), B = ident( 'B' ) )
console.log( 'Conclusions of '+outer+' are', printcons( outer ) )
console.log( '\tDoes A think it is a concl?', A.isAConclusionIn( outer ) )
console.log( '\tDoes B think it is a concl?', B.isAConclusionIn( outer ) )

// In :{ A B }, both are conclusions.
outer = new Environment( ident( 'A' ), ident( 'B' ) )
outer.isAGiven = true
console.log( 'Conclusions of '+outer+' are', printcons( outer ) )

// In :{ :A B }, only B is a conclusion.
outer = new Environment( ident( 'A', true ), ident( 'B' ) )
outer.isAGiven = true
console.log( 'Conclusions of '+outer+' are', printcons( outer ) )

// In :{ A :B }, only A is a conclusion.
outer = new Environment( ident( 'A' ), ident( 'B', true ) )
outer.isAGiven = true
console.log( 'Conclusions of '+outer+' are', printcons( outer ) )

// In :{ :A :B }, there are no conclusions
outer = new Environment( ident( 'A', true ), ident( 'B', true ) )
outer.isAGiven = true
console.log( 'Conclusions of '+outer+' are', printcons( outer ) )

// In { { A } }, there is one conclusion, A
outer = new Environment( new Environment( ident( 'A' ) ) )
console.log( 'Conclusions of '+outer+' are', printcons( outer ) )

// In { :{ A } }, there are no conclusions
B = new Environment( ident( 'A' ) )
B.isAGiven = true
outer = new Environment( B )
console.log( 'Conclusions of '+outer+' are', printcons( outer ) )

// In { { :A } }, there are no conclusions
outer = new Environment( new Environment( ident( 'A', true ) ) )
console.log( 'Conclusions of '+outer+' are', printcons( outer ) )

// In { { :A B } }, the one conclusion is B
outer = new Environment( new Environment( ident( 'A', true ), ident( 'B' ) ) )
console.log( 'Conclusions of '+outer+' are', printcons( outer ) )

// In { { :A B } C }, the conclusions are B, C
outer = new Environment(
  new Environment( ident( 'A', true ), ident( 'B' ) ),
  ident( 'C' )
)
console.log( 'Conclusions of '+outer+' are', printcons( outer ) )
