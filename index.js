
const { OM } = require( './dependencies/openmath.js' )
const { LC, Statement, Environment } = require( './classes/lc.js' )

console.log( 'Checking to be sure all defined classes exist...' )
console.log( 'LC?', !!LC )
console.log( 'Statement?', !!Statement )
console.log( 'Environment?', !!Environment )
