
const { OM } = require( '../dependencies/openmath.js' )
const { LC, Statement, Environment } = require( '../classes/lc.js' )

let check = ( text ) => {
  try {
    var parsed = LC.fromString( text )
  } catch ( e ) {
    var parsed = `${e}`
  }
  console.log( `Parsed "${text}" to ${parsed}` )
}

check( 'A' )
check( '{}' )
check( '{   }' )
check( '{ A  }' )
check( '{ B A  }' )
check( '[ { X } { 2 } ]')
check( '[ [ A ] ]')
check( 'A(x,y)' )
check( ':A' )
check( '~A' )
check( '~:A' )
check( ':~A' )
check( ':{ A B { ~C(D) }}' )
check( ':{ A B { ~C(D) }' )
check( '::{ A B { ~C(D) }' )
check( ':{ A( B { ~C(D) }' )
check( ':{ A B { ~C(D) }:}' )
check( '[ { X } { 2 } }')
