
// Tests FIC derivation definition in deduction.js

// import expect.js
let expect = require( 'expect.js' )

// import relevant classes and the deduction routine
const {
  LC, Statement, Environment, derives, iterateHowToDerive, generatorToArray
} = require( '../classes/all.js' )

suite( 'FIC Derivation', () => {

  let check = ( ...LCs ) => derives( ...LCs.map( lc => LC.fromString( lc ) ) )
  let checking = ( ...LCs ) => () => check( ...LCs )

  test( 'Verify that the S rule alone works (A |- A)', () => {
    expect( check( 'A', 'A' ) ).to.be( true )
    expect( check( 'A(x)', 'A(x)' ) ).to.be( true )
    expect( check( '~t(2,5)', '~t(2,5)' ) ).to.be( true )
    expect( check( '{ 1 2 3 { 4 } }', '{ 1 2 3 { 4 } }' ) ).to.be( true )
  } )

  test( 'One statement cannot derive a different statement (A |-/- B)', () => {
    expect( check( 'A', 'B' ) ).to.be( false )
    expect( check( 'A(x)', 'B(y)' ) ).to.be( false )
    expect( check( '~t(2,5)', 't(2,5)' ) ).to.be( false )
  } )

  test( 'Verify the T rule: anything derives the "true" constant, { }', () => {
    expect( check( '{ }' ) ).to.be( true )
    expect( check( 'X', 'Y', 'Z', '{ }' ) ).to.be( true )
    expect( check( '{ }', '{ }' ) ).to.be( true )
    expect( check( '{ things may go __here__ }', '{ }' ) ).to.be( true )
  } )

  test( 'But nothing with actual content is derivable without premises', () => {
    expect( check( 'A' ) ).to.be( false )
    expect( check( '{A B C}' ) ).to.be( false )
    expect( check( '{{A}{}{}}' ) ).to.be( false )
    expect( check( '{ f(t) g(t) h(t) }' ) ).to.be( false )
  } )

  test( 'Verify that the GR rule alone works (G |- {:A B} if G,A |- B)', () => {
    expect( check( 'B', '{:A B }' ) ).to.be( true )
    expect( check( 'K', '{:T K }' ) ).to.be( true )
    expect( check( '{ u v(w) }', '{:Lurch { u v(w) } }' ) ).to.be( true )
    expect( check( 'C', '{:A {} }' ) ).to.be( true )
  } )

  test( 'But slightly wrong uses of the GR rule fail', () => {
    expect( check( 'A', '{:A B }' ) ).to.be( false )
    expect( check( '{}', '{:T K }' ) ).to.be( false )
    expect( check( '{ u v(w) }', '{:Lurch { u v(v) } }' ) ).to.be( false )
    expect( check( 'C', '{:{} A C}' ) ).to.be( false )
  } )

  test( 'Verify that the GL rule alone works '
      + '(G,{:A B} |- C if G |- A and G,B |- C)', () => {
    expect( check( '{:{} Y}', 'Y' ) ).to.be( true )
    expect( check( '{:{} Y}', '{}' ) ).to.be( true )
    expect( check( 'g', '{:g c}', 'c' ) ).to.be( true )
  } )

  test( 'But slightly wrong uses of the GL rule fail', () => {
    expect( check( '{:{} Y}', 'Z' ) ).to.be( false )
    expect( check( '{:Y {}}', 'Y' ) ).to.be( false )
    expect( check( 'g', '{:c g}', 'c' ) ).to.be( false )
    expect( check( 'g', '{ {:g c} c }' ) ).to.be( false )
  } )

  test( 'Verify that the CR rule alone works '
      + '(G |- {A B} if G |- A and G |- B)', () => {
    expect( check( 'A', 'B', '{A B}' ) ).to.be( true )
    expect( check( '{A}', 'B', '{{A} B}' ) ).to.be( true )
    expect( check( 'u(t)', 'pow(2,10)', '{pow(2,10) u(t)}' ) ).to.be( true )
    expect( check( 'B', '{B B}' ) ).to.be( true )
    expect( check( 'B', '{{} B}' ) ).to.be( true )
    expect( check( 'B', '{B {}}' ) ).to.be( true )
    expect( check( '{{} {}}' ) ).to.be( true )
  } )

  test( 'But slightly wrong uses of the CR rule fail', () => {
    expect( check( 'A', 'A', '{A B}' ) ).to.be( false )
    expect( check( 'A', 'B', '{A ~B}' ) ).to.be( false )
    expect( check( 'u(2)', 'pow(t,10)', '{pow(2,10) u(t)}' ) ).to.be( false )
    expect( check( 'B1', '{B B}' ) ).to.be( false )
    expect( check( 'B', '{{A} B}' ) ).to.be( false )
  } )

  test( 'Verify that the CL rule alone works '
      + '(G,{A B} |- C if G,A,B |- C)', () => {
    expect( check( '{A B}', 'A' ) ).to.be( true )
    expect( check( '{A B}', 'B' ) ).to.be( true )
    expect( check( '{A A}', 'A' ) ).to.be( true )
    expect( check( '{A A}', '{}' ) ).to.be( true )
    expect( check( 'X', '{A B}', 'X' ) ).to.be( true )
    expect( check( '{A B}', 'X', 'X' ) ).to.be( true )
  } )

  test( 'But slightly wrong uses of the CL rule fail', () => {
    expect( check( '{A B}', 'C' ) ).to.be( false )
    expect( check( '{:A B}', 'B' ) ).to.be( false )
    expect( check( '{A A}', '~A' ) ).to.be( false )
    expect( check( 'X', '{A B}', 'C' ) ).to.be( false )
  } )

  test( 'We can verify multi-step derivations using multiple rules', () => {
    expect( check( '{A B}', '{B A}' ) ).to.be( true )
    expect( check( '{:A B}', '{:A B}' ) ).to.be( true )
    expect( check( '{A B}', '{:A B}' ) ).to.be( true )
    expect( check( 'alive', '{ :alive not(dead) }', 'extraneous',
                   'not(dead)' ) ).to.be( true )
    expect( check( 'x', '{x x x x x {} {} {} {} {}}' ) ).to.be( true )
    expect( check( 'per', 'mute', 'these', '{mute per per these}' ) )
      .to.be( true )
    expect( check( '{:A :B :C D}', '{:X B}', 'C', '{X A}', '{D D}' ) )
      .to.be( true )
  } )

  test( 'But things that don\'t actually hold get marked invalid', () => {
    expect( check( ':{A B}', '{A B}' ) ).to.be( true )
    expect( check( 'alive', '{ :alive not(dead) }',
                   'completely_unrelated' ) ).to.be( false )
    expect( check( 'x', '{x x x x y {} {} {} {} {}}' ) ).to.be( false )
    expect( check( '{}', '{x x x x x {} {} {} {} {}}' ) ).to.be( false )
    expect( check( 'per', 'mute', 'these', '{mute per HI these}' ) )
      .to.be( false )
    expect( check( '{:A :B :C D}', '{:X C}', 'C', '{X A}', '{D D}' ) )
      .to.be( false )
  } )

  test( 'And some invalid questions throw errors', () => {
    expect( () => derives( 'X', 'X' ) ).to.throwException( /only LC instances/ )
    expect( checking( '{A B}', ':{B A}' ) ).to.throwException( /be a claim/ )
  } )

} )

