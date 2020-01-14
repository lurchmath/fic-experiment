
const { OM, LC, Statement, Environment } = require( '../classes/all.js' )

function check ( text ) {
  let lc = LC.fromString( text )
  console.log( 'Original LC: '+lc )
  console.log( '\tFully parenthesized form: ' + lc.fullyParenthesizedForm() )
}

check( 'A' )
check( '{ A }' )
check( '{ A B }' )
check( '{ A B C }' )
check( ':{ A B C }' )
check( '{ A B C D }' )
check( '[ A ]' )
check( '[ A B ]' )
check( '[ A B C ]' )
check( '[ A B C D ]' )
check( ':[ A B C D ]' )
check( '{ { 1 } { { 2 } } 3 }' )
check( '{ :[ K L ] M [ N10000] }' )
check( '[ :[ K L ] M [ N10000] ]' )
check( ':{ :[ K L ] M [ N10000] }' )
check( ':[ :[ K L ] M [ N10000] ]' )
