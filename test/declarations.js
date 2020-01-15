
// Tests what can be declarations

// import expect.js
let expect = require( 'expect.js' )

// import relevant classes
const { LC, Statement, Environment } = require( '../classes/all.js' )

suite( 'Declarations', () => {

  test( '{ } can\'t be a declaration', () => {
    let E = LC.fromString( '{ }' )
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'variable'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
  } )

  test( '{ A } can be a declaration but isn\'t one by default', () => {
    let E = LC.fromString( '{ A }' )
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'constant' )
    E.declaration = 'variable'
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'variable' )
  } )

  test( '{ A B } can be a declaration but isn\'t one by default', () => {
    let E = LC.fromString( '{ A B }' )
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'constant' )
    E.declaration = 'variable'
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'variable' )
  } )

  test( '{ A B C } can be a declaration but isn\'t one by default', () => {
    let E = LC.fromString( '{ A B C }' )
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'constant' )
    E.declaration = 'variable'
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'variable' )
  } )

  test( '{ {} B C } can\'t be a declaration', () => {
    let E = LC.fromString( '{ {} B C }' )
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'variable'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
  } )

  test( '{ A B(D) C } can\'t be a declaration', () => {
    let E = LC.fromString( '{ A B(D) C }' )
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'variable'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
  } )

  test( 'Modifying { A } can remove its declaration status', () => {
    let E = LC.fromString( '{ A }' )
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'constant' )
    E.insertChild( new Environment() )
    expect( E.toString() ).to.be( '{ {  } A }' )
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
  } )

  test( 'Modifying { A {} } can make it able to be a declaration', () => {
    let E = LC.fromString( '{ A {} }' )
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'variable'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.children()[1].removeFromParent()
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'variable'
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'variable' )
  } )

} )
