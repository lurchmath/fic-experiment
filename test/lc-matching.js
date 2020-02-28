
// Tests the wrapper class built around second-order matching, using LCs

// import expect.js
let expect = require( 'expect.js' )

// import all classes defined in this repo
const { MatchingProblem } = require( '../classes/matching.js' )
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

  // create a matching problem
  let M = new MatchingProblem()

  // add the one main constraint we're supposed to test
  M.addConstraint( pattern, expression )

  // run it
  solutions = M.getSolutions()

  //// If you need to debug the solutions, uncomment these:
  // for ( let i = 0 ; i < solutions.length ; i++ ) {
  //   for ( let j = 0 ; j < solutions[i].length ; j++ ) {
  //     console.log( `${i}.${j}. ${solutions[i][j].pattern} `
  //                + `= ${solutions[i][j].expression}` )
  //   }
  // }

  // test it
  expect( solutions ).to.be.an( Array )
  expect( solutions ).to.have.length( expectations.length )
  for ( let i = 0 ; i < expectations.length ; i++ ) {
    let solution = solutions[i]
    let expectation = expectations[i]
    expect( solution.keys() ).to.have.length(
      Object.keys( expectation ).length )
    for ( let key in expectation ) {
      if ( expectation.hasOwnProperty( key ) ) {
        expect( expectation[key] ).to.be.a( Statement )
        expect( solution.has( key ) ).to.be( true )
        let e = solution.lookup( key )
        expect( e ).to.be.a( Statement )
        expect( expectation[key].equals( e ) ).to.be( true )
      }
    }
  }
}

suite( 'MatchingProblem', () => {

  test( '1 solution to plus(A,B) matching plus(x,y)', () => {
    check( 'plus(A,B)', [ 'A', 'B' ], 'plus(x,y)', [ { A : 'x', B : 'y' } ] )
  } )

  test( '0 solutions to plus(A,A) matching plus(x,y)', () => {
    check( 'plus(A,A)', [ 'A' ], 'plus(x,y)', [ ] )
  } )

  test( '1 solution to A(B,c,D) matching hi(x,c,D)', () => {
    check( 'A(B,c,D)', [ 'A', 'B', 'D' ], 'hi(x,c,D)',
           [ { A : 'hi', B : 'x', D : 'D' } ] )
  } )

  test( '1 solution to a(P(x),P(y)) matching a(f(x,x),f(y,y))', () => {
    check( 'a(SUB(P,x),SUB(P,y))', [ 'P' ], 'a(f(x,x),f(y,y))',
           [ { P : '~gEF(v0,f(v0,v0))' } ] )
  } )

  test( '2 solutions to a(P(X),P(Y)) matching a(f(x,x),f(x,y))', () => {
    check( 'a(SUB(P,X),SUB(P,Y))', [ 'P', 'X', 'Y' ], 'a(f(x,x),f(x,y))', [
      {
        P : '~gEF(v0,v0)', X : 'f(x,x)', Y : 'f(x,y)'
      },
      {
        P : '~gEF(v0,f(x,v0))', X : 'x', Y : 'y'
      }
    ] )
  } )

} )