// In all the tests below, we adopt the convention that variable names of the
// form _A_ are shorthand for a variable named A that is marked as a
// metavariable.
suite( 'FIC Derivation with matching', () => {

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
    expect( solution ).to.have.length( Object.keys( stringMapping ).length )
    for ( let pair of solution ) {
      let metavarName = pair.pattern.toString()
      let shouldEqual = pair.expression.toString()
      expect( shouldEqual ).to.be( stringMapping[metavarName] )
    }
  }

  let sameSolution = ( sol1, sol2 ) => {
    if ( sol1.length != sol2.length ) return false
    for ( let i = 0 ; i < sol1.length ; i++ ) {
      let pair = sol1[i]
      let match = sol2.find( otherPair =>
        otherPair.pattern.toString() == pair.pattern.toString() )
      if ( !match ) return false
      if ( pair.expression.toString() != match.expression.toString() )
        return false
    }
    return true
  }

  let uniqueSolutions = ( matchingProblems ) => {
    let result = [ ]
    matchingProblems.map( mp => {
      mp.getSolutions().map( sol => {
        if ( !result.find( other => sameSolution( sol, other ) ) )
          result.push( sol )
      } )
    } )
    return result
  }

  let checkSolutions = ( matchingProblems, stringMappings ) => {
    let allSolutions = uniqueSolutions( matchingProblems )
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
    expect( allSolutions ).to.have.length( stringMappings.length )
    for ( let i = 0 ; i < allSolutions.length ; i++ )
      checkSolution( allSolutions[i], stringMappings[i] )
  }

  let checkDerivation = ( Gamma, conclusion, stringMappings ) =>
    checkSolutions( generatorToArray( iterateHowToDerive( Gamma, conclusion ) ),
                    stringMappings )

  test( 'Has all the functions needed for derivation with matching', () => {
    expect( iterateHowToDerive ).to.be.ok()
    expect( generatorToArray ).to.be.ok()
  } )

  test( 'Correctly uses the T rule in matching', () => {
    // any pile of stuff on the left, with or without metavariables, ought to
    // give a positive answer to |- { } without any instantiations needed
    // example 1:
    checkDerivation(
      [ ],
      makeExpression( '{ }' ),
      [
        { }
      ] )
    // example 2:
    checkDerivation(
      [ makePattern( '{ A B }' ) ],
      makeExpression( '{ }' ),
      [
        { }
      ] )
    // example 3:
    checkDerivation(
      [ makePattern( '_A_(_B_,_C_)' ), makePattern( 'not(a,metavar)' ) ],
      makeExpression( '{ }' ),
      [
        { }
      ] )
  } )

  test( 'Correctly uses the S rule in matching', () => {
    // First consider A |- A, which should pass, no metavariables present
    checkDerivation(
      [ makePattern( 'A' ) ],
      makeExpression( 'A' ),
      [
        { }
      ] )
    // Next consider _A_ |- A, which should pass as well
    checkDerivation(
      [ makePattern( '_A_' ) ],
      makeExpression( 'A' ),
      [
        { 'A' : 'A' }
      ] )
    // Next consider _X_ |- A, which should pass as well
    checkDerivation(
      [ makePattern( '_X_' ) ],
      makeExpression( 'A' ),
      [
        { 'X' : 'A' }
      ] )
    // Next consider _X_, _Y_ |- A, which should pass in two different ways
    checkDerivation(
      [ makePattern( '_X_' ), makePattern( '_Y_' ) ],
      makeExpression( 'A' ),
      [
        { 'X' : 'A' },
        { 'Y' : 'A' }
      ] )
    // Next consider _X_(_Y_) |- A, which should fail
    checkDerivation(
      [ makePattern( '_X_(_Y_)' ) ],
      makeExpression( 'A' ),
      [ ] )
  } )

  test( 'Correctly uses the GR rule in matching', () => {
    // First consider |- { :A A }, which should pass, no metavariables present
    checkDerivation(
      [ ],
      makeExpression( '{ :A A }' ),
      [
        { }
      ] )
    // Next consider |- { :_X_ A }, which should pass also
    checkDerivation(
      [ ],
      makePattern( '{ :_X_ A }' ),
      [
        { 'X' : 'A' }
      ] )
    // Next consider |- { :_X_ { :_Y_ A } }, which should pass in 2 ways
    checkDerivation(
      [ ],
      makePattern( '{ :_X_ { :_Y_ A } }' ),
      [
        { 'X' : 'A' },
        { 'Y' : 'A' }
      ] )
  } )

  test( 'Correctly uses the CR rule in matching', () => {
    // First consider A |- { A A }, which should pass, no metavariables present
    checkDerivation(
      [ makeExpression( 'A' ) ],
      makeExpression( '{ A A }' ),
      [
        { }
      ] )
    // Next consider _X_ |- { A A }, which should pass also
    checkDerivation(
      [ makePattern( '_X_' ) ],
      makeExpression( '{ A A }' ),
      [
        { 'X' : '{ A A }' },
        { 'X' : 'A' }
      ] )
    // Next consider _X_, _Y_ |- { A B }, which should pass in 4 ways
    checkDerivation(
      [ makePattern( '_X_' ), makePattern( '_Y_' ) ],
      makeExpression( '{ A B }' ),
      [
        { 'X' : '{ A B }' },
        { 'Y' : '{ A B }' },
        { 'X' : 'A', 'Y' : 'B' },
        { 'X' : 'B', 'Y' : 'A' }
      ] )
    // Next consider _X_, _X_ |- { A B }, which should pass in 1 way
    checkDerivation(
      [ makePattern( '_X_' ), makePattern( '_X_' ) ],
      makeExpression( '{ A B }' ),
      [
        { 'X' : '{ A B }' }
      ] )
  } )

  test( 'Correctly uses the LI and DI rules in matching', () => {
    // First consider Let{ x P } |- Let{ x P }, which should pass, w/o metavars
    // (Then check the exact same thing for Declare{ ... })
    checkDerivation(
      [ makeExpression( 'Let{ x P }' ) ],
      makeExpression( 'Let{ x P }' ),
      [
        { }
      ] )
    checkDerivation(
      [ makeExpression( 'Declare{ x P }' ) ],
      makeExpression( 'Declare{ x P }' ),
      [
        { }
      ] )
    // Next check to be sure it works with metavariables in a simple way:
    // Let{ _x_ _P_ } |- Let{ y Q } works with x=y, P=Q.
    // (Then check the exact same thing for Declare{ ... })
    checkDerivation(
      [ makePattern( 'Let{ _x_ _P_ }' ) ],
      makeExpression( 'Let{ y Q }' ),
      [
        { 'x' : 'y', 'P' : 'Q' }
      ] )
    checkDerivation(
      [ makePattern( 'Declare{ _x_ _P_ }' ) ],
      makeExpression( 'Declare{ y Q }' ),
      [
        { 'x' : 'y', 'P' : 'Q' }
      ] )
    // Next check to be sure it works with metavariables in a nontrivial way:
    // Let{ a _P_(a) } |- Let{ a Q(a) } works with P=Q.
    // (Then check the exact same thing for Declare{ ... })
    checkDerivation(
      [ makePattern( 'Let{ a _P_(a) }' ) ],
      makeExpression( 'Let{ a Q(a) }' ),
      [
        { 'P' : 'Q' }
      ] )
    checkDerivation(
      [ makePattern( 'Declare{ a _P_(a) }' ) ],
      makeExpression( 'Declare{ a Q(a) }' ),
      [
        { 'P' : 'Q' }
      ] )
    // Next check to be sure it knows when to fail because of metavariables:
    // Let{ a and(_P_,_P_) } |- Let{ a and(Q,R) } should fail.
    // (Then check the exact same thing for Declare{ ... })
    checkDerivation(
      [ makePattern( 'Let{ a and(_P_,_P_) }' ) ],
      makeExpression( 'Let{ a and(Q,R) }' ),
      [ ] )
    checkDerivation(
      [ makePattern( 'Declare{ a and(_P_,_P_) }' ) ],
      makeExpression( 'Declare{ a and(Q,R) }' ),
      [ ] )
  } )

  test( 'Correctly uses the GL rule in matching', () => {
    // First consider { :R Q }, R |- Q, which works without metavariables
    checkDerivation(
      [ makeExpression( '{ :R Q }' ), makeExpression( 'R' ) ],
      makeExpression( 'Q' ),
      [
        { }
      ] )
    // Next consider { :_P_ Q }, R |- Q, which works with P=R only
    checkDerivation(
      [ makePattern( '{ :_P_ Q }' ), makeExpression( 'R' ) ],
      makeExpression( 'Q' ),
      [
        { 'P' : 'R' }
      ] )
    // Next consider { :_P1_ _P2_ }, R |- Q, which works with P1=R,P2=Q only
    checkDerivation(
      [ makePattern( '{ :_P1_ _P2_ }' ), makeExpression( 'R' ) ],
      makeExpression( 'Q' ),
      [
        { 'P1' : 'R', 'P2' : 'Q' }
      ] )
  } )

  test( 'Correctly uses the CL rule in matching', () => {
    // First consider { R Q } |- R and { R Q } |- Q,
    // both of which work without metavariables
    checkDerivation(
      [ makeExpression( '{ R Q }' ) ],
      makeExpression( 'R' ),
      [
        { }
      ] )
    checkDerivation(
      [ makeExpression( '{ R Q }' ) ],
      makeExpression( 'Q' ),
      [
        { }
      ] )
    // Next consider { _A_ B } |- Q, which works with A=Q only
    checkDerivation(
      [ makePattern( '{ _A_ B }' ) ],
      makeExpression( 'Q' ),
      [
        { 'A' : 'Q' }
      ] )
    // Next consider { _A_ _B_(x) } |- Q(x), which works two ways:
    // A=Q(x) or B=Q
    checkDerivation(
      [ makePattern( '{ _A_ _B_(x) }' ) ],
      makeExpression( 'Q(x)' ),
      [
        { 'A' : 'Q(x)' },
        { 'B' : 'Q' }
      ] )
  } )

  test( 'Correctly uses rules in combination, with matching', () => {
    // First consider _X_ |- { :{ } A }, which should pass
    checkDerivation(
      [ makePattern( '_X_' ) ],
      makeExpression( '{ :{ } A }' ),
      [
        { 'X' : '{ :{  } A }' },
        { 'X' : 'A' }
      ] )
    // Next consider _P_, Let{ _x_ _P_(_x_) } |- { Let{ z Q(z) } Q },
    // which should pass in precisely 2 ways:
    // There's the way you'd expect, with x=z and P=Q,
    // plus the sledgehammer way, with P=the whole conclusion.
    checkDerivation(
      [ makePattern( '_P_' ), makePattern( 'Let{ _x_ _P_(_x_) }' ) ],
      makeExpression( '{ Let{ z Q(z) } Q }' ),
      [
        { 'P' : '{ Let{ z Q(z) } Q }' },
        { 'x' : 'z', 'P' : 'Q' }
      ] )
    // Next consider { _A_ _B_ } |- { }, which can work by the T rule with no
    // instantiation, or by letting either _A_ or _B_ be { }.
    checkDerivation(
      [ makePattern( '{ _A_ _B_ }' ) ],
      makeExpression( '{ }' ),
      [
        { },
        { 'A' : '{  }' },
        { 'B' : '{  }' }
      ] )
    // Next consider { :imp(_A_,_B_) :_A_ _B_ }, imp(P,Q), P |- Q
    checkDerivation(
      [ makePattern( '{ :imp(_A_,_B_) { :_A_ _B_ } }' ),
        makeExpression( 'imp(P,Q)' ), makeExpression( 'P' ) ],
      makeExpression( 'Q' ),
      [
        { 'A' : 'P', 'B' : 'Q' }
      ] )
    // Finally, consider:
    // { :or(_A_,_B_) { :imp(_A_,_C_) { :imp(_B_,_C_) _C_ } } }, imp(yo,dude),
    // imp(hey,dude), or(hey,yo) |- dude
    checkDerivation(
      [ makePattern( '{ :or(_A_,_B_) { :imp(_A_,_C_) { :imp(_B_,_C_) _C_ } } }' ),
        makeExpression( 'imp(yo,dude)' ), makeExpression( 'imp(hey,dude)' ),
        makeExpression( 'or(hey,yo)' ) ],
      makeExpression( 'dude' ),
      [
        { 'A' : 'hey', 'B' : 'yo', 'C' : 'dude' }
      ] )
  } )

} )
