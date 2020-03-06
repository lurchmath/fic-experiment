
// Tests the wrapper class built around second-order matching, using LCs

// import expect.js
let expect = require( 'expect.js' )

// import all classes defined in this repo
const { MatchingSolution, MatchingProblem } =
  require( '../classes/matching.js' )
const { LC, Statement } = require( '../classes/all.js' )

suite( 'MatchingSolution', () => {

  test( 'can create solutions and query their contents', () => {
    const solution = new MatchingSolution()
    expect( solution.keys() ).to.eql( [ ] )
    expect( solution.has( 'x' ) ).to.be( false )
    expect( solution.lookup( 'x' ) ).to.be( undefined )
    solution.add( 'x', LC.fromString( 'thing(1)' ) )
    expect( solution.keys() ).to.eql( [ 'x' ] )
    expect( solution.has( 'x' ) ).to.be( true )
    expect( solution.lookup( 'x' ) ).to.be.an( LC )
    expect( solution.lookup( 'x' ).equals( LC.fromString( 'thing(1)' ) ) )
      .to.be( true )
    solution.add( 'YO', LC.fromString( 'DUDE' ) )
    expect( solution.keys() ).to.have.length( 2 )
    expect( solution.keys().includes( 'x' ) ).to.be( true )
    expect( solution.keys().includes( 'YO' ) ).to.be( true )
    expect( solution.has( 'x' ) ).to.be( true )
    expect( solution.lookup( 'x' ) ).to.be.an( LC )
    expect( solution.lookup( 'x' ).equals( LC.fromString( 'thing(1)' ) ) )
      .to.be( true )
    expect( solution.has( 'YO' ) ).to.be( true )
    expect( solution.lookup( 'YO' ) ).to.be.an( LC )
    expect( solution.lookup( 'YO' ).equals( LC.fromString( 'DUDE' ) ) )
      .to.be( true )
  } )

  test( 'can correctly compare instances for equality', () => {
    const solution1 = new MatchingSolution()
    const solution2 = new MatchingSolution()
    expect( solution1.equals( solution2 ) ).to.be( true )
    solution1.add( 'x', LC.fromString( 'thing(1)' ) )
    expect( solution1.equals( solution2 ) ).to.be( false )
    solution2.add( 'x', LC.fromString( 'thing(1)' ) )
    expect( solution1.equals( solution2 ) ).to.be( true )
    solution2.add( 'YO', LC.fromString( 'D(U,D,E)' ) )
    expect( solution1.equals( solution2 ) ).to.be( false )
    solution1.add( 'YO', LC.fromString( 'D(U,D(E))' ) )
    expect( solution1.equals( solution2 ) ).to.be( false )
  } )

  test( 'can be applied to instantiate metavariables', () => {
    const solution1 = new MatchingSolution()
    const original = LC.fromString( 'f(x,Y,z,YO)' )
    original.first.isAMetavariable = true
    original.child( 3 ).isAMetavariable = true
    // make a copy of the original into which we will substitute
    const pattern1 = original.copy()
    expect( original.equals( pattern1 ) ).to.be( true )
    // applying an empty solution in place changes nothing
    solution1.apply( pattern1 )
    expect( original.equals( pattern1 ) ).to.be( true )
    // applying a non-empty solution in place changes pattern1 in place
    const solution2 = new MatchingSolution()
    solution2.add( 'x', LC.fromString( 'thing(1)' ) )
    solution2.add( 'YO', LC.fromString( 'DUDE' ) )
    solution2.applyInPlace( pattern1 )
    expect( original.equals( pattern1 ) ).to.be( false )
    // and it does so correctly
    expect( pattern1.equals( LC.fromString( 'f(thing(1),Y,z,DUDE)' ) ) )
      .to.be( true )
    // make another copy of the original into which we will substitute
    const pattern2 = original.copy()
    expect( original.equals( pattern2 ) ).to.be( true )
    // applying an empty solution not in place makes an identical copy
    // and does nothing to pattern2
    const pattern3 = solution1.apply( pattern2 )
    expect( original.equals( pattern2 ) ).to.be( true )
    expect( original.equals( pattern3 ) ).to.be( true )
    // applying a non-empty solution not in place makes a changed version
    // but does nothing to pattern2
    const pattern4 = solution2.apply( pattern2 )
    expect( original.equals( pattern2 ) ).to.be( true )
    expect( original.equals( pattern4 ) ).to.be( false )
    // and the coversion happened correctly
    expect( pattern4.equals( LC.fromString( 'f(thing(1),Y,z,DUDE)' ) ) )
      .to.be( true )
  } )

} )

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
    if ( lc instanceof Statement && metavars.includes( lc.identifier ) )
      lc.isAMetavariable = true
    lc.children().map( markMetavars )
  }
  markMetavars( pattern )

  // create a matching problem
  let M = new MatchingProblem()

  // add the one main constraint we're supposed to test
  M.addConstraint( pattern, expression )

  // run it
  let solutions = M.getSolutions()

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

  // also run it as an iterator, which should give the same stuff
  let iterator = M.enumerateSolutions()
  for ( let i = 0 ; i < solutions.length ; i++ )
    expect( solutions[i].equals( iterator.next().value ) )
  expect( iterator.next().done )
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

  test( 'matching solutions can be converted into new problems', () => {
    // set a matching problem from an earlier test
    const pattern1 = LC.fromString( 'A(B,c,D)' )
    pattern1.isAMetavariable = true
    pattern1.first.isAMetavariable = true
    pattern1.child( 2 ).isAMetavariable = true
    const expression1 = LC.fromString( 'hi(x,c,D)' )
    const problem1 = new MatchingProblem()
    problem1.addConstraint( pattern1, expression1 )
    // verify that it has the one solution we already tested earlier
    // (just re-verifying for paranoia)
    const solutionSet1 = problem1.getSolutions()
    expect( solutionSet1 ).to.have.length( 1 )
    const solution1 = solutionSet1[0]
    expect( solution1.keys() ).to.have.length( 3 )
    expect( solution1.keys().includes( 'A' ) ).to.be( true )
    expect( solution1.keys().includes( 'B' ) ).to.be( true )
    expect( solution1.keys().includes( 'D' ) ).to.be( true )
    expect( solution1.lookup( 'A' ).equals( LC.fromString( 'hi' ) ) )
      .to.be( true )
    expect( solution1.lookup( 'B' ).equals( LC.fromString( 'x' ) ) )
      .to.be( true )
    expect( solution1.lookup( 'D' ).equals( LC.fromString( 'D' ) ) )
      .to.be( true )
    // now convert that into a new matching problem and extend it with a new
    // challenge that includes some old metavariables and some new ones,
    // creating still a solvable problem.
    const problem2 = solution1.asProblem()
    expect( problem2 ).to.be.a( MatchingProblem )
    const pattern2 = LC.fromString( 'and(B,Q)' )
    pattern2.first.isAMetavariable = true
    pattern2.child( 1 ).isAMetavariable = true
    const expression2 = LC.fromString( 'and(x,y)' )
    problem2.addConstraint( pattern2, expression2 )
    // solve it and verify that only one solution exists, the correct one
    const solutionSet2 = problem2.getSolutions()
    expect( solutionSet2 ).to.have.length( 1 )
    const solution2 = solutionSet2[0]
    expect( solution2.keys() ).to.have.length( 4 )
    expect( solution2.keys().includes( 'A' ) ).to.be( true )
    expect( solution2.keys().includes( 'B' ) ).to.be( true )
    expect( solution2.keys().includes( 'D' ) ).to.be( true )
    expect( solution2.keys().includes( 'Q' ) ).to.be( true )
    expect( solution2.lookup( 'A' ).equals( LC.fromString( 'hi' ) ) )
      .to.be( true )
    expect( solution2.lookup( 'B' ).equals( LC.fromString( 'x' ) ) )
      .to.be( true )
    expect( solution2.lookup( 'D' ).equals( LC.fromString( 'D' ) ) )
      .to.be( true )
    expect( solution2.lookup( 'Q' ).equals( LC.fromString( 'y' ) ) )
      .to.be( true )
    // now convert the same original solution into a new matching problem and
    // extend it with a new challenge that includes some old metavariables and
    // some new ones, but this time create an unsolvable problem.
    const problem3 = solution1.asProblem()
    expect( problem3 ).to.be.a( MatchingProblem )
    const pattern3 = pattern2 // re-use and(B,Q)
    const expression3 = LC.fromString( 'and(y,x)' ) // just change order of args
    problem3.addConstraint( pattern3, expression3 )
    // solve it and verify that no solutions exist
    const solutionSet3 = problem3.getSolutions()
    expect( solutionSet3 ).to.have.length( 0 )
  } )

} )
