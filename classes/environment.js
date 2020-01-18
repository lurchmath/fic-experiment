
const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( '../dependencies/openmath.js' )
const { LC } = require( './lc.js' )
const { Statement } = require( './statement.js' )


class Environment extends LC {
  // register with Structure ancestor class for good serialization/copying
  className = Structure.addSubclass( 'Environment', Environment )
  // We initialize the declaration flag to "none" in the constructor.
  // Quite fussy rules for setting this attribute appear below.
  // We also initialize the formula flag to false in the constructor.
  constructor ( ...children ) {
    super( ...children )
    this.setAttribute( 'declaration', 'none' )
    this.setAttribute( 'formula', false )
  }
  // The conclusions of an LC X are all the claim Statements inside X, plus
  // all the claim Statements inside claims inside X, plus all the
  // claim Statements inside claims inside claims inside X, and so on,
  // indefinitely.
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
  // An Environment can be a constant or variable declaration iff it has n>0
  // children, the first n-1 are identifiers, and the last one is a claim.
  canBeADeclaration () {
    let kids = this.children()
    return kids.length > 0
        && kids.every( kid => kid.isAnIdentifier )
        && kids[kids.length-1].isAClaim
  }
  // If something's allowed to be a declaration as above, then we'll let you set
  // it as one, providing you're trying to set it as type "variable" or
  // "constant" or "none".  Otherwise, this does nothing.
  set declaration ( value ) {
    return this.canBeADeclaration()
        && [ 'variable', 'constant', 'none' ].indexOf( value ) > -1 ?
      this.setAttribute( 'declaration', value ) : 'none'
  }
  // When querying if an Environment is a constant or variable declaration,
  // if it isn't allowed to be one, say it's not.
  get declaration () {
    return this.canBeADeclaration() ?
      this.getAttribute( 'declaration' ) : 'none'
  }
  // The getter and setter for formula status enforce the requirement that you
  // can't nest formulas.
  get isAFormula () {
    let walk = this.parent()
    while ( walk ) {
      if ( walk.getAttribute( 'formula' ) )
        return false // sorry...we have a formula ancestor
      walk = walk.parent()
    }
    // no ancestor constrains us, so this flag is correct:
    return this.getAttribute( 'formula' )
  }
  set isAFormula ( value ) {
    let walk = this.parent()
    while ( walk ) {
      if ( walk.getAttribute( 'formula' ) )
        return false // sorry...we have a formula ancestor
      walk = walk.parent()
    }
    // no ancestor constrains us, so we can obey the setting command:
    return this.setAttribute( 'formula', value )
  }
  // What do Environments look like, for printing/debugging purposes?
  toString ( showValidation ) {
    if (showValidation) {
      return ( this.isAGiven ? ':' : '' )
           + ( this.isAFormula ? '[ ' : '{ ' )
           + this.children().map( child => child.toString(showValidation) ).join( ' ' )
           + ( this.isAFormula ? ' ]' : ' }' )
    } else {
      return ( this.isAGiven ? ':' : '' )
           + ( this.isAFormula ? '[ ' : '{ ' )
           + this.children().map( child => child.toString() ).join( ' ' )
           + ( this.isAFormula ? ' ]' : ' }' )
    }
  }
  // What do Statements look like in OM form?
  toOM () {
    return this.copyFlagsTo( OM.app( OM.sym( 'Env', 'Lurch' ),
      ...this.children().map( child => child.toOM() ) ) )
  }
}

module.exports.Environment = Environment
