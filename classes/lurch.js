//////////////////////////////////////////////////////////////////////////////
//
// LurchNode
//
// Description: This allows us to define a node REPL which has all
//              of the lurch FIC brains loaded.
//
// Syntax: at the bash prompt type "node lurch.js"  where lurch.js is this file,
//         assuming the current directory is the /classes directory.
//
// Features: Entering the node command '.clear' (no '' quotes) at the node
//           prompt completely resets the context and reinitializes Lurch
//           by reloading the latest versions of all of the code files.
//           Thus, we can make changes to the Lurch code and then test them in
//           node without exiting the node REPL, just by typing .clear.
//
///////////////////////////////////////////////////////////////////////////////

console.log(`\nWelcome to \x1B[36m𝕃𝕠𝕕𝕖\x1B[39m - the Lurch Node app\n(type help() for help)`)

const repl  = require('repl').start({ignoreUndefined: true})
const rpl   = repl.context

function mixIn ( moduleName , context) {
  let imported = require( moduleName )
  for ( let key in imported )
    if ( imported.hasOwnProperty( key ) )
      context[key] = imported[key]
}

const dependencies = [
  '../dependencies/openmath.js',
  '../dependencies/structure.js',
  './lc.js',
  './statement.js',
  './environment.js',
  './deduction.js',
  './matching.js',
  '../dependencies/LSAT.js',
  '../dependencies/lode.js'
]

function initializeLurch ( context ) {
  dependencies.map( (x) => mixIn( x , context ) )
}

repl.on( 'reset' , initializeLurch )

initializeLurch( rpl )
