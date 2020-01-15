
const { OM, LC, Statement, Environment } = require( '../classes/all.js' )

function check ( text ) {
  let lc = LC.fromString( text )
  console.log( '\n  Original LC: '+lc )
  console.log( 'Parenthesized: ' + lc.fullyParenthesizedForm() )
  try {
    console.log( '  Normal Form: ' + lc.normalForm() )
  } catch ( e ) {
    console.log( '  Normal Form: Formulas not allowed.' )
  }
}

check( 'A' )
check( ':A' )
check( '{ A }' )
check( '[ A ]' )
check( '{ :A }' )
check( '{ A B }' )
check( '{ A :B }' )
check( '{ :A B }' )
check( '{ :A :B }' )
check( '{ A B C }' )
check( ':{ A B C }' )
check( '{ A B C D }' )
check( '{ A B }' )
check( '{ A B C }' )
check( '{ A B C D }' )
check( '{ :A B :C :D }' )
check( '{ { :A B } {:C :D} }' )
check( ':{ A B C D }' )
check( '{ { 1 } { { 2 } } 3 }' )
check( '{ { 1 } { [ 2 ] } 3 }' )
check( '{ :{ K L } M { N10000 } }' )
check( '{ :{ K L } M { N10000 } }' )
check( ':{ :{ K L } M { N10000 } }' )
check( ':{ :{ K L } M { N10000 } }' )
