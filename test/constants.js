
// Tests what can be declarations

// import expect.js
let expect = require( 'expect.js' )

// import relevant classes
const { LC, Statement, Environment } = require( '../classes/all.js' )

suite( 'Constant Declarations', () => {

  test( `The constant in { Declare{ c { d e } } c d } is the second c`, () => {
    let E = lc( '{ Declare{ c { d e } } c d }' )
    E.markAll()
    expect( E.constants().length).to.be(1)
    expect( E.child(3).isAnActualConstant() ).to.be( false )
    expect( E.constants()[0] ).to.be( E.child(2) )
  } )

  test( `The LC { Declare{ c { c d e } } d } has a constant c in its EE only`,
    () => {
    let E = lc( '{ Declare{ c { c d e } } d }' )
    E.markAll()
    expect( E.constants().length).to.be(1)
    expect( E.constants()[0] ).to.be( E.child(0,1,0) )
  } )

  test( `The LC { :Declare{ c { } } f(g(c),c) } has two constants c inside the statement`,
    () => {
    let E = lc( '{ :Declare{ c { } } f(g(c),c) }' )
    E.markAll()
    expect( E.constants().length).to.be(2)
    expect( E.constants()[0] ).to.be( E.child(1,0,0) )
    expect( E.constants()[1] ).to.be( E.child(1,1) )
  } )

  test( `The LC { Declare{ c d { } } { :a c d b } c } has constants c, d and c`,
    () => {
    let E = lc( '{ Declare{ c d { } } { :a c d b } c }' )
    E.markAll()
    expect( E.constants().length).to.be(3)
    expect( E.constants()[0] ).to.be( E.child(1,1) )
    expect( E.constants()[1] ).to.be( E.child(1,2) )
    expect( E.constants()[2] ).to.be( E.child(2) )
  } )

  test( `Constants declared with empty body can be optionally ignorned`,
    () => {
    let E = lc( '{ Declare{ c { } } c }' )
    E.markAll()
    expect( E.constants().length).to.be(1)
    expect( E.child(1).isAnActualConstant() ).to.be( true )
    expect( E.constants(true).length).to.be(0)
    expect( E.child(1).isAnActualConstant(true) ).to.be( false )
  } )

  test( `The Let declaration { Let{ x { } } x } does not declare constants `, () => {
    let E = lc( '{ Let{ x { } } x }' )
    E.markAll()
    expect( E.constants().length).to.be(0)
    expect( E.constants(true).length).to.be(0)
  } )

  test( `The Let declaration { Let{ x { P(x) } } x } does not declare constants `, () => {
    let E = lc( '{ Let{ x { } } x }' )
    E.markAll()
    expect( E.constants().length).to.be(0)
    expect( E.constants(true).length).to.be(0)
  } )

  test( `Identifiers inside a declaration are bound and declared by the declaration itself`, () => {
    let E = lc( '{ Let{ x y { f(x,y) } } Declare{ c d { G(x,y,c,d) } } }' )
    E.markAll()
    // E.show({ Color: true, EEs:true, Indent:true, Bound:true })
    // E should contain two EEs, one with two constants
    expect( E.constants().length).to.be(2)
    // check everything inside the Let
    expect( E.child(2,0).isBound() ).to.be( true )
    expect( E.child(2,1).isBound() ).to.be( true )
    expect( E.child(2,2,0).isBound() ).to.be( false )
    expect( E.child(2,2,0,0).isBound() ).to.be( true )
    expect( E.child(2,2,0,1).isBound() ).to.be( true )
    // check everything inside the Declare
    expect( E.child(3,0).isBound() ).to.be( true )
    expect( E.child(3,1).isBound() ).to.be( true )
    expect( E.child(3,2,0).isBound() ).to.be( false )
    expect( E.child(3,2,0,0).isBound() ).to.be( false )
    expect( E.child(3,2,0,1).isBound() ).to.be( false )
    expect( E.child(3,2,0,2).isBound() ).to.be( true )
    expect( E.child(3,2,0,3).isBound() ).to.be( true )
  } )

  test( `The body of a constant declaration is accessible in its scope`, () => {
    let E = lc( '{ :Declare{ c { :A P(c) } } :A P(c) }' )
    let V = E.Validate()
    expect( E.constants().length).to.be(2)
    expect( V ).to.be( true )
  } )

  test( `The body of a variable declaration is accessible in its scope`, () => {
    let E = lc( '{ :Let{ x { :A P(x) } } :A P(x) }' )
    let V = E.Validate()
    expect( E.constants().length ).to.be(0)
    expect( V ).to.be( true )
  } )

} )
