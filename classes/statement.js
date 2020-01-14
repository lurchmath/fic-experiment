
const { LC } = require( './lc.js' )

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
    this.isAQuantifier = false // indirectly uses an attribute; see below
  }
  get identifier () { return this.getAttribute( 'identifier' ) }
  set identifier ( value ) {
    this.setAttribute( 'identifier', value )
    return value
  }
  get isAQuantifier () { return this.getAttribute( 'quantifier' ) == true }
  set isAQuantifier ( value ) {
    this.setAttribute( 'quantifier', !!value )
    return value
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
  // We'll call a Statement an identifier if it (a) has a non-null identifier
  // attribute and (b) is atomic.  You know, it's like "x" or something.
  get isAnIdentifier () { return !!this.identifier && this.isAtomic }
  // Hack for smart copying; see LC class for details:
  copy () { return LC.prototype.copy.call( this, Statement ) }
}

module.exports.Statement = Statement
