
const { LC, derives } = require( '../classes/all.js' )

function check ( ...LCs ) {
  LCs = LCs.map( LC.fromString )
  console.log( '-----------------------------------------------------------' )
  try {
    let result = derives( ...LCs )
    let conclusion = LCs.pop()
    console.log( LCs.map( x => ''+x ).join( ',\n' ) )
    console.log( ( result ? '\t|-\t' : '\t|-/-\t' ) + conclusion )
  } catch ( e ) {
    console.log( 'Tried to check derivability of this sequence:' )
    LCs.map( x => console.log( ''+x ) )
    console.log( 'But I got this error:' )
    console.log( e.stack )
  }
}

check( 'A', 'A' )
check( 'A', 'B' )
check( 'A', 'B', 'A' )
check( 'A', 'B', 'B' )
check( 'A', 'B', 'C' )
check( '{A B}', 'A' )
check( '{A B}', 'B' )
check( '{A B}', 'C' )
check( 'A', 'B', '{A B}' )
check( 'A', 'B', '{A C}' )
check( '{A B}', '{A B}' )
check( '{A B}', ':{B A}' )
console.log( '^^^ WRONG ^^^' )
check( ':{A B}', '{B A}' )
check( '{A B}', '{B A}' )
check( '{:A B}', '{A B}' )
console.log( '^^^ WRONG ^^^' )
check( '{:A B}', '{:A B}' )
check( '{A B}', '{:A B}' )
