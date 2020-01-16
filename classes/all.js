
function mixIn ( moduleName ) {
  let imported = require( moduleName )
  for ( let key in imported )
    if ( imported.hasOwnProperty( key ) )
      module.exports[key] = imported[key]
}

[
  '../dependencies/openmath.js',
  '../dependencies/structure.js',
  './lc.js',
  './statement.js',
  './environment.js',
  './deduction.js',
  './matching.js'
].map( mixIn )
