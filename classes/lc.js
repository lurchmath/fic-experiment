
const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( '../dependencies/openmath.js' )

// const verbose = false
// let debug = ( ...args ) => { if (verbose) console.log( ...args ) }

class LC extends Structure {

  // register with Structure ancestor class for good serialization/copying
  className = Structure.addSubclass( 'LC', LC )

  // LCs may contain only other LCs:
  insertChild ( child, beforeIndex = 0 ) {
    if ( child instanceof LC )
      Structure.prototype.insertChild.call( this, child, beforeIndex )
  }

  // LCs are often viewed as arrays of their LCChildren, so it is
  // convenient to have common array functions available
  //
  // we often want the last child of an environment
  get last () { return this.children().last() }
  // we often want all but the last child of an environment, as an array
  get allButLast () {
    return this.children().slice( 0, this.children().length - 1 )
  }
  // we often want the first child too
  get first () { return this.children()[0] }
  // remove the last child from an environment.
  pop () {
    let L = this.last
    L.removeFromParent()
    return L
  }
  // push a new last child into an environment.
  push ( L ) { return this.insertChild( L, this.children().length ) }
  // remove and return the first child from an environment.
  shift () {
    let L = this.first
    L.removeFromParent()
    return L
  }
  // push a new first child into an environment.
  unshift ( L ) {
    return this.insertChild( L, 0 )
  }
  // just syntactic sugar
  child ( n ) {
    return this.children()[n < 0 ? this.children().length + n : n]
  }
  // LCmapArrays applies a function f which returns an array of LCs to all
  // of the LCchildren of this environment, then replaces each child c with
  // ...f(c).
  //
  // Note: if the same LC appears more than once among the arrays f(c) it must
  // be distinct copies of the same LC since the same LC cannot exist at more
  // than one index in an enviroment.
  //
  LCmapArrays ( f ) {
     let i = 0
     // console.log('evaluating '+this)
     while ( i < this.children().length ) {
       // console.log('i is '+i)
       let newkids = f( this.child( i ) )
       // console.log('newkids is '+newkids)
       // console.log(`(is it an array? ${newkids instanceof Array }`)
       let n = newkids.length
       // console.log(`newkids length is ${n}`)
       this.removeChild( i )
       // console.log('removed a child to get '+this)
       for ( let j = 0 ; j < n ; j++ ) {
         this.insertChild( newkids[j], i )
         // console.log(`inserting child ${newkids[j]} at ${i} to make ${this}`)
         i++
       }
     }
  }

  // LCs have the isAGiven boolean, which defaults to false.
  // We also define the isAClaim boolean, which is !isAGiven.
  get isAGiven () { return this.getAttribute( 'given' ) === true }
  set isAGiven ( value ) {
    if ( value ) {
      this.setAttribute( 'given', true )
      return true
    } else {
      this.clearAttributes( 'given' )
      return false
    }
  }
  get isAClaim () { return !this.isAGiven }
  set isAClaim ( value ) { return !( this.isAGiven = !value ) }

  // Does the LC have any descendant satisfying the given predicate?
  hasDescendantSatisfying ( predicate ) {
    return predicate( this ) || this.children().some( child =>
      child.hasDescendantSatisfying( predicate ) )
  }

  // The following are temporary sanity utilities until we can defined
  // separate subclasses for Expressions and Declarations and define a
  // separate tree for LC's that never has a Statement whose parent is a
  // Statement. These should be removed after we do that upgrade.

  // Despite our current implementation, we define the following 'actual'
  // entities in terms of the classes environment and statement:
  // Identifier: A statement with no children.
  // Statement: A statement which does not have a parent which is a statement.
  // Declaration: An environment with declaration attribute other than 'none'
  // Environment: An environment that is not an actual Declaration.

