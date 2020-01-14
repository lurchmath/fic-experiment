
const { OM } = require( '../dependencies/openmath.js' )
const { LC, Statement, Environment } = require( '../classes/lc.js' )

var A, B, C, D, _A, _B, _C, _D, outer

// How to print conclusion lists
function printcons ( lc ) {
  return lc.conclusions().map( x => x.toString() ).join( ', ' )
}
// Quick way to make identifiers
function ident ( name, given = false ) {
  let result = new Statement()
  result.identifier = name
  result.isAGiven = given
  return result
}
// report Conclusions
function report( lc , ...ABCs ) {
  console.log( 'Conclusions of '+lc+' are',printcons( lc ) )
  for (var n=0; n<ABCs.length; n++) {
    console.log( ' - Does '+ABCs[n]+' think it is a conclusion?', ABCs[n].isAConclusionIn( lc ) )
  }
}
// abbreviation for Environments
function Env ( ...args ) {
  return new Environment( ...args )
}
// make Given Environments
function _Env( ...args ) {
  var env = new Environment( ...args )
  env.isAGiven = true
  return env
}

// for now, make reusable A, B, C, :A, :B, :C
A = ident( 'A' )
B = ident( 'B' )
C = ident( 'C' )
D = ident( 'D' )
_A = ident( 'A' , true )
_B = ident( 'B' , true )
_C = ident( 'C' , true )
_D = ident( 'D' , true )

// In { A B }, both are conclusions.
outer = Env(A,B)
report( outer, A, B )

// In :{ A B }, both are conclusions.
outer = _Env(A,B)
report( outer, A, B )

// In :{ :A B }, only B is a conclusion.
outer = _Env( _A , B )
report(outer , _A , B)

// In :{ A :B }, only A is a conclusion.
outer = _Env( A , _B )
report(outer , A , _B)

// In :{ :A :B }, there are no conclusions
outer = _Env( _A , _B )
report( outer , _A , _B )

// In { { A } }, there is one conclusion, A
outer = Env( Env( A ) )
report( outer, A )

// In { :{ A } }, there are no conclusions
outer = Env( _Env( A ) )
report( outer, A )

// In { { :A } }, there are no conclusions
outer = Env( Env( _A ) )
report( outer, _A )

// In { { :A B } }, the one conclusion is B
outer = Env( Env( _A , B ) )
report( outer, _A , B )

// In { { :A B } C }, the conclusions are B, C
outer = Env( Env( _A , B ) , C )
report( outer, _A , B, C )

// In { :{ :A B } C }, the conclusion is C only
outer = Env( _Env( _A , B ) , C )
report( outer, _A , B, C )

// In { { { :A B } :{ :C D } } :D } the conclusion is B
outer = Env(  Env( Env(_A,B) , _Env(_C,D) ) , _D  )
report(outer, _A, B, _C, D, _D)

// In { { :{ :A B } { C :D } } D } the conclusions are C, D
outer = Env(  Env( _Env(_A,B) , Env(C,_D) ) , D  )
report(outer, _A, B, C, D, _D)
