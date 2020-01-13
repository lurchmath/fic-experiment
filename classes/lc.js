
const { Structure } = require( '../dependencies/structure.js' )

class LC extends Structure {
  // LCs may contain only other LCs:
  insertChild ( child, beforeIndex = 0 ) {
    if ( child instanceof LC )
      Structure.prototype.insertChild.call( this, child, beforeIndex )
  }
  // LCs have the isAGiven boolean, which defaults to false.
  // We also define the isAClaim boolean, which is !isAGiven.
  // Both of these use the private internal attribute _given.
  constructor ( ...children ) {
    super( ...children )
    this._given = false
  }
  get isAGiven () { return this._given }
  set isAGiven ( value ) { this._given = value }
  get isAClaim () { return !this._given }
  set isAClaim ( value ) { this._given = !value }
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
    super( ...children )
    this.identifier = null
    this.isAQuantifier = false
  }
}

class Environment extends LC {
  // Environments have no nesting rules beyond what LCs already require.
}

module.exports.LC = LC
module.exports.Statement = Statement
module.exports.Environment = Environment
