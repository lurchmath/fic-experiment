
const { LC } = require( './lc.js' )

// Environments can have a special flag called 'declaration' that can be one
// of constant, variable, or none.  So we declare those constants here.
const ConstantDeclaration = { toString : () => 'constant' }
const VariableDeclaration = { toString : () => 'variable' }
const NotADeclaration = { toString : () => 'none' }

class Environment extends LC {
  // Make the above constants easy to access as class attributes.
  static get constant () { return ConstantDeclaration }
  static get variable () { return VariableDeclaration }
  static get none () { return NotADeclaration }
  // We initialize the declaration flag to "none" in the constructor.
  // Quite fussy rules for setting this attribute appear below.
  // We also initialize the formula flag to false in the constructor.
  constructor ( ...children ) {
    super( ...children )
    this._declaration = Environment.none
    this._formula = false
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
  // it as one.  Otherwise, we don't let you.
  set declaration ( value ) {
    return this.canBeADeclaration() ? this._declaration = value
                                    : Environment.none
  }
  // When querying if an Environment is a constant or variable declaration,
  // if it isn't allowed to be one, say it's not.
  get declaration () {
    return this.canBeADeclaration() ? this._declaration : Environment.none
  }
  // The getter and setter for formula status enforce the requirement that you
  // can't nest formulas.
  get isAFormula () {
    let walk = this.parent()
    while ( walk ) {
      if ( walk._formula ) return false // sorry...we have a formula ancestor
      walk = walk.parent()
    }
    return this._formula // no ancestor constrains us, so this flag is correct
  }
  set isAFormula ( value ) {
    let walk = this.parent()
    while ( walk ) {
      if ( walk._formula ) return false // sorry...we have a formula ancestor
      walk = walk.parent()
    }
    return this._formula = value // no ancestor constrains us, so proceed
  }
  // What do Environments look like, for printing/debugging purposes?
  toString () {
    return ( this.isAGiven ? ':' : '' )
         + ( this.isAFormula ? '[ ' : '{ ' )
         + this.children().map( child => child.toString() ).join( ' ' )
         + ( this.isAFormula ? ' ]' : ' }' )
  }
  // Hack for smart copying; see LC class for details:
  copy () {
    let result = LC.prototype.copy.call( this, Environment )
    result._declaration = this._declaration
    result._formula = this._formula
    return result
  }
}

module.exports.Environment = Environment
