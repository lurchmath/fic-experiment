
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
  set isAGiven ( value ) { return this._given = value }
  get isAClaim () { return !this._given }
  set isAClaim ( value ) { return this._given = !value }
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
  // An LC is said to be atomic if it has no children.
  get isAtomic () { return this.children().length == 0 }
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
  // We'll call a Statement an identifier if it (a) has a non-null identifier
  // attribute and (b) is atomic.  You know, it's like "x" or something.
  get isAnIdentifier () { return !!this.identifier && this.isAtomic }
}

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
  constructor ( ...children ) {
    super( ...children )
    this._declaration = Environment.none
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