  // check if this LC is an actual Identifier (a Statement with no children)
  isAnActualIdentifier () { return this instanceof Statement &&
                             this.identifier &&
                             this.children().length === 0 }
  // check if this LC is an actual Declaration
  isAnActualDeclaration () { return this instanceof Environment &&
                             this.declaration && this.declaration !== 'none' }
  // check if this LC is a actual Statement (not a substatement of a statement)
  isAnActualStatement () { return this instanceof Statement &&
                                (!this.parent() ||
                                  this.parent() instanceof Environment ) }
  // check if this LC is a actual Environment (not an actual Declaration).
  isAnActualEnvironment () { return this instanceof Environment &&
                                   !this.isAnActualDeclaration() }
                                   // check if this LC is a actual Environment (not an actual Declaration).
  isAnActualQuantifier () { return this instanceof Statement &&
                                   this.isAQuantifier }
  // For FIC validation we only need the declaration's last argument LC.
  // We call this its 'value'. Everything else is its own value.
  value () { return this.isAnActualDeclaration() ? this.last : this }
  get isValidated () { return !!this.getAttribute( 'validation' ) }
  get isValid () {
    return this.getAttribute( 'validation' ).status
  }
  // avoid recursing into compound statements and declarations when
  // traversing the LC tree.
  LCchildren () {
    if ( this.isAnActualStatement() || this.isAnActualDeclaration() ) {
      return []
    } else {
      return this.children()
    }
  }

  // Statement LCs can contain metavariables, so here we provide a generic
  // routine for checking whether this LC or any statement inside it contains
  // a metavariable
  containsAMetavariable = () =>
    this instanceof Statement && this.isAMetavariable ||
    this.children().some( x => x.containsAMetavariable() )

