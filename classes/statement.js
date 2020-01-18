
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
  get isValidated () { return !!this.getAttribute( 'validation' ) }
  get isValid () {
    return this.getAttribute( 'validation' ).status
  }
  // What do Statements look like, for printing/debugging purposes?
  toString (showValidation) {
    let result = ''
    if ( this.isAGiven ) result += ':'
    if ( this.isAQuantifier ) result += '~'
    result += this.identifier
    if ( this.children().length > 0 )
      result += '('
              + this.children().map( child => child.toString() ).join( ',' )
              + ')'
    if ( showValidation && this.isValidated )
       if (this.isValid) { result += '✓' } else { result += '✗' }
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
  // A quantifier is not supposed to apply itself to symbols, as in
  // "for all pi, pi^2>=0."  Thus we will want to validate quantifiers and mark
  // them as valid or invalid.  The validation routine comes later, but it uses
  // the following tool to mark a quantified expression as valid/invalid, by
  // listing the identifiers it tried to quantify over, but failed.  An empty
  // list counts as a valid quantified expression.
  markFailures ( identifierNames ) {
    if ( !this.isAQuantifier )
      return this.clearAttributes( 'binding failures' )
    let triedToBind = this.children().slice( 0, this.children().length - 1 )
      .map( boundThing => boundThing.identifier )
    this.setAttribute( 'binding failures',
      identifierNames.filter( name => triedToBind.indexOf( name ) > -1 ) )
  }
  // A quantifier failed if it failed to bind any one of its identifiers.
  quantifierFailed () {
    return ( this.getAttribute( 'binding failures' ) || [ ] ).length > 0
  }
  // A quantifier "successfully binds" an identifier if that identifier is on
  // its list of bound identifiers but not on its list of failures (as in the
  // definition of markFailures(), above.)
  successfullyBinds ( identifierName ) {
    return this.isAQuantifier &&
      ( this.getAttribute( 'binding failures' ) || [ ] )
        .indexOf( identifierName ) == -1 &&
      this.children().slice( 0, this.children().length - 1 )
        .some( bound => bound.identifier == identifierName )
  }
  // For all quantifiers inside this Statement (including possibly the Statement
  // itself), add an attribute called "binding failures" which is a list of
  // names of variables the quantifier tried to bind but that were actually
  // declared constants, not variables.  To facilitate this, we provide a list
  // of the names of all constants declared in the statement's context.
  validateQuantifiers ( constantNames ) {
    if ( this.isAQuantifier ) {
      let boundVarNames = this.children().slice( 0, this.children().length - 1 )
                              .map( boundVar => boundVar.identifier )
      this.markFailures( boundVarNames.filter( name =>
        constantNames.indexOf( name ) > -1 ) )
    }
    this.children().map( child => child.validateQuantifiers( constantNames ) )
  }
  // The scope of a Statement that's an identifier is one of:
  //  - The quantifier binding it, if it is (successfully) bound by one.
  //  - The declaration declaring it, if it is (successfully) declared by one.
  //  - The environment implicitly declaring it, in all other cases.
  // If this function is called in a statement that's not an identifier,
  // return undefined.
  scope () {
    // If I'm not an identifier, then I have no scope:
    if ( !this.identifier ) return undefined
    // If I have a quantifier ancestor binding me, that's my scope:
    let me = this.identifier
    // console.log( 'Computing scope of: ' + me )
    let lastStatement = this
    let ancestor = this.parent()
    while ( ancestor instanceof Statement ) {
      // console.log( 'Checking to see if I\'m bound in: ' + ancestor )
      if ( ancestor.isAQuantifier && ancestor.successfullyBinds( me ) )
        return ancestor
      lastStatement = ancestor
      ancestor = ancestor.parent()
    }
    // console.log( 'No ancestor binds me.' )
    // So we have to look through our accessibles list for a declaration:
    let walk = lastStatement
    while ( walk ) {
      // Seek a declaration of me among my previous siblings:
      while ( walk.previousSibling() ) {
        let sib = walk.previousSibling()
        // console.log( 'Checking if declaration here: ' + sib )
        if ( sib instanceof Environment && sib.successfullyDeclares( me ) )
          return sib
        walk = sib
      }
      // console.log( 'No declaration yet.' )
      // No more siblings, so does my parent implicitly declare me?
      let par = walk.parent()
      // console.log( 'Maybe implicit/explicit in this parent: ' + par )
      if ( par && ( par.implicitDeclarations.indexOf( me ) > -1
                 || par.successfullyDeclares( me ) ) )
        return par
      // console.log( 'No, not implicit in parent.' )
      // It didn't, so we have to look at accessibles one level higher:
      walk = par
    }
    // console.log( 'I give up!' )
    // Technically, this should never happen, because the client should call
    // this function only if they've already called markDeclarations() on some
    // higher-level ancestor of this identifier, which would have found its
    // declaration, even if it was implicit.  But if the client hasn't called
    // that, then this could happen, for implicit declarations only.  So we
    // return undefined in that case.
    return undefined // this is what JS does anyway, but just being explicit
  }
}

module.exports.Statement = Statement

const { Environment } = require( './environment.js' )
