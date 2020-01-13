
const { Structure } = require( '../dependencies/structure.js' )

class LC extends Structure {
  insertChild ( child, beforeIndex = 0 ) {
    if ( child instanceof LC )
      Structure.prototype.insertChild.call( this, child, beforeIndex )
  }
}

class Statement extends LC {
  insertChild ( child, beforeIndex = 0 ) {
    if ( child instanceof Statement )
      LC.prototype.insertChild.call( this, child, beforeIndex )
  }
}

class Environment extends LC {
}

module.exports.LC = LC
module.exports.Statement = Statement
module.exports.Environment = Environment
