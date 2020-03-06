
// Tests conversion between LC trees and OM trees, both ways

// import expect.js
let expect = require( 'expect.js' )

// import all LC subclasses and OM
const { OM, LC, Statement, Environment } = require( '../classes/all.js' )
const { isMetavariable, setMetavariable, clearMetavariable } =
  require( '../dependencies/matching.js' )

// helper function for testing
let check = ( LCnotation, simpleOM ) => {
  // Take input strings and parse into real trees
  let lc = null
  if ( LCnotation instanceof LC ) {
    lc = LCnotation
    // console.log( `LCnotation did not need parsing, so lc is "${lc}"` )
  } else {
    lc = LC.fromString( LCnotation )
    // console.log( `LCnotation "${LCnotation}" parsed into lc "${lc}"` )
  }
  let om = null
  if ( simpleOM instanceof OM ) {
    om = simpleOM
    // console.log( `simpleOM did not need parsing, so om is "${om.toXML()}"` )
  } else {
    om = OM.simple( simpleOM )
    // console.log( `simpleOM "${simpleOM}" parsed into om "${om.toXML()}"` )
  }
  // Convert each tree into the other format
  let convertedToOM = lc.toOM()
  // console.log( `That LC as convertedToOM "${convertedToOM.toXML()}"` )
  let convertedToLC = LC.fromOM( om )
  // console.log( `That OM as convertedToLC "${convertedToLC}"` )
  // Verify the conversions produced the right types AND structures
  expect( convertedToOM ).to.be.an( OM )
  expect( convertedToLC ).to.be.an( LC )
  expect( convertedToOM.equals( om ) ).to.be( true )
  expect( convertedToLC.equals( lc ) ).to.be( true )
  // Now reverse the conversion in both directions
  let convertedBackToOM = convertedToLC.toOM()
  // console.log( `Then convertedBackToOM "${convertedBackToOM.toXML()}"` )
  let convertedBackToLC = LC.fromOM( convertedToOM )
  // console.log( `Then convertedBackToLC "${convertedBackToLC}"` )
  // Verify that these second conversions got each back where it came from
  expect( convertedBackToOM ).to.be.an( OM )
  expect( convertedBackToLC ).to.be.an( LC )
  expect( convertedBackToOM.equals( om ) ).to.be( true )
  expect( convertedBackToLC.equals( lc ) ).to.be( true )
}

suite( 'OM Conversions', () => {

  test( 'Check two-way conversion of simple atomics', () => {
    check( 'a', 'a' )
    check( 'aardvark', 'aardvark' )
    check( 'x_5', 'x_5' )
  } )

  test( 'Check two-way conversion of compound Statements', () => {
    check( 'f(x)', 'f(x)' )
    check( 'eq(plus(a,b),c)', 'eq(plus(a,b),c)' )
  } )

  test( 'Check two-way conversion of Statements with bindings', () => {
    check( '~forall(x,P(x))', 'Lurch.forall[x,P(x)]' )
    check( '~forall(x,~exists(y,P(x,y)))',
           'Lurch.forall[x,Lurch.exists[y,P(x,y)]]' )
  } )

  test( 'Check two-way conversion of Environments', () => {
    check( '{ }', 'Lurch.Env()' )
    check( '{ a b c }', 'Lurch.Env(a,b,c)' )
    check( '{ { f(x) } { ~lambda(x,x) } }',
           'Lurch.Env(Lurch.Env(f(x)),Lurch.Env(Lurch.lambda[x,x]))' )
  } )

  let asAGiven = ( x ) =>
    OM.att( x, OM.sym( 'given', 'Lurch' ), OM.str( 'true' ) )
  let OMEnv = ( ...children ) =>
    OM.app( OM.sym( 'Env', 'Lurch' ), ...children )

  test( 'Check situations involving some given LCs', () => {
    check( ':A', asAGiven( OM.var( 'A' ) ) )
    check( '{:A B}', OMEnv( asAGiven( OM.var( 'A' ) ), OM.var( 'B' ) ) )
    check( '{{}:{X}}', OMEnv( OMEnv(), asAGiven( OMEnv( OM.var( 'X' ) ) ) ) )
  } )

  let asAFormula = ( x ) =>
    OM.att( x, OM.sym( 'formula', 'Lurch' ), OM.str( 'true' ) )

  test( 'Check situations involving some formulas', () => {
    check( '[ A ]', asAFormula( OMEnv( OM.var( 'A' ) ) ) )
    check( '[ { X } { :A B } ]', asAFormula( OMEnv(
      OMEnv( OM.var( 'X' ) ),
      OMEnv( asAGiven( OM.var( 'A' ) ), OM.var( 'B' ) )
    ) ) )
  } )

  test( 'Check situations involving metavariables', () => {
    let PofxLC = LC.fromString( 'P(x)' )
    let PofxOM = OM.simple( 'P(x)' )
    check( PofxLC, PofxOM )
    PofxLC.isAMetavariable = true
    setMetavariable( PofxOM.children[0] )
    check( PofxLC, PofxOM )
    PofxLC.isAMetavariable = false
    clearMetavariable( PofxOM.children[0] )
    check( PofxLC, PofxOM )
    PofxLC.first.isAMetavariable = true
    setMetavariable( PofxOM.children[1] )
    check( PofxLC, PofxOM )
    PofxLC.first.isAMetavariable = false
    clearMetavariable( PofxOM.children[1] )
    check( PofxLC, PofxOM )
  } )

  let tryingToConvert = ( x ) => () =>
    console.log( ''+LC.fromOM( OM.simple( x ) ) )

  test( 'Check that some OM things can\'t convert to LCs', () => {
    expect( tryingToConvert( '2' ) ).to.throwException( /this type/ )
    expect( tryingToConvert( 'f(x)(y)' ) ).to.throwException( /structure/ )
  } )

} )
