
// Tests the Turnstile database stored in the data/ subfolder

// import expect.js
let expect = require( 'expect.js' )

// import all classes defined in this repo
const ttdb = require( './data/turnstile-db' )

suite( 'Turnstile Test Database', () => {

  test( 'All expected members of the module exist', () => {
    expect( ttdb.size ).to.be.ok()
    expect( ttdb.getTest ).to.be.ok()
    expect( ttdb.setTest ).to.be.ok()
    expect( ttdb.addTest ).to.be.ok()
    expect( ttdb.Turnstile ).to.be.ok()
    expect( ttdb.TurnstileTest ).to.be.ok()
    expect( ttdb.LC ).to.be.ok()
  } )

  test( 'All turnstile tests in the database pass', function () {
    this.timeout( 0 )
    for ( let i = 0 ; i < ttdb.size() ; i++ ) {
      const T = ttdb.getTest( i )
      const result = T.turnstile.existsDerivation()
      try {
        expect( result ).to.be( T.result )
      } catch ( error ) {
        expect().fail( `On turnstile test ${i}, ${T.turnstile.toString()}\n`
                     + `\tComputed ${result} but test DB expected ${T.result}` )
      }
    }
  } )

} )
