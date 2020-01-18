
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
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'constant' )
  } )

  test( 'Declarations can have compound bodies, as in { A { B :C D } }', () => {
    let E = LC.fromString( '{ A { B :C D } }' )
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( true )
    expect( E.declaration ).to.be( 'constant' )
  } )

  test( 'Declarations cannot have givens as bodies, as in { A :B }', () => {
    let E = LC.fromString( '{ A :B }' )
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
  } )

  test( 'Declarations cannot have formulas in their bodies', () => {
    let E = LC.fromString( '{ A { X [ Y Z ] } }' )
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
  } )

  test( 'Declarations cannot have declarations in their bodies', () => {
    let E = LC.fromString( '{ A { X { Y Z } } }' )
    expect( E.canBeADeclaration() ).to.be( true )
    E.declaration = 'constant'
    expect( E.declaration ).to.be( 'constant' )
    E.children()[1].children()[1].declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'variable'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
  } )

  test( 'markDeclarations() handles a single empty environment, { }', () => {
    let E = LC.fromString( '{ }' )
    // check to make sure nothing has been marked with scope feedback yet:
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    // now go ahead and compute all the scope feedback:
    E.markDeclarations()
    // we should find that there are no implicit declarations and nothing failed
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
  } )

  test( 'markDeclarations() handles a singleton environment, { x }', () => {
    let E = LC.fromString( '{ x }' )
    // check to make sure nothing has been marked with scope feedback yet:
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    // now go ahead and compute all the scope feedback:
    E.markDeclarations()
    // we should find that x is the implicit declaration and nothing failed
    expect( E.implicitDeclarations ).to.eql( [ 'x' ] )
    expect( E.declarationFailed() ).to.be( false )
  } )

  test( 'markDeclarations() handles the environment { x { x y } }', () => {
    let E = LC.fromString( '{ x { x y } }' )
    let inner = E.children()[1]
    // check to make sure nothing has been marked with scope feedback yet:
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( inner.implicitDeclarations ).to.eql( [ ] )
    expect( inner.declarationFailed() ).to.be( false )
    // now go ahead and compute all the scope feedback:
    E.markDeclarations()
    // we should find that:
    //  - outer env: x is the implicit declaration and nothing failed
    //  - inner env: y is the implicit declaration and nothing failed
    expect( E.implicitDeclarations ).to.eql( [ 'x' ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( inner.implicitDeclarations ).to.eql( [ 'y' ] )
    expect( inner.declarationFailed() ).to.be( false )
  } )

  test( 'markDeclarations() handles the environment { x Let{ x y } }', () => {
    let E = LC.fromString( '{ x { x y } }' )
    let inner = E.children()[1]
    // check to make sure nothing has been marked with scope feedback yet:
    expect( inner.canBeADeclaration() ).to.be( true )
    inner.declaration = 'variable'
    expect( inner.declaration ).to.be( 'variable' )
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( inner.implicitDeclarations ).to.eql( [ ] )
    expect( inner.declarationFailed() ).to.be( false )
    // now go ahead and compute all the scope feedback:
    E.markDeclarations()
    // we should find that:
    //  - outer env: x is the implicit declaration and nothing failed
    //  - inner env: y is the implicit declaration but the Let failed
    expect( E.implicitDeclarations ).to.eql( [ 'x' ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( inner.implicitDeclarations ).to.eql( [ 'y' ] )
    expect( inner.declaration ).to.be( 'variable' )
    expect( inner.declarationFailed() ).to.be( true )
    expect( inner.successfullyDeclares( 'x' ) ).to.be( false )
  } )

  test( 'markDeclarations() handles { a Let{ x y } Let{ x z } }', () => {
    let E = LC.fromString( '{ a { x y } { x z } }' )
    let in1 = E.children()[1]
    let in2 = E.children()[2]
    // check to make sure nothing has been marked with scope feedback yet:
    expect( in1.canBeADeclaration() ).to.be( true )
    expect( in2.canBeADeclaration() ).to.be( true )
    in1.declaration = 'variable'
    in2.declaration = 'variable'
    expect( in1.declaration ).to.be( 'variable' )
    expect( in2.declaration ).to.be( 'variable' )
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( in1.implicitDeclarations ).to.eql( [ ] )
    expect( in2.implicitDeclarations ).to.eql( [ ] )
    expect( in1.declarationFailed() ).to.be( false )
    expect( in2.declarationFailed() ).to.be( false )
    // now go ahead and compute all the scope feedback:
    E.markDeclarations()
    // we should find that:
    //  - outer env: a is the implicit declaration and nothing failed
    //  - inner env 1: y is implicit, nothing failed, x succeeded
    //  - inner env 2: z is implicit, but the Let x failed
    expect( E.implicitDeclarations ).to.eql( [ 'a' ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( in1.implicitDeclarations ).to.eql( [ 'y' ] )
    expect( in1.declarationFailed() ).to.be( false )
    expect( in1.successfullyDeclares( 'x' ) ).to.be( true )
    expect( in2.implicitDeclarations ).to.eql( [ 'z' ] )
    expect( in2.declarationFailed() ).to.be( true )
    expect( in2.successfullyDeclares( 'x' ) ).to.be( false )
  } )

  test( 'markDeclarations() handles { Declare{ x{} } ~forall(x,P(x)) }', () => {
    let E = LC.fromString( '{ { x{} } ~forall(x,P(x)) }' )
    let in1 = E.children()[0]
    let in2 = E.children()[1]
    // check to make sure nothing has been marked with scope feedback yet:
    expect( in1.canBeADeclaration() ).to.be( true )
    in1.declaration = 'constant'
    expect( in1.declaration ).to.be( 'constant' )
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( in1.implicitDeclarations ).to.eql( [ ] )
    expect( in1.declarationFailed() ).to.be( false )
    expect( in2.quantifierFailed() ).to.be( false )
    // now go ahead and compute all the scope feedback:
    E.markDeclarations()
    // we should find that:
    //  - outer env: implicit declaration of P and nothing failed
    //  - inner env: no implicit declarations, Declare x succeeded
    //  - inner stmt: the quantifier failed (because x was a constant)
    expect( E.implicitDeclarations ).to.eql( [ 'P' ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( in1.implicitDeclarations ).to.eql( [ ] )
    expect( in1.declaration ).to.be( 'constant' )
    expect( in1.declarationFailed() ).to.be( false )
    expect( in1.successfullyDeclares( 'x' ) ).to.be( true )
    expect( in2.quantifierFailed() ).to.be( true )
    expect( in2.successfullyBinds( 'x' ) ).to.be( false )
  } )

  test( 'markDeclarations() handles { Declare{ x{} } ~forall(y,P(y)) }', () => {
    let E = LC.fromString( '{ { x{} } ~forall(y,P(y)) }' )
    let in1 = E.children()[0]
    let in2 = E.children()[1]
    // check to make sure nothing has been marked with scope feedback yet:
    expect( in1.canBeADeclaration() ).to.be( true )
    in1.declaration = 'constant'
    expect( in1.declaration ).to.be( 'constant' )
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( in1.implicitDeclarations ).to.eql( [ ] )
    expect( in1.declarationFailed() ).to.be( false )
    expect( in2.quantifierFailed() ).to.be( false )
    // now go ahead and compute all the scope feedback:
    E.markDeclarations()
    // we should find that:
    //  - outer env: implicit declaration of P and nothing failed
    //  - inner env: no implicit declarations, Declare x succeeded
    //  - inner stmt: the quantifier is OK (because y is not a constant)
    expect( E.implicitDeclarations ).to.eql( [ 'P' ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( in1.implicitDeclarations ).to.eql( [ ] )
    expect( in1.declaration ).to.be( 'constant' )
    expect( in1.declarationFailed() ).to.be( false )
    expect( in1.successfullyDeclares( 'x' ) ).to.be( true )
    expect( in2.quantifierFailed() ).to.be( false )
    expect( in2.successfullyBinds( 'y' ) ).to.be( true )
  } )

  test( 'markDeclarations() handles { Decl{ x{} } Let{ x{} } }', () => {
    let E = LC.fromString( '{ { x{} } { x{} } }' )
    let in1 = E.children()[0]
    let in2 = E.children()[1]
    // check to make sure nothing has been marked with scope feedback yet:
    expect( in1.canBeADeclaration() ).to.be( true )
    expect( in2.canBeADeclaration() ).to.be( true )
    in1.declaration = 'constant'
    in2.declaration = 'variable'
    expect( in1.declaration ).to.be( 'constant' )
    expect( in2.declaration ).to.be( 'variable' )
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( in1.implicitDeclarations ).to.eql( [ ] )
    expect( in2.implicitDeclarations ).to.eql( [ ] )
    expect( in1.declarationFailed() ).to.be( false )
    expect( in2.declarationFailed() ).to.be( false )
    // now go ahead and compute all the scope feedback:
    E.markDeclarations()
    // we should find that:
    //  - outer env: no implicit declarations and nothing failed
    //  - inner env 1: no implicit declarations, Declare x succeeded
    //  - inner env 2: no implicit declarations, Let x failed
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( in1.implicitDeclarations ).to.eql( [ ] )
    expect( in1.declaration ).to.be( 'constant' )
    expect( in1.declarationFailed() ).to.be( false )
    expect( in1.successfullyDeclares( 'x' ) ).to.be( true )
    expect( in1.implicitDeclarations ).to.eql( [ ] )
    expect( in2.declaration ).to.be( 'variable' )
    expect( in2.declarationFailed() ).to.be( true )
    expect( in2.successfullyDeclares( 'x' ) ).to.be( false )
  } )

  test( 'markDeclarations() handles a late implicit declaration', () => {
    let E = LC.fromString( '{'
                         + '  {'
                         + '    { P {} }' // declare P a constant
                         + '  }'
                         + '  P' // uh-oh, now it's implicitly declared
                         // (which ought to invalidate the above declaration)
                         + '}' )
    let inner = E.children()[0]
    let wayInner = inner.children()[0]
    // check to make sure nothing has been marked with scope feedback yet:
    expect( wayInner.canBeADeclaration() ).to.be( true )
    wayInner.declaration = 'constant'
    expect( wayInner.declaration ).to.be( 'constant' )
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( inner.implicitDeclarations ).to.eql( [ ] )
    expect( wayInner.implicitDeclarations ).to.eql( [ ] )
    expect( inner.declarationFailed() ).to.be( false )
    expect( wayInner.declarationFailed() ).to.be( false )
    // now go ahead and compute all the scope feedback:
    E.markDeclarations()
    // we should find that:
    //  - outer env: no implicit declaration of P and nothing failed
    //  - inner env 1: no implicit declarations and nothing failed
    //  - way inner env: no implicit declarations, Let P failed
    expect( E.implicitDeclarations ).to.eql( [ 'P' ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( inner.implicitDeclarations ).to.eql( [ ] )
    expect( inner.declarationFailed() ).to.be( false )
    expect( wayInner.declaration ).to.be( 'constant' )
    expect( wayInner.declarationFailed() ).to.be( true )
    expect( wayInner.successfullyDeclares( 'P' ) ).to.be( false )
  } )

  test( 'markDeclarations() handles a late implicit declaration', () => {
    let E = LC.fromString( '{'
                         + '  {'
                         + '    { P {} }' // declare P a constant
                         + '  }' // end that declaration's scope, so that...
                         + '  { P {} }' // declaring P a variable here is OK!
                         + '}' )
    let inner = E.children()[0]
    let dec1 = inner.children()[0]
    let dec2 = E.children()[1]
    // check to make sure nothing has been marked with scope feedback yet:
    expect( dec1.canBeADeclaration() ).to.be( true )
    expect( dec2.canBeADeclaration() ).to.be( true )
    dec1.declaration = 'constant'
    dec2.declaration = 'variable'
    expect( dec1.declaration ).to.be( 'constant' )
    expect( dec2.declaration ).to.be( 'variable' )
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( inner.implicitDeclarations ).to.eql( [ ] )
    expect( dec1.implicitDeclarations ).to.eql( [ ] )
    expect( dec2.implicitDeclarations ).to.eql( [ ] )
    expect( inner.declarationFailed() ).to.be( false )
    expect( dec1.declarationFailed() ).to.be( false )
    expect( dec2.declarationFailed() ).to.be( false )
    // now go ahead and compute all the scope feedback:
    E.markDeclarations()
    // we should find that:
    //  - outer env: no implicit declaration of P and nothing failed
    //  - inner env: no implicit declaration of P and nothing failed
    //  - declaration 1: no implicit declarations, Declare P succeeded
    //  - declaration 2: no implicit declarations, Let P succeeded
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( inner.implicitDeclarations ).to.eql( [ ] )
    expect( inner.declarationFailed() ).to.be( false )
    expect( dec1.declarationFailed() ).to.be( false )
    expect( dec1.successfullyDeclares( 'P' ) ).to.be( true )
    expect( dec1.declaration ).to.be( 'constant' )
    expect( dec2.declarationFailed() ).to.be( false )
    expect( dec2.successfullyDeclares( 'P' ) ).to.be( true )
    expect( dec2.declaration ).to.be( 'variable' )
  } )

} )
