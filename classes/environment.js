
const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( '../dependencies/openmath.js' )
const { LC } = require( './lc.js' )

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
  // An Environment can be a constant or variable declaration iff
  // (a) it has n>0 children,
  // (b) the first n-1 are identifiers,
  // (c) the last one is a claim, and
  // (d) that claim contains neither formulas nor other declarations.
  canBeADeclaration () {
    let vars = this.children().slice()
    if ( vars.length == 0 ) return false
    let body = vars.pop()
    let noFormulasNorDeclarations = ( lc ) =>
      !lc.isAFormula && ( !lc.declaration || lc.declaration == 'none' ) &&
      lc.children().every( noFormulasNorDeclarations )
    return vars.every( v => v.isAnIdentifier )
        && body.isAClaim && noFormulasNorDeclarations( body )
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
  // A declaration is not supposed to re-declare any identifiers in whose scope
  // it sits (e.g., if you've already got an x in your proof, you can't say "Let
  // x be arbitrary").  Thus we will want to validate declarations and mark them
  // as valid or invalid.  The validation routine comes later, but it uses the
  // the following tool to mark a declaration as valid/invalid, by listing the
  // identifiers it tried to declare, but failed.  An empty list counts as a
  // valid declaration.
  markFailures ( identifierNames ) {
    if ( !this.declaration || this.declaration == 'none' )
      return this.clearAttributes( 'declaration failures' )
    let triedToDeclare = this.children().slice( 0, this.children().length - 1 )
      .map( declared => declared.identifier )
    this.setAttribute( 'declaration failures',
      identifierNames.filter( name => triedToDeclare.indexOf( name ) > -1 ) )
  }
  // A declaration failed if it failed to declare any one of its identifiers.
  declarationFailed () {
    return ( this.getAttribute( 'declaration failures' ) || [ ] ).length > 0
  }
  // A declaration "successfully declares" an identifier if that identifier is
  // on its list of declared identifiers but not on its list of failures (as in
  // the definition of markFailures(), above.)
  successfullyDeclares ( identifierName ) {
    return this.declaration && this.declaration != 'none' &&
      ( this.getAttribute( 'declaration failures' ) || [ ] )
        .indexOf( identifierName ) == -1 &&
      this.children().slice( 0, this.children().length - 1 )
        .some( declared => declared.identifier == identifierName )
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
  toString () {
    return ( this.isAGiven ? ':' : '' )
         + ( this.isAFormula ? '[ ' : '{ ' )
         + this.children().map( child => child.toString() ).join( ' ' )
         + ( this.isAFormula ? ' ]' : ' }' )
  }
  // What do Statements look like in OM form?
  toOM () {
    return this.copyFlagsTo( OM.app( OM.sym( 'Env', 'Lurch' ),
      ...this.children().map( child => child.toOM() ) ) )
  }
}

module.exports.Environment = Environment
