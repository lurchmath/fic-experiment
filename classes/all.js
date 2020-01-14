
function mixIn ( moduleName ) {
  let imported = require( moduleName )
  for ( let key in imported )
    module.exports[key] = imported[key]
}

[
  '../dependencies/openmath.js',
  './lc.js',
  './statement.js',
  './environment.js'
].map( mixIn )
