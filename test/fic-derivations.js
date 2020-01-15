
// Tests FIC derivation definition in deduction.js

// import expect.js
let expect = require( 'expect.js' )

// import relevant classes and the deduction routine
const { LC, Statement, Environment, derives } = require( '../classes/all.js' )

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
    expect( check( ':{A B}', '{A B}' ) ).to.be( false )
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
