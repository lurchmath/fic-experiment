
const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( '../dependencies/openmath.js' )
const { LC } = require( './lc.js' )
const { isMetavariable, setMetavariable, clearMetavariable } =
  require( '../dependencies/second-order-matching.js' )

class Statement extends LC {
  // register with Structure ancestor class for good serialization/copying
  className = Structure.addSubclass( 'Statement', Statement )
  // Statements may contain only other Statements:
  insertChild ( child, beforeIndex = 0 ) {
    if ( child instanceof Statement )
      LC.prototype.insertChild.call( this, child, beforeIndex )
  }
  // constructor takes >=0 child Statements as parameters
  constructor ( ...children ) {
    super( ...children )
    this.isAQuantifier = false // see below for details
  }
  // Statements may optionally have string identifiers attached,
  // which you can get/set with the .identifier property:
  get identifier () { return this.getAttribute( 'identifier' ) }
  set identifier ( value ) {
    this.setAttribute( 'identifier', value )
    return value
  }
  // Statements may optionally have the "quantifier" flag set to true,
  // which you can get/set with the .isAQuantifier property:
  get isAQuantifier () { return this.getAttribute( 'quantifier' ) == true }
  set isAQuantifier ( value ) {
    if ( value )
      this.setAttribute( 'quantifier', true )
    else
      this.clearAttributes( 'quantifier' )
    return value
  }
  // Statements may optionally have the "metavariable" flag set to true,
  // which you can get/set with the .isAMetavariable property:
  get isAMetavariable () { return this.getAttribute( 'metavariable' ) == true }
  set isAMetavariable ( value ) {
    if ( value )
      this.setAttribute( 'metavariable', true )
    else
      this.clearAttributes( 'metavariable' )
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
  // Extending helper functions to support the metavariable attribute:
  copyFlagsTo ( om ) {
    LC.prototype.copyFlagsTo.call( this, om )
    let mvTarget = om.children.length ? om.children[0] : om
    if ( this.isAMetavariable )
      setMetavariable( mvTarget )
    else
      clearMetavariable( mvTarget )
    return om
  }
  copyFlagsFrom ( om ) {
    LC.prototype.copyFlagsFrom.call( this, om )
    let mvSource = om.children.length ? om.children[0] : om
    this.isAMetavariable = isMetavariable( mvSource )
    return this
  }
  // We'll call a Statement an identifier if it (a) has a non-null identifier
  // attribute and (b) is atomic.  You know, it's like "x" or something.
  get isAnIdentifier () { return !!this.identifier && this.isAtomic }
}

module.exports.Statement = Statement