  // Abstract-like method that subclasses will fix:
  toString () {
    return ( this.isAGiven ? ':' : '' )
         + 'LC('
         + this.children().map( child => child.toString() ).join( ',' )
         + ')'
  }
  // Add support for Jupyter notebooks
  _toHtml () {
    const escapeXML = ( text ) =>
      text.replace( /&/g, "&amp;" ).replace( /</g, "&lt;" )
          .replace( />/g, "&gt;" ).replace( /"/g, "&quot;" )
          .replace( /'/g, "&#039;" )
    return `<pre>${escapeXML(this.toString())}</pre>`
  }
  // for converting Jupyter notebooks to LaTeX/PDF
  _toMime () {
    const escapeMath = ( text ) =>
      text.replace( / /g, '~' ).replace( /{/g, '\\{' ).replace( /}/g, '\\}' )
          .replace( /[:]/g, '{:}' )
    return { "text/latex": `$${escapeMath( this.toString() )}$` }
  }

  // Abstract-like method that subclasses will fix:
  toOM () {
    return this.copyFlagsTo( OM.app( OM.sym( 'LC', 'Lurch' ),
      ...this.children().map( child => child.toOM() ) ) )
  }
  // And its helper functions, which subclasses can use, too:
  copyFlagsTo ( om ) {
    if ( this.isAGiven )
      om.setAttribute( OM.sym( 'given', 'Lurch' ), OM.str( 'true' ) )
    if ( this.isAFormula )
      om.setAttribute( OM.sym( 'formula', 'Lurch' ), OM.str( 'true' ) )
    return om
  }
  copyFlagsFrom ( om ) {
    let given = om.getAttribute( OM.sym( 'given', 'Lurch' ) )
    this.isAGiven = !!given && given.value == 'true'
    if ( this instanceof Environment ) {
      let formula = om.getAttribute( OM.sym( 'formula', 'Lurch' ) )
      this.isAFormula = !!formula && formula.value == 'true'
    }
    return this
  }

  // For FIC derivations we only care about certain attributes of an LC
  // So we need to write a new function just for this purpose.
  // This will be used in FIC Rule (S), namely Gamma, A |- A
  // Note that when applying Rule (S) we will convert all of the premises
  // that are Givens to Claims, so we can let this routine treat the Given
  // attribute as meaningful.
  hasSameMeaningAs ( other ) {
    // Check if they are the same class of object
    if (this.constructor !== other.constructor) return false
    // they have to have the same number of children
    let numkids = this.children().length
    if (numkids != other.children().length) return false
    // if they do and it's positive, then just check if the children are equal
    if (numkids>0) {
      for (let i=0; i<numkids; i++)
        if (!this.children()[i].hasSameMeaningAs(other.children()[i]))
          return false
    }
    // Check if the attributes that define an LC are the same
    // (and nothing else).
    const LCattr = [ 'declaration', 'quantifier', 'formula', 'identifier',
                     'given', 'metavariable' ]
    let ours = this.attributes
    let theirs = other.attributes
    for (let i=0; i<LCattr.length; i++) {
      let p = LCattr[i]
      if ( ours.hasOwnProperty(p) && !theirs.hasOwnProperty(p) ||
          !ours.hasOwnProperty(p) &&  theirs.hasOwnProperty(p) ||
           ours.hasOwnProperty(p) &&  theirs.hasOwnProperty(p) &&
           ours[p] !== theirs[p]) return false
    }
    return true
  }

  // A utility to check if two declarations have the same type (constant or
  // variable) and declare the same identifiers in the same order.
  hasSimilarForm ( A ) {
    if ( A.isAnActualDeclaration() && this.isAnActualDeclaration() &&
         A.declaration === this.declaration &&
         A.children().length === this.children().length ) {
      let n = A.children().length
      // By our newly discussed convention, declarations with one child don't
      // declare any identifiers.  The last child is always assumed to be the
      // value
      if (n === 1) { return true }
      for (let i=0; i<n-1; i++) {
        if (!A.children()[i].hasSameMeaningAs(this.children()[i])) {
          return false
        }
      }
      return true
    } else {
      return false
    }
  }

  // We can ask whether a given LC is a conclusion in one of its ancestors.
  isAConclusionIn ( ancestor ) {
    if ( !( this.isAnActualStatement() ) ) return false
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

  // The fully parenthesized form of an LC L = { L1 L2 ... Ln } is the form
  // { L1 { L2 ... { Ln-1 Ln } ... } }.
  // The formula and given statuses of the original L are copied over.
  // The following routine computes this, which involves making copies of each
  // Li, so that we do not destroy/alter the original LC L.
  fullyParenthesizedForm () {
    if ( this.LCchildren().length < 3 ) return this.copy()
    let kids = this.LCchildren().slice()
    let result = new Environment( kids[kids.length-2].copy(),
                                  kids[kids.length-1].copy() )
    kids.pop()
    kids.pop()
    while ( kids.length > 0 )
      result = new Environment( kids.pop().copy(), result )
    result.isAFormula = this.isAFormula
    result.isAGiven = this.isAGiven
    return result
  }

  // The FIC normal form of an LC has a lengthy definition.  We repeat it in
  // the comments inside the implementation, below, to keep the documentation
  // near the code.  Note that the intended use is that all formulas will
  // be replaced by non-Formula environments whose variables are replaced by
  // metavariables before running through the FIC recursions with Matching.
  normalForm () {
    if (this.isAFormula) { throw('Normal form for Formulas is not defined.') }
    // debug( '** N('+this+'):' )
    // If this is a declaration, only normalize its value.
    if ( this.isAnActualDeclaration() ) {
      let D = this.copy()
      D.last.replaceWith( D.last.normalForm() )
      return D
    }
    let say = ( x ) => {
      // console.log( `** = ${x}` )
      return x
    }
    let fpf = this.fullyParenthesizedForm()
    // debug( '** FPF = '+fpf )
    // If fpf is a statement, then that's the normal form.
    if ( fpf instanceof Statement ) return say( fpf )
    // debug( '** It was not a Statement' )
    // An LC is said to be Empty if it is and environment with
    // no children.
    let isEmpty = ( x ) => x instanceof Environment && x.children().length == 0
    // An LC is said to be Trivial iff it is either Given or its
    // normal form is Empty.
    let isTrivial = ( x ) => x.isAGiven || isEmpty(x.normalForm())
    // The normal form of a Trivial fpf is Empty. This takes care of { },
    // { A } when A is Trivial, and { A B } where both A and B are Trivial.
    if ( fpf.children().every( child => isTrivial( child ) ) )
      return say( new Environment() )
    // debug( '** It was not a Type 1' )
    // If A is nonTrivial, and B is Trivial, then { A } and { A B }
    // have normal form N(A).
    if ( fpf.children().length == 1
      || fpf.children().length == 2 &&
         isTrivial( fpf.child( 1 ) ) ) {
      let NA = fpf.first.normalForm()
      NA.isAGiven = fpf.isAGiven
      return say( NA )
    }
    // Also A is nonTrivial and N(B) is Empty, { B A }
    // also has normal form N(A).
    if ( isEmpty( fpf.first.normalForm() ) ) {
      let NA = fpf.child( 1 ).normalForm()
      NA.isAGiven = fpf.isAGiven
      return say( NA )
    }
    // debug( '** It was not Type 2' )
    // If none of the above cases apply, then fpf has two children, call them
    // A and B, with normal forms NA and NB, respectively, and its normal form
    // fits one of these cases:
    //  { A B } ->  { NA NB }     { :A B } ->  { :NA NB }
    // :{ A B } -> :{ NA NB }    :{ :A B } -> :{ :NA NB }
    let NA = fpf.first.normalForm()
    let NB = fpf.child( 1 ).normalForm()
    // debug( '** NA = '+NA )
    // debug( '** NB = '+NB )
    let result = new Environment( NA, NB )
    result.isAGiven = fpf.isAGiven
    return say( result )
  }

  // Reverse operation of the toString() functions defined below.
  // One exception: You can include //...\n one-line JS-style comments,
  // which will, of course, be ignored when parsing.
  static fromString ( string ) {
    const ident = /^[a-zA-Z_0-9]+/
    const comment = /^\/\/[^\n]*\n|^\/\/[^\n]*$/
    var match
    let stack = [ ]
    let quantifier = false
    let given = false
    let position = 0
    let setFlags = ( x ) => {
      x.isAQuantifier = quantifier
      x.isAGiven = given
      quantifier = false
      given = false
      return x
    }
    // possible values of last: null : ~ identifier { } ( ) [ ] space
    let last = null
    let munge = ( n ) => {
      last = string.substring( 0, n )
      string = string.substring( n )
      position += n
    }
    let stop = ( msg ) => {
      throw( `Error at position ${position} `
           + `(near "${string.substring(0,10)}"): ${msg}` )
    }
    let follows = ( ...list ) => {
      return list.some( element => last == element )
    }
    while ( string.length > 0 ) {
      // console.log( `@${position} reading "${string}"` )
      // console.log( '\tstack: ' + stack.map( x => x.toString() ).join( '; ' ) )
      if ( match = comment.exec( string ) ) {
        if ( follows( '~', ':' ) )
          stop( `Found a ${last} marker immediately before a comment` )
        munge( match[0].length )
      } else if ( string[0] == ':' ) {
        if ( !follows( null, 'space', '~', '{', '}', '[', ']' ) || given )
          stop( 'Found a given marker (:) in the wrong place' )
        given = true
        munge( 1 )
      } else if ( string[0] == '~' ) {
        if ( !follows( null, 'space', ':', '{', '(', '[' ) || quantifier )
          stop( 'Found a quantifier marker (~) in the wrong place' )
        quantifier = true
        munge( 1 )
      } else if ( string[0] == '{' ) {
        if ( quantifier )
          stop( 'Trying to mark an environment as a quantifier' )
        if ( stack.some( entry => entry._lastStatementHead ) )
          stop( 'Found an environment open bracket ({) inside a statement' )
        let E = setFlags( new Environment() )
        E._lastOpenBracket = true
        stack.push( E )
        munge( 1 )
      } else if ( string.substring( 0, 4 ) == 'Let{' ) {
        if ( quantifier )
          stop( 'Trying to mark an environment as a quantifier' )
        if ( stack.some( entry => entry._lastStatementHead ) )
          stop( 'Found an environment open bracket ({) inside a statement' )
        let E = setFlags( new Environment() )
        E._wantsToBeALet = true
        E._lastOpenBracket = true
        stack.push( E )
        munge( 4 )
        last = '{'
      } else if ( string.substring( 0, 8 ) == 'Declare{' ) {
        if ( quantifier )
          stop( 'Trying to mark an environment as a quantifier' )
        if ( stack.some( entry => entry._lastStatementHead ) )
          stop( 'Found an environment open bracket ({) inside a statement' )
        let E = setFlags( new Environment() )
        E._wantsToBeADeclare = true
        E._lastOpenBracket = true
        stack.push( E )
        munge( 8 )
        last = '{'
      } else if ( string[0] == '}' ) {
        if ( given || quantifier )
          stop( 'Either : or ~ (or both) tried to modify a close bracket (})' )
        if ( stack.some( entry => entry._lastStatementHead ) )
          stop( 'Found an environment close bracket (}) inside a statement' )
        if ( !stack.some( entry => entry._lastOpenBracket ) )
          stop( 'Found a close bracket (}) outside of any environment' )
        let args = [ ]
        do { args.unshift( stack.pop() ) } while ( !args[0]._lastOpenBracket )
        // console.log( '\targs: ' + args.map( x => x.toString() ).join( '; ' ) )
        if ( args[0].isAFormula )
          stop( 'Open formula bracket ([) ended with environment bracket (})' )
        while ( args.length > 1 ) { args[0].insertChild( args.pop() ) }
        delete args[0]._lastOpenBracket
        if ( args[0]._wantsToBeALet ) {
          // console.log( '\tBuilt: '+args[0] )
          if ( !args[0].canBeADeclaration() )
            stop( 'Tried to apply Let to a non-declaration environment' )
          args[0].declaration = 'variable'
          delete args[0]._wantsToBeALet
        }
        if ( args[0]._wantsToBeADeclare ) {
          // console.log( '\tBuilt: '+args[0] )
          if ( !args[0].canBeADeclaration() )
            stop( 'Tried to apply Declare to a non-declaration environment' )
          args[0].declaration = 'constant'
          delete args[0]._wantsToBeADeclare
        }
        stack.push( args[0] )
        // console.log( '\tstack: ' + stack.map( x => x.toString() ).join( '; ' ) )
        munge( 1 )
      } else if ( string[0] == '[' ) {
        if ( quantifier )
          stop( 'Trying to mark a formula as a quantifier' )
        if ( stack.some( entry => entry._lastStatementHead ) )
          stop( 'Found a formula open bracket ([) inside a statement' )
        let E = setFlags( new Environment() )
        E._lastOpenBracket = true
        E.isAFormula = true
        stack.push( E )
        munge( 1 )
      } else if ( string[0] == ']' ) {
        if ( given || quantifier )
          stop( 'Either : or ~ (or both) tried to modify a close bracket (])' )
        if ( stack.some( entry => entry._lastStatementHead ) )
          stop( 'Found a formula close bracket (]) inside a statement' )
        if ( !stack.some( entry => entry._lastOpenBracket ) )
          stop( 'Found a close bracket (}) outside of any environment' )
        let args = [ ]
        do { args.unshift( stack.pop() ) } while ( !args[0]._lastOpenBracket )
        // console.log( '\targs: ' + args.map( x => x.toString() ).join( '; ' ) )
        if ( !args[0].isAFormula )
          stop( 'Open environment bracket ({) ended with formula bracket (])' )
        while ( args.length > 1 ) { args[0].insertChild( args.pop() ) }
        delete args[0]._lastOpenBracket
        stack.push( args[0] )
        // console.log( '\tstack: ' + stack.map( x => x.toString() ).join( '; ' ) )
        munge( 1 )
      } else if ( match = ident.exec( string ) ) {
        let S = setFlags( new Statement() )
        S.identifier = match[0]
        stack.push( S )
        munge( match[0].length )
        last = 'identifier'
      } else if ( string[0] == '(' ) {
        if ( stack.length == 0 || stack.last() instanceof Environment )
          stop( 'Found an open paren not following an identifier' )
        stack.last()._lastStatementHead = true
        munge( 1 )
      } else if ( string[0] == ')' ) {
        if ( !stack.some( entry => entry._lastStatementHead ) )
          stop( 'Found a close parent outside a statement' )
        if ( given || quantifier )
          stop( 'Either : or ~ (or both) tried to modify a close paren' )
        let args = [ ]
        do { args.unshift( stack.pop() ) } while ( !args[0]._lastStatementHead )
        // console.log( '\targs: ' + args.map( x => x.toString() ).join( '; ' ) )
        while ( args.length > 1 ) { args[0].insertChild( args.pop() ) }
        delete args[0]._lastStatementHead
        stack.push( args[0] )
        // console.log( '\tstack: ' + stack.map( x => x.toString() ).join( '; ' ) )
        munge( 1 )
      } else if ( string[0] == ',' ) {
        if ( given || quantifier )
          stop( 'Either : or ~ (or both) tried to modify a comma' )
        if ( !stack.some( entry => entry._lastStatementHead ) )
          stop( 'Found a comma outside a statement' )
        munge( 1 )
        last = 'space'
      } else if ( /^ |^\t|^\n/.test( string[0] ) ) {
        munge( 1 )
        last = 'space'
      } else {
        stop( 'Unrecognized character' )
      }
    }
    if ( stack.length > 1 )
      stop( 'Unexpected end of input' )
    if ( stack.some( entry => entry._lastStatementHead ) )
      stop( 'Still amidst a statement at the end of the input' )
    if ( stack.some( entry => entry._lastOpenBracket ) )
      stop( 'Still amidst a formula or environment at the end of the input' )
    if ( given || quantifier )
      stop( 'Either : or ~ (or both) preceded the end of the input' )
    return stack[0]
  }

  // Reverse of toOM() function defined earlier
  static fromOM ( expr ) {
    // variables are Statements with identifiers
    if ( expr.type == 'v' ) {
      let result = new Statement()
      result.identifier = expr.name
      return result.copyFlagsFrom( expr )
    }
    // symbols are Statements that want to be quantifiers
    if ( expr.type == 'sy' ) {
      let result = new Statement()
      result.identifier = expr.name
      result.isAQuantifier = true
      return result.copyFlagsFrom( expr )
    }
    // The input may be an application...
    if ( expr.type == 'a' ) {
      // But they can't be empty
      if ( expr.children.length == 0 )
        throw( 'Empty OpenMath applications not supported' )
      // OM applications of the Environment symbol are environments
      if ( expr.children[0].equals( OM.sym( 'Env', 'Lurch' ) ) ) {
        let result = new Environment(
          ...expr.children.slice( 1 ).map( LC.fromOM ) )
        return result.copyFlagsFrom( expr )
      }
      // OM applications of other stuff ought to be Statements
      let children = expr.children.map( LC.fromOM )
      let result = children.shift()
      if ( !( result instanceof Statement ) || !result.isAtomic )
        throw( 'Invalid OpenMath application structure' )
      children.map( ( child, index ) => result.insertChild( child, index ) )
      return result.copyFlagsFrom( expr )
    }
    // The input may be a binding, in which case it ought to be a Statement
    if ( expr.type == 'bi' ) {
      let result = LC.fromOM( expr.symbol )
      expr.variables.map( v =>
        result.insertChild( LC.fromOM( v ), result.children().length ) )
      result.insertChild( LC.fromOM( expr.body ), result.children().length )
      return result.copyFlagsFrom( expr )
    }
    // Nothing else is convertible
    throw( 'Cannot convert this type of OpenMath structure to LC' )
  }

  // In order to use the FIC recursion for rules GR and GL we need
  // to make copies of the LC :A that is not a given.  This accomplishes that.
  // Note that this routine does not make a copy of something that is already
  // a claim.
  claim () {
      if ( this.isAClaim ) return this
      let copy = this.copy()
      copy.isAClaim = true
      return copy
  }

  // Validate!!  Here we go.
  validate ( withProof ) {
    // mark all declarations first.  We don't need to do anything else
    // with that here, because the only difference it will make is when
    // toString({ Scopes: true }) is called it will decorate bad variable
    // declarations
    this.markDeclarations()

    // fetch the conclusions - they are the only things we validte with FIC
    this.conclusions().forEach( C => {
      const T = new Turnstile( C.allAccessibles().map( A => A.claim() ), C )
      const right = { status: true, feedback: 'Good job!' }
      const wrong = { status: false, feedback: 'This doesn\'t follow.' }
      const result = T.firstDerivation( { withProofs: withProof } )
      if ( result && withProof )
        right.proof = result.proof
      else
        delete right.proof
      C.setAttribute( 'validation', result ? right : wrong )
    } )
  }

}

// While we're here, let's add some global utilities...
Array.prototype.last = function () { return this[this.length-1] }
Array.prototype.without = function ( i ) {
  return [ ...this.slice( 0, i ), ...this.slice( i+1 ) ]
}

module.exports.LC = LC

const { Statement } = require( './statement.js' )
const { Environment } = require( './environment.js' )
const { Turnstile } = require( '../classes/deduction.js' )
