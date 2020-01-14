
const { OM } = require( '../dependencies/openmath.js' )
const { LC, Statement, Environment } = require( '../classes/lc.js' )

var E

E = LC.fromString( '{ }' )
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a constant declaration...' )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a variable declaration...' )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( LC.fromString( '{ foo }' ), 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )

E = LC.fromString( '{ A }' )
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a constant declaration...' )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a variable declaration...' )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( LC.fromString( '{ foo }' ), 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )

E = LC.fromString( '{ A B }' )
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a constant declaration...' )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a variable declaration...' )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( LC.fromString( '{ foo }' ), 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )

E = LC.fromString( '{ A B C }' )
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a constant declaration...' )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a variable declaration...' )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( LC.fromString( '{ foo }' ), 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )

E = LC.fromString( '{ {} B C }' )
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a constant declaration...' )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a variable declaration...' )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( LC.fromString( '{ foo }' ), 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )

E = LC.fromString( '{ A B(D) C }' )
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a constant declaration...' )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a variable declaration...' )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( LC.fromString( '{ foo }' ), 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
