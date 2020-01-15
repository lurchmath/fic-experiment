
const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( '../dependencies/openmath.js' )
const { LC } = require( './lc.js' )

class Statement extends LC {
  // register with Structure ancestor class for good serialization/copying
  className = Structure.addSubclass( 'Statement', Statement )
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
    result += this.identifier
    if ( this.children().length > 0 )
      result += '('
              + this.children().map( child => child.toString() ).join( ',' )
              + ')'
    return result
  }
  // What do Statements look like in OM form?
  toOM () {
    let children = this.children().map( child => child.toOM() )
    let head = this.isAQuantifier ? OM.sym( this.identifier, 'Lurch' )
                                  : OM.var( this.identifier )
    if ( this.isAQuantifier
      && children.slice( 0, children.length-1 )
                 .every( child => child.type == 'v' ) )
      return this.copyFlagsTo( OM.bin( head, ...children ) )
    else if ( children.length > 0 )
      return this.copyFlagsTo( OM.app( head, ...children ) )
    else
      return this.copyFlagsTo( head )
  }
  // We'll call a Statement an identifier if it (a) has a non-null identifier
  // attribute and (b) is atomic.  You know, it's like "x" or something.
  get isAnIdentifier () { return !!this.identifier && this.isAtomic }
}

module.exports.Statement = Statement
