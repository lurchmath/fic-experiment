
// Tests FIC derivation definition in deduction.js

// import expect.js
let expect = require( 'expect.js' )

// import relevant classes and the deduction routine
const {
  LC, Statement, Environment, containsMetavariables, pairUp,
  applyInstantiation, canonicalPremises, derivationMatches,
  allDerivationMatches, existsDerivation
} = require( '../classes/all.js' )
// we also need the matcher for various tests; matching and deduction are linked
const { MatchingProblem } = require( '../classes/matching.js' )

suite( 'Auxiliary functions supporting derivation', () => {

  test( 'containsMetavariables performs correctly on examples', () => {
    let L = LC.fromString( 'foo' )
    expect( L.isAMetavariable ).to.be( false )
    expect( containsMetavariables( L ) ).to.be( false )
    L.isAMetavariable = true
    expect( L.isAMetavariable ).to.be( true )
    expect( containsMetavariables( L ) ).to.be( true )
    L = LC.fromString( 'f(x)' )
    expect( L.isAMetavariable ).to.be( false )
    expect( L.children()[0].isAMetavariable ).to.be( false )
    expect( containsMetavariables( L ) ).to.be( false )
    L.isAMetavariable = true
    expect( L.isAMetavariable ).to.be( true )
    expect( L.children()[0].isAMetavariable ).to.be( false )
    expect( containsMetavariables( L ) ).to.be( true )
    L.isAMetavariable = false
    L.children()[0].isAMetavariable = true
    expect( L.isAMetavariable ).to.be( false )
    expect( L.children()[0].isAMetavariable ).to.be( true )
    expect( containsMetavariables( L ) ).to.be( true )
    L = LC.fromString( 'bury(this(deeply(haha)))' )
    expect( containsMetavariables( L ) ).to.be( false )
    L.children()[0].children()[0].children()[0].isAMetavariable = true
    expect( containsMetavariables( L ) ).to.be( true )
  } )

  test( 'pairUp of two LCs without metavariables compares equality', () => {
    let L = LC.fromString( 'foo' )
    let M = LC.fromString( 'bar' )
    expect( L.equals( M ) ).to.be( false )
    expect( pairUp( L, M ) ).to.be( false )
    let L2 = L.copy()
    let M2 = M.copy()
    expect( L.equals( L2 ) ).to.be( true )
    expect( pairUp( L, L2 ) ).to.be( true )
    expect( M.equals( M2 ) ).to.be( true )
    expect( pairUp( M, M2 ) ).to.be( true )
    L = LC.fromString( 'example(1,2,3,f(4))' )
    M = LC.fromString( 'other(~thing,a(b),~c)' )
    expect( L.equals( M ) ).to.be( false )
    expect( pairUp( L, M ) ).to.be( false )
    L2 = L.copy()
    M2 = M.copy()
    expect( L.equals( L2 ) ).to.be( true )
    expect( pairUp( L, L2 ) ).to.be( true )
    expect( M.equals( M2 ) ).to.be( true )
    expect( pairUp( M, M2 ) ).to.be( true )
  } )

  test( 'pairUp of two LCs both with metavariables compares equality', () => {
    let L = LC.fromString( 'foo' )
    let M = LC.fromString( 'bar' )
    L.isAMetavariable = true
    M.isAMetavariable = true
    expect( L.equals( M ) ).to.be( false )
    expect( pairUp( L, M ) ).to.be( false )
    let L2 = L.copy()
    let M2 = M.copy()
    expect( L2.isAMetavariable ).to.be( true )
    expect( M2.isAMetavariable ).to.be( true )
    expect( L.equals( L2 ) ).to.be( true )
    expect( pairUp( L, L2 ) ).to.be( true )
    expect( M.equals( M2 ) ).to.be( true )
    expect( pairUp( M, M2 ) ).to.be( true )
    L = LC.fromString( 'example(1,2,3,f(4))' )
    M = LC.fromString( 'other(~thing,a(b),~c)' )
    L.children()[3].isAMetavariable = true
    M.children()[1].isAMetavariable = true
    expect( L.equals( M ) ).to.be( false )
    expect( pairUp( L, M ) ).to.be( false )
    L2 = L.copy()
    M2 = M.copy()
    expect( L.equals( L2 ) ).to.be( true )
    expect( pairUp( L, L2 ) ).to.be( true )
    expect( M.equals( M2 ) ).to.be( true )
    expect( pairUp( M, M2 ) ).to.be( true )
  } )

  test( 'pairUp of one LC with metavariables and one w/o sorts them', () => {
    let L = LC.fromString( 'foo' )
    let M = LC.fromString( 'bar' )
    L.isAMetavariable = true
    expect( containsMetavariables( L ) ).to.be( true )
    expect( containsMetavariables( M ) ).to.be( false )
    let P = pairUp( L, M )
    expect( P ).to.have.length( 2 )
    expect( P[0] ).to.be( L )
    expect( P[1] ).to.be( M )
    P = pairUp( M, L )
    expect( P ).to.have.length( 2 )
    expect( P[0] ).to.be( L )
    expect( P[1] ).to.be( M )
    L = LC.fromString( 'example(1,2,3,f(4))' )
    M = LC.fromString( 'other(~thing,a(b),~c)' )
    M.children()[1].isAMetavariable = true
    expect( containsMetavariables( L ) ).to.be( false )
    expect( containsMetavariables( M ) ).to.be( true )
    P = pairUp( L, M )
    expect( P ).to.have.length( 2 )
    expect( P[0] ).to.be( M )
    expect( P[1] ).to.be( L )
    P = pairUp( M, L )
    expect( P ).to.have.length( 2 )
    expect( P[0] ).to.be( M )
    expect( P[1] ).to.be( L )
  } )

  test( 'MatchingSolution.apply() works on various examples', () => {
    // Test 1
    //
    // Match f(X,Y) against f(2,g(3))
    let pattern = LC.fromString( 'f(X,Y)' )
    pattern.children()[0].isAMetavariable = true
    pattern.children()[1].isAMetavariable = true
    let expression = LC.fromString( 'f(a,g(b))' )
    let problem = new MatchingProblem()
    problem.addConstraint( pattern, expression )
    expect( problem.numSolutions() ).to.be( 1 )
    // Verify that we get the instantiation X:2, Y:g(3).
    let match = problem.getSolutions()[0]
    expect( match.keys() ).to.have.length( 2 )
    expect( match.keys().includes( 'X' ) ).to.be( true )
    expect( match.keys().includes( 'Y' ) ).to.be( true )
    expect( match.lookup( 'X' ).equals( LC.fromString( 'a' ) ) ).to.be( true )
    expect( match.lookup( 'Y' ).equals( LC.fromString( 'g(b)' ) ) ).to.be( true )
    // Use that solution to instantiate plus(Y,X,Y)
    let newPattern = LC.fromString( 'plus(Y,X,Y)' )
    newPattern.children()[0].isAMetavariable = true
    newPattern.children()[1].isAMetavariable = true
    newPattern.children()[2].isAMetavariable = true
    let newExpression = match.apply( newPattern )
    // Verify that we get plus(g(b),a,g(b))
    expect( `${newExpression}` ).to.be( 'plus(g(b),a,g(b))' )

    // Test 2
    //
    // Apply the same solution to plus(Y,X,Y) *with no metavars in it*
    // (that is, this time around, X and Y are not metavariables)
    newPattern = LC.fromString( 'plus(Y,X,Y)' )
    newExpression = match.apply( newPattern )
    expect( `${newExpression}` ).to.be( 'plus(Y,X,Y)' )

    // Test 3
    //
    // Apply the same solution to { :X Y }
    // and expect the result to be { :a g(b) }
    newPattern = LC.fromString( '{ :X Y }' )
    newPattern.children()[0].isAMetavariable = true
    newPattern.children()[1].isAMetavariable = true
    newExpression = match.apply( newPattern )
    expect( `${newExpression}` ).to.be( '{ :a g(b) }' )
  } )

  test( 'we can convert premise lists to canonical form', () => {
    // [ :A, B, { :C D } ]  --canonical-->  [ B, { :C D } ]
    let premises = [ ':A', 'B', '{ :C D }' ].map( LC.fromString )
    let expected = [ 'B', '{ :C D }' ].map( LC.fromString )
    let computed = canonicalPremises( premises )
    expect( computed ).to.have.length( 2 )
    expect( computed[0].equals( expected[0] ) ).to.be( true )
    expect( computed[1].equals( expected[1] ) ).to.be( true )
    // [ { :C { :D E } }, F ]  --canonical-->  [ F, { :C :D E } ]
    premises = [ '{ :C { :D E } }', 'F' ].map( LC.fromString )
    expected = [ 'F', '{ :C :D E }' ].map( LC.fromString )
    computed = canonicalPremises( premises )
    expect( computed ).to.have.length( 2 )
    expect( computed[0].equals( expected[0] ) ).to.be( true )
    expect( computed[1].equals( expected[1] ) ).to.be( true )
    // [ G, { :H I }, { J K } ]  --canonical-->  [ G, J, K, { :H I } ]
    premises = [ 'G', '{ :H I }', '{ J K }' ].map( LC.fromString )
    expected = [ 'G', 'J', 'K', '{ :H I }' ].map( LC.fromString )
    computed = canonicalPremises( premises )
    expect( computed ).to.have.length( 4 )
    expect( computed[0].equals( expected[0] ) ).to.be( true )
    expect( computed[1].equals( expected[1] ) ).to.be( true )
    expect( computed[2].equals( expected[2] ) ).to.be( true )
    expect( computed[3].equals( expected[3] ) ).to.be( true )
    // [ { :A B C }, { :D :E F } ]  --canonical-->
    //   [ { :A B }, { :A C }, { :D :E F } ]
    premises = [ '{ :A B C }', '{ :D :E F }' ].map( LC.fromString )
    expected = [ '{ :A B }', '{ :A C }', '{ :D :E F }' ].map( LC.fromString )
    computed = canonicalPremises( premises )
    expect( computed ).to.have.length( 3 )
    expect( computed[0].equals( expected[0] ) ).to.be( true )
    expect( computed[1].equals( expected[1] ) ).to.be( true )
    expect( computed[2].equals( expected[2] ) ).to.be( true )
    // [ { :_P_ Q }, R ] --canonical--> [ { :_P_ Q }, R ]
    premises = [ '{ :P Q }', 'R' ].map( LC.fromString )
    premises[0].children()[0].isAMetavariable = true
    expected = [ premises[1].copy(), premises[0].copy() ]
    computed = canonicalPremises( premises )
    expect( computed ).to.have.length( 2 )
    expect( computed[0].equals( expected[0] ) ).to.be( true )
    expect( computed[1].equals( expected[1] ) ).to.be( true )
  } )

} )

