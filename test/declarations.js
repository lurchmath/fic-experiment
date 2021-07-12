
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
    E.child( 1 ).child( 1 ).declaration = 'constant'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
    E.declaration = 'variable'
    expect( E.canBeADeclaration() ).to.be( false )
    expect( E.declaration ).to.be( 'none' )
  } )

} )

suite( 'Marking declarations', () => {

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
    let inner = E.child( 1 )
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
    let E = LC.fromString( '{ x Let{ x y } }' )
    let inner = E.child( 1 )
    // check to make sure nothing has been marked with scope feedback yet:
    expect( inner.declaration ).to.be( 'variable' )
    expect( E.implicitDeclarations ).to.eql( [ ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( inner.implicitDeclarations ).to.eql( [ ] )
    expect( inner.declarationFailed() ).to.be( false )
    // now go ahead and compute all the scope feedback:
    E.markDeclarations()
    // we should find that:
    //  - outer env: x,y are both implicit declarations and nothing failed
    //  - inner env: no implicit declarations but the Let failed
    expect( E.implicitDeclarations ).to.eql( [ 'x', 'y' ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( inner.implicitDeclarations ).to.eql( [ ] )
    expect( inner.declaration ).to.be( 'variable' )
    expect( inner.declarationFailed() ).to.be( true )
    expect( inner.successfullyDeclares( 'x' ) ).to.be( false )
  } )

  test( 'markDeclarations() handles { a Let{ x y } Let{ x z } }', () => {
    let E = LC.fromString( '{ a Let{ x y } Let{ x z } }' )
    let in1 = E.child( 1 )
    let in2 = E.child( 2 )
    // check to make sure nothing has been marked with scope feedback yet:
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
    expect( E.implicitDeclarations ).to.eql( [ 'a', 'y', 'z' ] )
    expect( E.declarationFailed() ).to.be( false )
    expect( in1.implicitDeclarations ).to.eql( [ ] )
    expect( in1.declarationFailed() ).to.be( false )
    expect( in1.successfullyDeclares( 'x' ) ).to.be( true )
    expect( in2.implicitDeclarations ).to.eql( [ ] )
    expect( in2.declarationFailed() ).to.be( true )
    expect( in2.successfullyDeclares( 'x' ) ).to.be( false )
  } )

  test( 'markDeclarations() handles { Declare{ x{} } ~forall(x,P(x)) }', () => {
    let E = LC.fromString( '{ Declare{ x{} } ~forall(x,P(x)) }' )
    let in1 = E.first
    let in2 = E.child( 1 )
    // check to make sure nothing has been marked with scope feedback yet:
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
    let E = LC.fromString( '{ Declare{ x{} } ~forall(y,P(y)) }' )
    let in1 = E.first
    let in2 = E.child( 1 )
    // check to make sure nothing has been marked with scope feedback yet:
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

  test( 'markDeclarations() handles { Declare{ x{} } Let{ x{} } }', () => {
    let E = LC.fromString( '{ Declare{ x{} } Let{ x{} } }' )
    let in1 = E.first
    let in2 = E.child( 1 )
    // check to make sure nothing has been marked with scope feedback yet:
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
                         + '    Declare{ P {} }' // declare P a constant
                         + '  }'
                         + '  P' // uh-oh, now it's implicitly declared
                         // (which ought to invalidate the above declaration)
                         + '}' )
    let inner = E.first
    let wayInner = inner.first
    // check to make sure nothing has been marked with scope feedback yet:
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
    //  - outer env: implicit declaration of P and nothing failed
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
                         + '    Declare{ P {} }' // declare P a constant
                         + '  }' // end that declaration's scope, so that...
                         + '  Let{ P {} }' // declaring P a variable here is OK!
                         + '}' )
    let inner = E.first
    let dec1 = inner.first
    let dec2 = E.child( 1 )
    // check to make sure nothing has been marked with scope feedback yet:
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

suite( 'Formulas', () => {

  test( 'Asking for the metavariables in non-formulas is undefined', () => {
    let F = LC.fromString( 'x' )
    expect( F.formulaMetavariables ).to.be( undefined )
    F = LC.fromString( '{ x }' )
    expect( F.formulaMetavariables ).to.be.ok()
    expect( F.formulaMetavariables() ).to.be( undefined )
    F.markDeclarations()
    expect( F.formulaMetavariables() ).to.be( undefined )
  } )

  test( 'Asking about metavars before markDeclarations() is undefined', () => {
    let F = LC.fromString( '[ x ]' )
    expect( F ).to.be.an( Environment )
    expect( F.isAFormula ).to.be( true )
    expect( F.formulaMetavariables() ).to.be( undefined )
  } )

  test( 'The formula [ x ] has one metavariable, x', () => {
    let F = LC.fromString( '[ x ]' )
    F.markDeclarations()
    expect( F ).to.be.an( Environment )
    expect( F.isAFormula ).to.be( true )
    expect( F.formulaMetavariables() ).to.eql( [ 'x' ] )
  } )

  test( 'The formula [ ~forall(x,P(x)) ] has one metavariable, P', () => {
    let F = LC.fromString( '[ ~forall(x,P(x)) ]' )
    F.markDeclarations()
    expect( F ).to.be.an( Environment )
    expect( F.isAFormula ).to.be( true )
    expect( F.formulaMetavariables() ).to.eql( [ 'P' ] )
  } )

  test( 'The formula [ ~forall(x,P(x,y)) Q ] has metavariables P,y,Q', () => {
    let F = LC.fromString( '[ ~forall(x,P(x,y)) Q ]' )
    F.markDeclarations()
    expect( F ).to.be.an( Environment )
    expect( F.isAFormula ).to.be( true )
    expect( F.formulaMetavariables() ).to.eql( [ 'P', 'y', 'Q' ] )
  } )

  test( 'Variable declarations don\'t impact formula metavariables', () => {
    let E = LC.fromString( '{ Let{ P {} } [ ~forall(x,P(x,y)) Q ] }' )
    let dec = E.first
    let F = E.child( 1 )
    E.markDeclarations()
    expect( dec.successfullyDeclares( 'P' ) )
    expect( F.isAFormula ).to.be( true )
    expect( F.formulaMetavariables() ).to.eql( [ 'P', 'y', 'Q' ] )
  } )

  test( 'Constant declarations do impact formula metavariables', () => {
    let E = LC.fromString( '{ Declare{ P {} } [ ~forall(x,P(x,y)) Q ] }' )
    let dec = E.first
    let F = E.child( 1 )
    E.markDeclarations()
    expect( dec.successfullyDeclares( 'P' ) )
    expect( F.isAFormula ).to.be( true )
    expect( F.formulaMetavariables() ).to.eql( [ 'y', 'Q' ] )
  } )

} )

suite( 'Identifier scopes', () => {

  test( 'The scope of a non-identifier is undefined', () => {
    expect( LC.fromString( 'f(x)' ).scope() ).to.be( undefined )
    expect( LC.fromString( '~forall(x,P(x))' ).scope() ).to.be( undefined )
  } )

  test( 'The scope of a quantified variable is the quantifier', () => {
    let E = LC.fromString( '{ ~forall(x,P(x)) }' )
    let Q = E.first
    let x1 = Q.first
    let x2 = Q.child( 1 ).first
    // be sure we've selected the right Structures inside the above env:
    expect( Q.identifier ).to.be( 'forall' )
    expect( x1.identifier ).to.be( 'x' )
    expect( x2.identifier ).to.be( 'x' )
    // (In this case w/only quantifiers, we don't need markVariables().)
    // verify scopes of bound variables:
    expect( x1.scope() ).to.be( Q )
    expect( x2.scope() ).to.be( Q )
  } )

  test( 'The scope of an implicitly declared variable is its env', () => {
    let E = LC.fromString( '{ ~forall(x,P(x)) }' )
    let Q = E.first
    let P = Q.child( 1 )
    // be sure we've selected the right Structures inside the above env:
    expect( Q.identifier ).to.be( 'forall' )
    expect( P.identifier ).to.be( 'P' )
    // ensure we have all the scope info we need:
    E.markDeclarations()
    // verify scopes of bound variables:
    expect( P.scope() ).to.be( E )
  } )

  test( 'The scope of an explicitly declared variable is its decl', () => {
    let E = LC.fromString( '{ Let{ P Q } ~forall(x,P(x)) }' )
    let dec = E.first
    let Q = E.child( 1 )
    let P = Q.child( 1 )
    // be sure we've selected the right Structures inside the above env:
    expect( dec.declaration ).to.be( 'variable' )
    expect( Q.identifier ).to.be( 'forall' )
    expect( P.identifier ).to.be( 'P' )
    // (In this case w/only explicit decls, we don't need markVariables().)
    expect( dec.successfullyDeclares( 'P' ) ).to.be( true )
    // verify scopes of bound variables:
    expect( P.scope() ).to.be( dec )
  } )

  test( 'All identifiers in a big example have the right scopes', () => {
    let E = LC.fromString( '{'
                         + '  foo(bar)'
                         + '  {'
                         + '    Let{ x P(x) }' // Let x be such that P(x)
                         + '    Q(x)'
                         + '  }'
                         + '  {'
                         + '    Declare{ y { } }' // Declare y
                         + '    gt(x,y)'
                         + '  }'
                         + '  foo(baz)'
                         + '}' )
    let dec1 = E.child( 1 ).first
    expect( dec1.declaration ).to.be( 'variable' )
    let dec2 = E.child( 2 ).first
    expect( dec2.declaration ).to.be( 'constant' )
    E.markDeclarations()
    // first child of E: foo(bar), both identifiers implicitly declared in E
    let foo = E.first
    expect( foo.identifier ).to.be( 'foo' )
    let bar = foo.first
    expect( bar.identifier ).to.be( 'bar' )
    expect( foo.scope() ).to.be( E )
    expect( bar.scope() ).to.be( E )
    // dec1: Let x be such that P(x)
    //   both x instances have scope == dec1
    //   P is implicitly declared in dec1.parent()
    let x = dec1.first
    expect( x.identifier ).to.be( 'x' )
    expect( x.scope() ).to.be( dec1 )
    x = dec1.child( 1 ).first
    expect( x.identifier ).to.be( 'x' )
    expect( x.scope() ).to.be( dec1 )
    let P = dec1.child( 1 )
    expect( P.scope() ).to.be( dec1.parent() )
    // Q(x): x is declared in dec1, Q is implicit in its parent
    let Q = dec1.nextSibling()
    expect( Q.identifier ).to.be( 'Q' )
    expect( Q.scope() ).to.be( Q.parent() )
    expect( Q.first.scope() ).to.be( dec1 )
    // dec2: Let y be a constant; the y has scope == dec2
    expect( dec2.first.identifier ).to.be( 'y' )
    expect( dec2.first.scope() ).to.be( dec2 )
    // gt(x,y): g and x are implicit in parent, y is declared in dec2
    let gt = dec2.nextSibling()
    expect( gt.identifier ).to.be( 'gt' )
    expect( gt.scope() ).to.be( gt.parent() )
    expect( gt.first.scope() ).to.be( gt.parent() )
    expect( gt.child( 1 ).scope() ).to.be( dec2 )
    // foo(baz): foo implicitly declared earlier, baz now, but in same parent
    let last = E.last
    expect( last.identifier ).to.be( 'foo' )
    expect( last.scope() ).to.be( E )
    expect( last.first.identifier ).to.be( 'baz' )
    expect( last.first.scope() ).to.be( E )
  } )

  test( 'Scopes of implicit decls are undefined w/o markDeclarations()', () => {
    let E = LC.fromString( '{ ~forall(x,P(x)) }' )
    let Q = E.first
    let P = Q.child( 1 )
    expect( Q.identifier ).to.be( 'forall' )
    expect( P.identifier ).to.be( 'P' )
    expect( P.scope() ).to.be( undefined )
  } )

  test( 'Check that .value() returns the last argument'
       +' of a declaration or {  }.', () => {
    let D = LC.fromString('Declare{ x P(x,y) }')
    let L = LC.fromString('Let{ x P(x,y) }')
    let D1 = LC.fromString('Declare{ x }')
    let L1 = LC.fromString('Let{ x }')
    expect( D.value().toString() ).to.equal( 'P(x,y)' )
    expect( L.value().toString() ).to.equal( 'P(x,y)' )
    expect( D1.value().toString() ).to.equal( 'x' )
    expect( L1.value().toString() ).to.equal( 'x' )
    let A = LC.fromString('A')
    let E = LC.fromString('{ A }')
    expect( A.value() ).to.be(A)
    expect( E.value() ).to.be(E)
  } )

} )
