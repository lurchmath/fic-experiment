
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
  // Abstract-like method that subclasses will fix:
  toString () {
    return ( this.isAGiven ? ':' : '' )
         + 'LC('
         + this.children().map( child => child.toString() ).join( ',' )
         + ')'
  }
  // The conclusions of an LC X are all the Statements inside X, plus all the
  // Statements inside claims inside X, plus all the Statements inside claims
  // inside claims inside X, and so on, indenfinitely.
  conclusions () {
    let result = [ ]
    this.children().map( child => {
      if ( child.isAGiven ) return
      if ( child instanceof Statement )
        result.push( child )
      else if ( child instanceof Environment )
        result = result.concat( child.conclusions() )
    } )
    return result
  }
  // By the same definition, we might ask whether a given LC is a conclusion in
  // one of its ancestors.
  isAConclusionIn ( ancestor ) {
    if ( !( this instanceof Statement ) ) return false
    if ( this.isAGiven ) return false
    let walk = this.parent()
    while ( walk && walk != ancestor ) {
      if ( walk.isAGiven ) return false
      walk = walk.parent()
    }
    return true
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
    super( ...children )
    this.identifier = null
    this.isAQuantifier = false
  }
  // What do Statements look like, for printing/debugging purposes?
  toString () {
    let result = ''
    if ( this.isAGiven ) result += ':'
    if ( this.isAQuantifier ) result += '~'
    if ( this.identifier || this.children().length == 0 )
      result += this.identifier
    if ( this.children().length > 0 )
      result += '('
              + this.children().map( child => child.toString() ).join( ',' )
              + ')'
    return result
  }
}

class Environment extends LC {
  // Environments have no nesting rules beyond what LCs already require.
  // What do Environments look like, for printing/debugging purposes?
  toString () {
    return ( this.isAGiven ? ':' : '' )
         + '{ '
         + this.children().map( child => child.toString() ).join( ' ' )
         + ' }'
  }
}

module.exports.LC = LC
module.exports.Statement = Statement
module.exports.Environment = Environment
