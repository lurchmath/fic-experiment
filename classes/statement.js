
const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( '../dependencies/openmath.js' )
const { LC, Times, StartTimes, TimerStart, TimerStop, union } =
        require( './lc.js' )
const { isMetavariable, setMetavariable, clearMetavariable } =
        require( '../dependencies/matching.js' )
const chalk = require('chalk')

let debug = ( ...args ) => console.log( ...args )

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
    this.StringCache = ''
  }
  // Statements may optionally have string identifiers attached,
  // which you can get/set with the .identifier property:
  get identifier () { return this.getAttribute( 'identifier' ) }
  set identifier ( value ) {
    this.setAttribute( 'identifier', value )
    return value
  }
  // when an identifier is Skolemized it's original name is called its username
  get username () { return this.getAttribute( 'username' ) }
  set username ( value ) {
    this.setAttribute( 'username', value )
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
  // This is also currently used to generate the propositional forms of
  // statements.
  //
  // options - an object containing various options (optional).  The options are:
  //
  // options - an object containing various options (optional).  The options are:
  //
  //  * FIC:true     - show FIC validation of conclusion
  //  * Bound:true   - show validation of identifiers declared by quantifiers
  //                   and Declarations
  //  * Indent:true  - format the output with indentations and newlines
  //  * Color:true   - use color for syntax highlighting of output
  //  * EEs:true     - print EEs that were added for constant declarations
  //  * Skolem:true  - print the Skolemized names for declared constants
  //  * indentLevel  - keeps track of the current level of indentation
  //  * tabsize      - the number of spaces in one indentation level

  toString ( options ) {

    // Since this still uses OM for some things and identifier names in OM can't
    // be weird unicode chars, we reverse lookup our internal names for these
    // useful ones.  This is from the lc.fromString() routine:
    const longnames = {
      '⇒'  : 'implies'      , '¬' : 'not'       , '⇔' : 'iff'      ,
      '←'  : 'from'         , '=' : 'equal'     , '≠' : 'notequal' ,
      '×'  : 'cross'        , '⊆' : 'subseteq'  , '℘' : 'powerset' ,
      '∩'  : 'intersect'    , '∪' : 'union'     , '∀' : 'forall'   ,
      '!'  : 'unique'       , '∉' : 'notmember' , '∅' : 'emptyset' ,
      '\-' : 'difference'   , '∘' : 'compose'   , '<' : 'lessthan' ,
      '>'  : 'greaterthan'  , '≤' : 'leq'       , '→' : 'to'       ,
      '≥'  : 'geq'          , '∈' : 'member'    , '+' : 'plus'     ,
      '⋅'  : 'cdot'         , '∃' : 'exists'    , '⊥' : 'false'    ,
      '∃!' : 'existsunique' , '0' : 'zero'      , '1'  : 'one'  ,
      '→←' : 'contradiction', '◼' : 'qed'
    }
    const shortnames = { }
    Object.keys(longnames).forEach( x => shortnames[longnames[x]] = x )
    let nicename = s => {
      return (shortnames.hasOwnProperty(s)) ? shortnames[s] : s
    }
    let idname = (options && !options.Skolem && this.hasAttribute('username') ) ?
                  this.username : this.identifier

    // decide whether strings are colored or not
    let colorize = ( x, col , font ) =>
      ( options && options.Color ) ?
        ( ( font ) ? chalk[col][font](x) : chalk[col](x) ) : x
    let stateColor = 'green'
    let colon    = colorize(':','whiteBright','bold'),
        tilde    = colorize('~',stateColor),
        iname    = colorize(nicename(idname),stateColor),
        boundYes = colorize('✓','yellowBright'),
        concYes  = colorize('✔︎','yellowBright'),
        envYes   = colorize('★','yellowBright'),
        wrong    = colorize('✗','redBright'),
        lparen   = colorize('(',stateColor),
        rparen   = colorize(')',stateColor),
        comma    = colorize(',',stateColor)

    // Separate styling for EEs
    if (this.inEE) {
      let EEcolor = 'blue'
      colon    = colorize(':',EEcolor)
      tilde    = colorize('~',EEcolor)
      iname    = colorize(nicename(idname),EEcolor)
      boundYes = colorize('✓',EEcolor)
      concYes  = colorize('✔︎',EEcolor)
      envYes   = colorize('★',EEcolor)
      wrong    = colorize('✗',EEcolor)
      lparen   = colorize('(',EEcolor)
      rparen   = colorize(')',EEcolor)
      comma    = colorize(',',EEcolor)
    }

    let result = ''
    if ( this.isAGiven ) result += colon
    if ( this.isAQuantifier ) result += tilde
    result += nicename(iname)

    // options.Bound determines if we show bound variable statuses
    if ( options && options.Bound &&
         this.isAnActualIdentifier() && this.parent() &&
         this.parent().isAQuantifier &&
         (this.indexInParent() !== this.parent().children().length-1)
       ) {
      result += ( this.parent().successfullyBinds(this.identifier) ) ?
         boundYes : wrong
    }

    // options.Bound also determines if we show illegal identifier
    // declarations.
    if ( options && options.Bound &&
         this.isAnActualIdentifier() && this.parent() &&
         this.parent().isAnActualDeclaration() &&
         this.indexInParent() !== this.parent().children().length-1
       ) {
      ( this.parent().successfullyDeclares(this.identifier) ) ? result+=boundYes :
      result+=wrong
    }
    if ( this.children().length > 0 )
      result += lparen
              + this.children().map( child => child.toString(options) ).join( comma )
              + rparen

    // options.Conc determines if we show validation for conclusions
    if ( options && options.Conc && this.isValidated )
       if (this.isValid) { result += concYes } else { result += wrong }
    // options.Conc determines if we show validation for conclusions
    // we put a space before the icon to distinguish FIC from SAT
    // Note: you can have both.
    if ( options && options.Conc && this.isvalidated )
       if (this.isvalid) { result += ' '+concYes } else { result += ' '+wrong }

    return result
  }

  // What do Statements look like in OM form?
  toOM () {
    // debug(`toOM: ${this}`)
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
    let triedToBind = this.allButLast.map( bound => bound.identifier )
    this.setAttribute( 'binding failures',
      identifierNames.filter( name => triedToBind.includes( name ) ) )
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
      this.allButLast.some( bound => bound.identifier == identifierName )
  }
  // A quantifier "simply binds" an identifier if that identifier is on
  // its list of bound identifiers regardless if the binding was successful
  simplyBinds ( identifierName ) {
    return this.isAQuantifier &&
      this.allButLast.some( bound => bound.identifier == identifierName )
  }

  // For all quantifiers inside this Statement (including possibly the Statement
  // itself), add an attribute called "binding failures" which is a list of
  // names of variables the quantifier tried to bind but that were actually
  // declared constants, not variables.  To facilitate this, we provide a list
  // of the names of all constants declared in the statement's context.
  validateQuantifiers ( constantNames ) {
    if ( this.isAQuantifier ) {
      let boundVarNames = this.allButLast.map( bound => bound.identifier )
      this.markFailures( boundVarNames.filter( name =>
        constantNames.includes( name ) ) )
    }
    this.children().map( child => child.validateQuantifiers( constantNames ) )
  }

  // The scope of an identifier in a Statement is one of:
  //  - The quantifier binding it, if it is (successfully) bound by one.
  //  - The declaration declaring it, if it is (successfully) declared by one.
  //  - The environment implicitly declaring it, in all other cases.
  // If this function is called in a statement that's not an identifier,
  // return undefined.
  scope () {
    // If I'm not an identifier, then I have no scope:
    if ( !this.identifier ) return undefined
    // If I have a quantifier ancestor binding me, that's my scope.
    //
    // Note: after Skolemization we still consider a skolemized identifier to
    // be declared by its original Declaration, so we use the username instead
    // of the
    let me = ( this.hasAttribute( 'username' ) ) ?
             this.username : this.identifier
    // console.log( 'Computing scope of: ' + me )
    let lastStatement = this
    let ancestor = this.parent()
    while ( ancestor instanceof Statement ) {
      // console.log( 'Checking to see if I\'m bound in: ' + ancestor )
      // if ( ancestor.isAQuantifier && ancestor.successfullyBinds( me ) )
      if ( ancestor.isAQuantifier && ancestor.simplyBinds( me ) )
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
        if ( sib instanceof Environment && sib.simplyDeclares( me ) )
          return sib
        walk = sib
      }
      // console.log( 'No declaration yet.' )
      // No more siblings, so does my parent implicitly declare me?
      let par = walk.parent()
      // console.log( 'Maybe implicit/explicit in this parent: ' + par )
      if ( par && ( par.implicitDeclarations.includes( me )
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

  // is this an explicitly declared constant that is not in the head or body
  // of the declaration that declares it
  isSkolem () {
    let dec=this.scope()
    return dec.isAnActualDeclaration() &&
          (dec.declaration === 'constant') &&
          !dec.isAncestorOf(this)
  }

  // Check if the identifier of this Statement (which might be compound) is
  // bound.  It is bound iff either
  //   (a) it is inside a Declaration that declares it
  //   (b) it is declared by a quantifier (which can only happen if its
  //       scope is a Statement
  // If ignoreAncestorDeclarations is true, we ignore (a)
  //
  // This routine assumes markDeclarations and markScopes has been run on the LC.
  isBound ( ignoreAncestorDeclarations = false ) {
    if (this.scope() instanceof Statement ||
        !ignoreAncestorDeclarations &&
        this.scope().isAnActualDeclaration() &&
        this.scope().isAncestorOf(this)
      ) { return true }
    return false
  }
  // candy
  isFree ( ignoreAncestorDeclarations = false ) {
    return !this.isBound( ignoreAncestorDeclarations = false )
  }

  // Find the names of all free identifiers in a statement and return it as a Set
  freeIdentifiers () {
    let ans = new Set
    if (this.isFree()) ans = union( ans , new Set([this.identifier]) )
    let kids = this.children()
    if (kids.length>0) kids.forEach( x => ans = union( ans , x.freeIdentifiers()))
    return ans
  }
}

module.exports.Statement = Statement

const { Environment } = require( './environment.js' )
