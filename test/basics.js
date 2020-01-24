
// Tests super simple foundational functionality

// import expect.js
let expect = require( 'expect.js' )

// import all classes defined in this repo
const { OM, Structure, LC, Statement, Environment } =
  require( '../classes/all.js' )

suite( 'Basics', () => {

  test( 'All important classes should be defined', () => {
    expect( OM ).to.be.ok()
    expect( Structure ).to.be.ok()
    expect( LC ).to.be.ok()
    expect( Statement ).to.be.ok()
    expect( Environment ).to.be.ok()
  } )

  test( 'We can construct instances of LC, Statement, Environment', () => {
    expect( new LC() ).to.be.ok()
    expect( new Statement() ).to.be.ok()
    expect( new Environment() ).to.be.ok()
  } )

  test( 'We can construct nested instances of the same classes', () => {
    expect( new LC( new LC() ) ).to.be.ok()
    expect( new LC( new LC(), new LC() ) ).to.be.ok()
    expect( new Statement( new Statement() ) ).to.be.ok()
    expect( new Statement( new Statement(), new Statement() ) ).to.be.ok()
    expect( new Environment( new Environment() ) ).to.be.ok()
    expect( new Environment( new Environment(), new Environment() ) ).to.be.ok()
    expect( new Environment( new Statement() ) ).to.be.ok()
    expect( new Statement( new Environment() ) ).to.be.ok()
  } )

  test( 'We can get good string versions of those same structures', () => {
    expect( ''+new LC( new LC() ) ).to.be( 'LC(LC())' )
    expect( ''+new LC( new LC(), new LC() ) ).to.be( 'LC(LC(),LC())' )
    expect( ''+new Statement( new Statement() ) ).to.be(
      'undefined(undefined)' )
    expect( ''+new Statement( new Statement(), new Statement() ) ).to.be(
      'undefined(undefined,undefined)' )
    expect( ''+new Environment( new Environment() ) ).to.be( '{ {  } }' )
    expect( ''+new Environment( new Environment(), new Environment() ) ).to.be(
      '{ {  } {  } }' )
    expect( ''+new Environment( new Statement() ) ).to.be( '{ undefined }' )
    // and the following one doesn't let the environment inside...
    expect( ''+new Statement( new Environment() ) ).to.be( 'undefined' )
    let R = new Statement()
    R.identifier = 'R'
    let S = new Statement()
    S.identifier = 'S'
    let T = new Statement( R, S )
    T.identifier = 'T'
    expect( ''+T ).to.be( 'T(R,S)' )
  } )

  test( 'By default, nothing should have an identifier/be a quantifier', () => {
    expect( new LC().identifier ).to.be( undefined )
    expect( new Statement().identifier ).to.be( undefined )
    expect( new Environment().identifier ).to.be( undefined )
    // only statements are quantifiers, so for a generic LC, it's undefined:
    expect( new LC().isAQuantifier ).to.be( undefined )
    // same for an environment:
    expect( new Environment().isAQuantifier ).to.be( undefined )
    // but for a statement, it's defined, but still false by default:
    expect( new Statement().isAQuantifier ).to.be( false )
  } )

  test( 'Given/claim status has correct default and can be edited', () => {
    let tmp = new LC()
    expect( tmp.isAGiven ).to.be( false )
    expect( tmp.isAClaim ).to.be( true )
    tmp.isAGiven = true
    expect( tmp.isAGiven ).to.be( true )
    expect( tmp.isAClaim ).to.be( false )
    tmp.isAClaim = true
    expect( tmp.isAGiven ).to.be( false )
    expect( tmp.isAClaim ).to.be( true )
  } )

  test( 'Nothing is a metavariable by default, but you can turn it on', () => {
    let tmp = new Statement()
    expect( tmp.isAMetavariable ).to.be( false )
    tmp.isAMetavariable = true
    expect( tmp.isAMetavariable ).to.be( true )
    tmp.isAMetavariable = false
    expect( tmp.isAMetavariable ).to.be( false )
  } )

  test( 'Identify actual Identifiers, actual Statements, and actual Declarations correctly.', () => {
    let lc = (s) => LC.fromString(s)
    expect(lc('{ }').isAnActualStatement() ).to.be( false )
    expect(lc('{ }').isAnActualIdentifier() ).to.be( false )
    expect(lc('{ }').isAnActualDeclaration() ).to.be( false )
    expect(lc('{ }').isAnActualEnvironment() ).to.be( true )
    expect(lc('{ A }').isAnActualStatement() ).to.be( false )
    expect(lc('{ A }').isAnActualIdentifier() ).to.be( false )
    expect(lc('{ A }').isAnActualDeclaration() ).to.be( false )
    expect(lc('{ A }').isAnActualEnvironment() ).to.be( true )
    expect(lc('A').isAnActualStatement() ).to.be( true )
    expect(lc('A').isAnActualIdentifier() ).to.be( true )
    expect(lc('A').isAnActualDeclaration() ).to.be( false )
    expect(lc('A').isAnActualEnvironment() ).to.be( false )
    expect(lc('P(x,y)').isAnActualStatement() ).to.be( true )
    expect(lc('P(x,y)').isAnActualIdentifier() ).to.be( false )
    expect(lc('P(x,y)').isAnActualDeclaration() ).to.be( false )
    expect(lc('P(x,y)').children()[0].isAnActualStatement() ).to.be( false )
    expect(lc('P(x,y)').children()[0].isAnActualIdentifier() ).to.be( true )
    expect(lc('P(x,y)').children()[0].isAnActualDeclaration() ).to.be( false )
    expect(lc('{ P(x,y) }').children()[0].isAnActualStatement() ).to.be( true )
    expect(lc('{ P(x,y) }').children()[0].isAnActualIdentifier() )
                           .to.be( false )
    expect(lc('{ P(x,y) }').children()[0].isAnActualDeclaration() )
                           .to.be( false )
    let D = lc('Declare{ x P(x,y) }')
    let L = lc('Let{ x P(x,y) }')
    expect( D.isAnActualStatement() ).to.be( false )
    expect( D.isAnActualIdentifier() ).to.be( false )
    expect( D.isAnActualDeclaration() ).to.be( true )
    expect( D.isAnActualEnvironment() ).to.be( false )
    expect( L.isAnActualStatement() ).to.be( false )
    expect( L.isAnActualIdentifier() ).to.be( false )
    expect( L.isAnActualDeclaration() ).to.be( true )
    expect( L.isAnActualEnvironment() ).to.be( false )
    expect( D.children()[0].isAnActualStatement() ).to.be( true )
    expect( D.children()[0].isAnActualIdentifier() ).to.be( true )
    expect( D.children()[0].isAnActualDeclaration() ).to.be( false )
    expect( L.children()[0].isAnActualStatement() ).to.be( true )
    expect( L.children()[0].isAnActualIdentifier() ).to.be( true )
    expect( L.children()[0].isAnActualDeclaration() ).to.be( false )
    expect( D.children()[1].isAnActualStatement() ).to.be( true )
    expect( D.children()[1].isAnActualIdentifier() ).to.be( false )
    expect( D.children()[1].isAnActualDeclaration() ).to.be( false )
    expect( L.children()[1].isAnActualStatement() ).to.be( true )
    expect( L.children()[1].isAnActualIdentifier() ).to.be( false )
    expect( L.children()[1].isAnActualDeclaration() ).to.be( false )

  } )



} )
