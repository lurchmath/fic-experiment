
const { OM } = require( '../dependencies/openmath.js' )
const { LC, Statement, Environment } = require( '../classes/lc.js' )

// Quick way to make identifiers
function ident ( name, given = false ) {
  let result = new Statement()
  result.identifier = name
  result.isAGiven = given
  return result
}

var A, B, C, E
C = new Environment( ident( 'foo' ) )

E = new Environment()
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
console.log( '\tNow I set it to be a constant declartion...' )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( C, 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )

E = new Environment( ident( 'A' ) )
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( C, 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )

E = new Environment( ident( 'A' ), ident( 'B' ) )
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( C, 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )

E = new Environment( ident( 'A' ), ident( 'B' ), ident( 'C' ) )
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( C, 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )

E = new Environment( new Environment(), ident( 'B' ), ident( 'C' ) )
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( C, 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )

B = ident( 'B' )
B.insertChild( ident( 'D' ) )
E = new Environment( ident( 'A' ), B, ident( 'C' ) )
console.log( 'Can '+E+' be a declaration?', E.canBeADeclaration() )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.declaration = Environment.constant
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.declaration = Environment.variable
console.log( '\tWhat is its declaration type?', ''+E.declaration )
E.insertChild( C, 0 )
console.log( '\tInserted a child to get:', ''+E )
console.log( '\tWhat is its declaration type?', ''+E.declaration )
