
// Tests the wrapper class built around second-order matching, using LCs

// import expect.js
let expect = require( 'expect.js' )

// import all classes defined in this repo
const { Matcher } = require( '../classes/matching.js' )
const { LC, Statement } = require( '../classes/all.js' )

// utility function
// 1. mark as metavars, in pattern, all the metavars listed in the 2nd argument.
// 2. match pattern against expression and get a list of solutions.
// 3. ensure that list is the same as the expectations array, which should
//    contains >=0 objects, each of the form { metavar:instantiation, ... }.
let check = ( pattern, metavars, expression, expectations ) => {
  // if the pattern/expression is a string, parse it to an LC
  if ( !( pattern instanceof LC ) ) pattern = LC.fromString( pattern )
  if ( !( expression instanceof LC ) ) expression = LC.fromString( expression )
  // do the same for every value in the expectations
  expectations.map( expectation => {
    for ( let key in expectation )
      if ( expectation.hasOwnProperty( key ) )
        if ( !( expectation[key] instanceof LC ) )
          expectation[key] = LC.fromString( expectation[key] )
  } )
  // make sure all the metavariables in the pattern are marked as metavariables
  let markMetavars = ( lc ) => {
    if ( lc instanceof Statement && metavars.indexOf( lc.identifier ) > -1 )
      lc.isAMetavariable = true
    lc.children().map( markMetavars )
  }
  markMetavars( pattern )
  // create a matcher
  let M = new Matcher()
  // add the one main constraint we're supposed to test
  M.addConstraint( pattern, expression )
  // run it
  solutions = M.getSolutions()
  // test it
  expect( solutions ).to.be.an( Array )
  expect( solutions ).to.have.length( expectations.length )
  for ( let i = 0 ; i < expectations.length ; i++ ) {
    let solution = solutions[i]
    let expectation = expectations[i]
    expect( solution ).to.have.length( Object.keys( expectation ).length )
    for ( let j = 0 ; j < solution.length ; j++ ) {
      expect( solution[j].pattern ).to.be.a( Statement )
      let p = solution[j].pattern.identifier
      expect( p ).to.be.ok()
      let e = solution[j].expression
      expect( e ).to.be.an( LC )
      expect( expectation.hasOwnProperty( p ) ).to.be( true )
      expect( expectation[p].equals( e ) ).to.be( true )
    }
  }
}

suite( 'Matcher', () => {

  test( 'One solution to plus(A,B) matching plus(x,y) (metavars A,B)', () => {
    check( 'plus(A,B)', [ 'A', 'B' ], 'plus(x,y)', [ { A : 'x', B : 'y' } ] )
  } )

  test( 'No solutions to plus(A,A) matching plus(x,y) (metavar A)', () => {
    check( 'plus(A,A)', [ 'A' ], 'plus(x,y)', [ ] )
  } )

  test( 'One solution to A(B,c,D) matching hi(x,c,D) (metavars A,B,D)', () => {
    check( 'A(B,c,D)', [ 'A', 'B', 'D' ], 'hi(x,c,D)',
           [ { A : 'hi', B : 'x', D : 'D' } ] )
  } )

} )
