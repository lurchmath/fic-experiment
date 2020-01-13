
const { Structure } = require( '../dependencies/structure.js' )

class LC extends Structure {
  // LCs may contain only other LCs:
  insertChild ( child, beforeIndex = 0 ) {
    if ( child instanceof LC )
      Structure.prototype.insertChild.call( this, child, beforeIndex )
  }
}

class Statement extends LC {
  // Statements may contain only other Statements:
  insertChild ( child, beforeIndex = 0 ) {
    if ( child instanceof Statement )
      LC.prototype.insertChild.call( this, child, beforeIndex )
  }
  // Statements may optionally have string identifiers attached,
  // and may optionally have the "quantifier" flag set to true.
  // By default, neither of these options is in play.
  // Clients can set them manually by altering .identifier/.isAQuantifier.
  constructor ( ...children ) {
    super( ...children );
    this.identifier = null;
    this.isAQuantifier = false;
  }
}

class Environment extends LC {
  // Environments have no nesting rules beyond what LCs already require.
}

module.exports.LC = LC
module.exports.Statement = Statement
module.exports.Environment = Environment
