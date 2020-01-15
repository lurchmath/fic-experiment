
// Tests which LCs in a hierarchy count as conclusions

// import expect.js
let expect = require( 'expect.js' )

// import relevant classes
const { LC, Statement, Environment } = require( '../classes/all.js' )

suite( 'Conclusions', () => {

  let A = LC.fromString( 'A' )
  let B = LC.fromString( 'B' )
  let C = LC.fromString( 'C' )
  let D = LC.fromString( 'D' )
  let _A = LC.fromString( ':A' )
  let _B = LC.fromString( ':B' )
  let _C = LC.fromString( ':C' )
  let _D = LC.fromString( ':D' )
  let E = ( ...args ) => new Environment( ...args )
  let _E = ( ...args ) => {
    let result = E( ...args )
    result.isAGiven = true
    return result
  }

  test( 'In { A B }, both A and B are conclusions', () => {
    let X = E( A, B )
    expect( X.toString() ).to.be( '{ A B }' )
    let Y = X.conclusions()
    expect( Y ).to.have.length( 2 )
    expect( Y ).to.contain( A )
    expect( Y ).to.contain( B )
    expect( A.isAConclusionIn( C ) ).to.be( true )
    expect( B.isAConclusionIn( C ) ).to.be( true )
  } )

  test( 'In :{ A B }, both A and B are conclusions', () => {
    let X = _E( A, B )
    expect( X.toString() ).to.be( ':{ A B }' )
    let Y = X.conclusions()
    expect( Y ).to.have.length( 2 )
    expect( Y ).to.contain( A )
    expect( Y ).to.contain( B )
    expect( A.isAConclusionIn( X ) ).to.be( true )
    expect( B.isAConclusionIn( X ) ).to.be( true )
  } )

  test( 'In :{ :A B }, just B is a conclusion', () => {
    let X = _E( _A, B )
    expect( X.toString() ).to.be( ':{ :A B }' )
    let Y = X.conclusions()
    expect( Y ).to.have.length( 1 )
    expect( Y ).to.contain( B )
    expect( _A.isAConclusionIn( X ) ).to.be( false )
    expect( B.isAConclusionIn( X ) ).to.be( true )
  } )

  test( 'In :{ A :B }, just A is a conclusion', () => {
    let X = _E( A, _B )
    expect( X.toString() ).to.be( ':{ A :B }' )
    let Y = X.conclusions()
    expect( Y ).to.have.length( 1 )
    expect( Y ).to.contain( A )
    expect( A.isAConclusionIn( X ) ).to.be( true )
    expect( _B.isAConclusionIn( X ) ).to.be( false )
  } )

  test( 'In :{ :A :B }, there are no conclusions', () => {
    let X = _E( _A, _B )
    expect( X.toString() ).to.be( ':{ :A :B }' )
    let Y = X.conclusions()
    expect( Y ).to.be.empty()
    expect( _A.isAConclusionIn( X ) ).to.be( false )
    expect( _B.isAConclusionIn( X ) ).to.be( false )
  } )

  test( 'In { { A } }, just A is a conclusion', () => {
    let X = E( E( A ) )
    expect( X.toString() ).to.be( '{ { A } }' )
    let Y = X.conclusions()
    expect( Y ).to.have.length( 1 )
    expect( Y ).to.contain( A )
    expect( A.isAConclusionIn( X ) ).to.be( true )
    expect( A.parent().isAConclusionIn( X ) ).to.be( false )
  } )

  test( 'In { :{ A } }, there are no conclusions', () => {
    let X = E( _E( A ) )
    expect( X.toString() ).to.be( '{ :{ A } }' )
    let Y = X.conclusions()
    expect( Y ).to.be.empty()
    expect( A.isAConclusionIn( X ) ).to.be( false )
    expect( A.parent().isAConclusionIn( X ) ).to.be( false )
  } )

  test( 'In { { :A } }, there are no conclusions', () => {
    let X = E( E( _A ) )
    expect( X.toString() ).to.be( '{ { :A } }' )
    let Y = X.conclusions()
    expect( Y ).to.be.empty()
    expect( _A.isAConclusionIn( X ) ).to.be( false )
    expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
  } )

  test( 'In { { :A B } }, just B is a conclusion', () => {
    let X = E( E( _A, B ) )
    expect( X.toString() ).to.be( '{ { :A B } }' )
    let Y = X.conclusions()
    expect( Y ).to.have.length( 1 )
    expect( Y ).to.contain( B )
    expect( _A.isAConclusionIn( X ) ).to.be( false )
    expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
    expect( B.isAConclusionIn( X ) ).to.be( true )
  } )

  test( 'In { { :A B } C }, both B and C are a conclusions', () => {
    let X = E( E( _A, B ), C )
    expect( X.toString() ).to.be( '{ { :A B } C }' )
    let Y = X.conclusions()
    expect( Y ).to.have.length( 2 )
    expect( Y ).to.contain( B )
    expect( Y ).to.contain( C )
    expect( _A.isAConclusionIn( X ) ).to.be( false )
    expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
    expect( B.isAConclusionIn( X ) ).to.be( true )
    expect( C.isAConclusionIn( X ) ).to.be( true )
  } )

  test( 'In { :{ :A B } C }, just C is a conclusion', () => {
    let X = E( _E( _A, B ), C )
    expect( X.toString() ).to.be( '{ :{ :A B } C }' )
    let Y = X.conclusions()
    expect( Y ).to.have.length( 1 )
    expect( Y ).to.contain( C )
    expect( _A.isAConclusionIn( X ) ).to.be( false )
    expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
    expect( B.isAConclusionIn( X ) ).to.be( false )
    expect( C.isAConclusionIn( X ) ).to.be( true )
  } )

  test( 'In { { { :A B } :{ :C D } } :D }, just B is a conclusion', () => {
    let X = E( E( E( _A, B ), _E( _C, D ) ), _D )
    expect( X.toString() ).to.be( '{ { { :A B } :{ :C D } } :D }' )
    let Y = X.conclusions()
    expect( Y ).to.have.length( 1 )
    expect( Y ).to.contain( B )
    expect( _A.isAConclusionIn( X ) ).to.be( false )
    expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
    expect( B.isAConclusionIn( X ) ).to.be( true )
    expect( _C.isAConclusionIn( X ) ).to.be( false )
    expect( _C.parent().isAConclusionIn( X ) ).to.be( false )
    expect( D.isAConclusionIn( X ) ).to.be( false )
    expect( _D.isAConclusionIn( X ) ).to.be( false )
  } )

  test( 'In { { :{ :A B } { C :D } } D }, both C and D are conclusions', () => {
    let X = E( E( _E( _A, B ), E( C, _D ) ), D )
    expect( X.toString() ).to.be( '{ { :{ :A B } { C :D } } D }' )
    let Y = X.conclusions()
    expect( Y ).to.have.length( 2 )
    expect( Y ).to.contain( C )
    expect( Y ).to.contain( D )
    expect( _A.isAConclusionIn( X ) ).to.be( false )
    expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
    expect( B.isAConclusionIn( X ) ).to.be( false )
    expect( C.isAConclusionIn( X ) ).to.be( true )
    expect( C.parent().isAConclusionIn( X ) ).to.be( false )
    expect( _D.isAConclusionIn( X ) ).to.be( false )
    expect( D.isAConclusionIn( X ) ).to.be( true )
  } )

} )