// In all the tests below, we adopt the convention that variable names of the
// form _A_ are shorthand for a variable named A that is marked as a
// metavariable.
suite( 'Derivation with matching', () => {

  let makeExpression = ( string ) => LC.fromString( string )
  let makePattern = ( string ) => {
    let applyMetavarConvention = ( inThis ) => {
      if ( inThis.identifier && inThis.identifier[0] == '_' &&
           inThis.identifier[inThis.identifier.length-1] == '_' ) {
        inThis.identifier = inThis.identifier.substring(
          1, inThis.identifier.length - 1 )
        inThis.isAMetavariable = true
      }
      inThis.children().map( applyMetavarConvention )
      return inThis
    }
    return applyMetavarConvention( makeExpression( string ) )
  }

  let checkSolution = ( solution, stringMapping ) => {
    // console.log( `\nChecking: ${solution} vs.`, stringMapping )
    expect( Object.keys( stringMapping ).every( key => solution.has( key ) ) )
      .to.be( true )
    for ( const key in stringMapping )
      expect( solution.lookup( key ).equals(
        LC.fromString( stringMapping[key] ) ) ).to.be( true )
  }

  let checkSolutions = ( premises, conclusion, stringMappings,
                         options = { } ) => {
    // //
    // console.log( 'Checking solution set:' )
    // allSolutions.map( sol => {
    //   console.log( '\t{',
    //     sol.map( pair => '('+pair.pattern
    //                     +','+pair.expression+')' ).join( ',' ), '}' )
    // } )
    // console.log( 'Against mapping set:' )
    // stringMappings.map( strmap => {
    //   console.log( '\t{',
    //     Object.keys( strmap ).map( key =>
    //       '('+key+','+strmap[key]+')' ).join( ',' ), '}' )
    // } )
    // //
    let matchingSolutions =
      allDerivationMatches( premises, conclusion, options )
    expect( matchingSolutions ).to.have.length( stringMappings.length )
    for ( let i = 0 ; i < matchingSolutions.length ; i++ )
      checkSolution( matchingSolutions[i], stringMappings[i] )
    expect( stringMappings.length > 0 ).to.be(
      existsDerivation( premises, conclusion, options ) )
  }

  test( 'Has all the functions needed for derivation with matching', () => {
    expect( allDerivationMatches ).to.be.ok()
    expect( derivationMatches ).to.be.ok()
  } )

  test( 'Correctly uses the T rule in matching', () => {
    // any pile of stuff on the left, with or without metavariables, ought to
    // give a positive answer to |- { } without any instantiations needed
    // example 1:
    checkSolutions(
      [ ],
      makeExpression( '{ }' ),
      [ { } ]
    )
    // example 2:
    checkSolutions(
      [
        makePattern( '{ A B }' )
      ],
      makeExpression( '{ }' ),
      [ { } ]
    )
    // example 3:
    checkSolutions(
      [
        makePattern( '_A_(_B_,_C_)' ),
        makePattern( 'not(a,metavar)' )
      ],
      makeExpression( '{ }' ),
      [ { } ]
    )
  } )

  test( 'Correctly uses the S rule in matching', () => {
    // First consider A |- A, which should pass, no metavariables present
    checkSolutions(
      [
        makePattern( 'A' )
      ],
      makeExpression( 'A' ),
      [ { } ]
    )
    // Next consider _A_ |- A, which should pass as well
    checkSolutions(
      [
        makePattern( '_A_' )
      ],
      makeExpression( 'A' ),
      [ { 'A' : 'A' } ]
    )
    // Next consider _X_ |- A, which should pass as well
    checkSolutions(
      [
        makePattern( '_X_' )
      ],
      makeExpression( 'A' ),
      [ { 'X' : 'A' } ]
    )
    // Next consider _X_, _Y_ |- A, which should pass in two different ways
    checkSolutions(
      [
        makePattern( '_X_' ), makePattern( '_Y_' )
      ],
      makeExpression( 'A' ),
      [
        { 'X' : 'A' },
        { 'Y' : 'A' }
      ]
    )
    // Next consider _X_(_Y_) |- A, which should fail
    checkSolutions(
      [
        makePattern( '_X_(_Y_)' )
      ],
      makeExpression( 'A' ),
      [ ]
    )
  } )

  test( 'Correctly uses the GR rule in matching', () => {
    // First consider |- { :A A }, which should pass, no metavariables present
    checkSolutions(
      [ ],
      makeExpression( '{ :A A }' ),
      [ { } ]
    )
    // Next consider |- { :_X_ A }, which should pass also
    checkSolutions(
      [ ],
      makePattern( '{ :_X_ A }' ),
      [ { 'X' : 'A' } ]
    )
    // Next consider |- { :_X_ { :_Y_ A } }, which should pass in 2 ways
    checkSolutions(
      [ ],
      makePattern( '{ :_X_ { :_Y_ A } }' ),
      [
        { 'Y' : 'A' },
        { 'X' : 'A' }
      ]
    )
  } )

  test( 'Correctly uses the CR rule in matching', () => {
    // First consider A |- { A A }, which should pass, no metavariables present
    checkSolutions(
      [
        makeExpression( 'A' )
      ],
      makeExpression( '{ A A }' ),
      [ { } ] )
    // Next consider _X_ |- { A A }, which should pass also
    checkSolutions(
      [
        makePattern( '_X_' )
      ],
      makeExpression( '{ A A }' ),
      [ { 'X' : 'A' } ] )
    // Next consider _X_, _Y_ |- { A B }, which should pass in 2 ways
    checkSolutions(
      [
        makePattern( '_X_' ),
        makePattern( '_Y_' )
      ],
      makeExpression( '{ A B }' ),
      [
        { 'X' : 'A', 'Y' : 'B' },
        { 'X' : 'B', 'Y' : 'A' }
      ] )
    // Next consider _X_, _X_ |- { A B }, which should not pass
    checkSolutions(
      [
        makePattern( '_X_' ),
        makePattern( '_X_' )
      ],
      makeExpression( '{ A B }' ),
      [ ]
    )
  } )

  test( 'Correctly uses the LI and DI rules in matching', () => {
    // First consider Let{ x P } |- Let{ x P }, which should pass, w/o metavars
    // (Then check the exact same thing for Declare{ ... })
    checkSolutions(
      [
        makeExpression( 'Let{ x P }' )
      ],
      makeExpression( 'Let{ x P }' ),
      [ { } ]
    )
    checkSolutions(
      [
        makeExpression( 'Declare{ x P }' )
      ],
      makeExpression( 'Declare{ x P }' ),
      [ { } ]
    )
    // Next check to be sure it works with metavariables in a simple way:
    // Let{ _x_ _P_ } |- Let{ y Q } works with x=y, P=Q.
    // (Then check the exact same thing for Declare{ ... })
    checkSolutions(
      [
        makePattern( 'Let{ _x_ _P_ }' )
      ],
      makeExpression( 'Let{ y Q }' ),
      [ { 'x' : 'y', 'P' : 'Q' } ]
    )
    checkSolutions(
      [
        makePattern( 'Declare{ _x_ _P_ }' )
      ],
      makeExpression( 'Declare{ y Q }' ),
      [ { 'x' : 'y', 'P' : 'Q' } ]
    )
    // Next check to be sure it works with metavariables in a nontrivial way:
    // Let{ a _P_(a) } |- Let{ a Q(a) } works with P=Q.
    // (Then check the exact same thing for Declare{ ... })
    checkSolutions(
      [
        makePattern( 'Let{ a _P_(a) }' )
      ],
      makeExpression( 'Let{ a Q(a) }' ),
      [ { 'P' : 'Q' } ]
    )
    checkSolutions(
      [
        makePattern( 'Declare{ a _P_(a) }' )
      ],
      makeExpression( 'Declare{ a Q(a) }' ),
      [ { 'P' : 'Q' } ]
    )
    // Next check to be sure it works with metavariables when there are many
    // variables being declared at once and some other deduction is required:
    // Let{ _X_ _Y_ P(_X_,_Y_) } |- Let{ a b P(a,b) } works with X=a,Y=b.
    // (Then check the exact same thing for Declare{ ... })
    checkSolutions(
      [
        makePattern( 'Let{ _X_ _Y_ P(_X_,_Y_) }' )
      ],
      makeExpression( 'Let{ a b P(a,b) }' ),
      [ { 'X' : 'a', 'Y' : 'b' } ]
    )
    checkSolutions(
      [
        makePattern( 'Declare{ _X_ _Y_ P(_X_,_Y_) }' )
      ],
      makeExpression( 'Declare{ a b P(a,b) }' ),
      [ { 'X' : 'a', 'Y' : 'b' } ]
    )
    // Next check to be sure it knows when to fail because of metavariables:
    // Let{ a and(_P_,_P_) } |- Let{ a and(Q,R) } should fail.
    // (Then check the exact same thing for Declare{ ... })
    checkSolutions(
      [
        makePattern( 'Let{ a and(_P_,_P_) }' )
      ],
      makeExpression( 'Let{ a and(Q,R) }' ),
      [ ]
    )
    checkSolutions(
      [
        makePattern( 'Declare{ a and(_P_,_P_) }' )
      ],
      makeExpression( 'Declare{ a and(Q,R) }' ),
      [ ]
    )
  } )

  test( 'Correctly uses the GL rule in matching', () => {
    // First consider { :R Q }, R |- Q, which works without metavariables
    checkSolutions(
      [
        makeExpression( '{ :R Q }' ),
        makeExpression( 'R' )
      ],
      makeExpression( 'Q' ),
      [ { } ]
    )
    // Next consider { :_P_ Q }, R |- Q, which works with P=R only
    checkSolutions(
      [
        makePattern( '{ :_P_ Q }' ),
        makeExpression( 'R' )
      ],
      makeExpression( 'Q' ),
      [ { 'P' : 'R' } ]
    )
    // Next consider { :_P1_ _P2_ }, R |- Q, which works with P1=R,P2=Q only
    checkSolutions(
      [
        makePattern( '{ :_P1_ _P2_ }' ),
        makeExpression( 'R' )
      ],
      makeExpression( 'Q' ),
      [ { 'P1' : 'R', 'P2' : 'Q' } ]
    )
  } )

  test( 'Correctly uses the CL rule in matching', () => {
    // First consider { R Q } |- R and { R Q } |- Q,
    // both of which work without metavariables
    checkSolutions(
      [
        makeExpression( '{ R Q }' )
      ],
      makeExpression( 'R' ),
      [ { } ]
    )
    checkSolutions(
      [
        makeExpression( '{ R Q }' )
      ],
      makeExpression( 'Q' ),
      [ { } ]
    )
    // Next consider { _A_ B } |- Q, which works with A=Q only
    checkSolutions(
      [
        makePattern( '{ _A_ B }' )
      ],
      makeExpression( 'Q' ),
      [ { 'A' : 'Q' } ]
    )
    // Next consider { _A_ _B_(x) } |- Q(x), which works two ways: A=Q(x) or B=Q
    checkSolutions(
      [
        makePattern( '{ _A_ _B_(x) }' )
      ],
      makeExpression( 'Q(x)' ),
      [
        { 'A' : 'Q(x)' },
        { 'B' : 'Q' }
      ]
    )
  } )

  test( 'Correctly uses rules in combination, with matching', () => {
    // First consider _X_ |- { :{ } A }, which should pass in exactly one way
    checkSolutions(
      [
        makePattern( '_X_' )
      ],
      makeExpression( '{ :{ } A }' ),
      [
        { 'X' : 'A' }
      ]
    )
    // Next consider _P_, Let{ _x_ _P_(_x_) } |- { Let{ z Q(z) } Q },
    // which should pass in the way you'd expect, with x=z and P=Q.
    checkSolutions(
      [
        makePattern( '_P_' ),
        makePattern( 'Let{ _x_ _P_(_x_) }' )
      ],
      makeExpression( '{ Let{ z Q(z) } Q }' ),
      [ { 'x' : 'z', 'P' : 'Q' } ]
    )
    // Next consider
    // { :P(_X_) P(S(_X_)) }, Let{ _x_ P(_x_) } |- Let{ t P(S(t)) },
    // which should pass with x=t.
    checkSolutions(
      [
        makePattern( '_P_' ),
        makePattern( 'Let{ _x_ _P_(_x_) }' )
      ],
      makeExpression( '{ Let{ z Q(z) } Q }' ),
      [ { 'x' : 'z', 'P' : 'Q' } ]
    )
    // Next consider { _A_ _B_ } |- { }, which can work by the T rule only
    checkSolutions(
      [
        makePattern( '{ _A_ _B_ }' )
      ],
      makeExpression( '{ }' ),
      [ { } ]
    )
    // Next consider { :imp(_A_,_B_) :_A_ _B_ }, imp(P,Q), P |- Q
    checkSolutions(
      [
        makePattern( '{ :imp(_A_,_B_) { :_A_ _B_ } }' ),
        makeExpression( 'imp(P,Q)' ),
        makeExpression( 'P' )
      ],
      makeExpression( 'Q' ),
      [ { 'A' : 'P', 'B' : 'Q' } ]
    )
    // Also, consider:
    // { :or(_A_,_B_) { :imp(_A_,_C_) { :imp(_B_,_C_) _C_ } } }, imp(yo,dude),
    // imp(hey,dude), or(hey,yo) |- dude
    checkSolutions(
      [
        makePattern( '{ :or(_A_,_B_) :imp(_A_,_C_) :imp(_B_,_C_) _C_ }' ),
        makeExpression( 'imp(yo,dude)' ),
        makeExpression( 'imp(hey,dude)' ),
        makeExpression( 'or(hey,yo)' )
      ],
      makeExpression( 'dude' ),
      [ { 'A' : 'hey', 'B' : 'yo', 'C' : 'dude' } ]
    )
    // And for a large example, it fails if we do not ask it to "work both ways"
    // (meaning not just working backwards from the conclusion):
    // or(a,and(b,c)), not(a),
    //   { :or(_X1_,_Y1_) :not(_X1_) _Y1_ }, { :and(_X2_,_Y2_) _X2_ } |- b
    checkSolutions(
      [
        makeExpression( 'or(a,and(b,c))' ),
        makeExpression( 'not(a)' ),
        makePattern( '{ :or(_X1_,_Y1_) :not(_X1_) _Y1_ }' ),
        makePattern( '{ :and(_X2_,_Y2_) _X2_ }' )
      ],
      makeExpression( 'b' ),
      [ ]
    )
    // But the same example succeeds if we do have it "work both ways":
    checkSolutions(
      [
        makeExpression( 'or(a,and(b,c))' ),
        makeExpression( 'not(a)' ),
        makePattern( '{ :or(_X1_,_Y1_) :not(_X1_) _Y1_ }' ),
        makePattern( '{ :and(_X2_,_Y2_) _X2_ }' )
      ],
      makeExpression( 'b' ),
      [ { 'X1' : 'a', 'Y1' : 'and(b,c)', 'X2' : 'b', 'Y2' : 'c' } ],
      { workBothWays : true }
    )
  } )

} )
