
// Tests the wrapper class built around second-order matching, using LCs

// import expect.js
let expect = require( 'expect.js' )

// import all classes defined in this repo
const { Matcher } = require( '../classes/matching.js' )
const { LC } = require( '../classes/lc.js' )

suite( 'Matcher', () => {

  test( 'This will surely fall completely apart', () => {
    expect( Matcher ).to.be.ok()
    let M = new Matcher()
    expect( M ).to.be.a( Matcher )
    let pattern = LC.fromString( 'plus(A,B)' )
    pattern.children()[0].isAMetavariable = true // A
    pattern.children()[1].isAMetavariable = true // B
    let expression = LC.fromString( 'plus(x,y)' )
    M.addConstraint( pattern, expression )
    let S = M.getSolutions()
    expect( S ).to.be.an( Array )
    expect( S ).to.have.length( 1 )
    let S1 = S[0]
    expect( S1 ).to.be.an( Array )
    expect( S1 ).to.have.length( 2 )
    let metavarA = pattern.children()[0]
    expect( S1[0].pattern.equals( metavarA ) ).to.be( true )
    expect( S1[0].expression.equals( LC.fromString( 'x' ) ) ).to.be( true )
    let metavarB = pattern.children()[1]
    expect( S1[1].pattern.equals( metavarB ) ).to.be( true )
    expect( S1[1].expression.equals( LC.fromString( 'y' ) ) ).to.be( true )
  } )

  // More tests should go here.

} )
