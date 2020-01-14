
const { OM } = require( '../dependencies/openmath.js' )
const { LC, Statement, Environment } = require( '../classes/lc.js' )

function checkEverything ( lc, indent = '' ) {
  console.log( indent+'Is '+lc+' a formula?', lc.isAFormula )
  lc.children().map( child => checkEverything( child, indent + '    ' ) )
}

checkEverything( LC.fromString( '{ [ A ] B }' ) )
checkEverything( LC.fromString( '{ :A :B :{ C D } }' ) )
checkEverything( LC.fromString( '[ :[ X ] [ Y ] ]' ) )
