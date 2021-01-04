
const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( '../dependencies/openmath.js' )
const { satSolve } = require( '../dependencies/LSAT.js' )

// const verbose = false
// let debug = ( ...args ) => { if (verbose) console.log( ...args ) }

class LC extends Structure {

  // register with Structure ancestor class for good serialization/copying
  className = Structure.addSubclass( 'LC', LC )

  // Structures can have attributes, but only some of them affect the meaning
  // of an LC.  We keep the list of such keys here.
  static LCkeys() { return [ 'declaration', 'quantifier', 'formula',
                                'identifier', 'given', 'metavariable' ]
  }

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
  // LCmapArrays applies a function f (which returns an array of LCs) to all
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
    let ours = this.attributes
    let theirs = other.attributes
    for (let i=0; i<LC.LCkeys().length; i++) {
      let p = LC.LCkeys()[i]
      if ( ours.hasOwnProperty(p) && !theirs.hasOwnProperty(p) ||
          !ours.hasOwnProperty(p) &&  theirs.hasOwnProperty(p) ||
           ours.hasOwnProperty(p) &&  theirs.hasOwnProperty(p) &&
           ours[p] !== theirs[p]) return false
    }
    return true
  }

  // When copying an LC we need to copy its LC attributes.
  copyLCattributes ( target ) {
    for (let i=0; i<LC.LCkeys().length; i++) {
      let p = LC.LCkeys()[i]
      if ( this.hasOwnProperty(p) ) {
        target.setAttribute(p, this.getAttribute(p) )
      }
    }
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
  // An LC is said to be emptu if it is an environment with no children.
  get isEmpty () { return this.isAnActualEnvironment() &&
                          this.children().length == 0 }

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

  // The Flat Form of an LC is intended to minimize the total number of
  // environments to make FIC recursion more efficient.
  //
  // Note that _flatForm() returns an array of LC's.  These can then be wrapped
  // in a single environment to get the actual flatForm of the LC. Thus it will
  // never return a statement, and should only be called on documents.

  // TODO: this is not debugged yet.  For one thing it should not destroy the
  // original LC
  flatForm () {
    // this does all of the work. lc is an LC. It returns an array of LCs.
    // which are the flatforms of the children
    let _flatForm = function ( _lc ) {
      let lc = _lc.copy()
      // console.log(`Calling _flatForm on ${lc}`)
      // console.log(`(is it an LC?) ${lc instanceof LC}`)
      // if the LC is an empty environment return an empty array.
      if ( lc.isEmpty ) { return [ ] }
      // if the LC is a statement, just return it in an array.
      if ( lc.isAnActualStatement() ) { return [ lc ] }
      // if lc is an environment - this is where all the work is done.
      // first flatten its LCchildren
      lc.LCmapArrays( _flatForm )
      // console.log(`Here it is with flattened kids: ${lc}`)
      // We want to now do three things:
      //
      //   (a) remove any givens from the end of the environment
      //   (b) pull out any claims from the beginning of the environment
      //   (c) if the last child is an environment, unwrap it
      //
      //  Note that after doing (c) we cannot produce more cases of (a) and (b)
      //  because the last child is already in flat Form, so if it is an
      //  environment, it has to either be empty or start with a given and end
      //  with a claim.  Thus we can do these in order.
      //
      // (a) remove any givens from the end of the environment:
      // console.log(`delete trailing givens from: ${lc.toString()}`)
      while ( lc.last && lc.last.isAGiven ) { lc.pop() }
      // console.log(`which results in: ${lc.toString()}`)
      //
      // (b) pull out any claims from the beginning of the environment
      let presults = [ ]
      // console.log(`Pull out claims from the beginning of: ${lc.toString()}`)
      while ( lc.first && lc.first.isAClaim ) {
         // console.log(`Pulling out the claim ${lc.first.toString()}`)
         presults.push( lc.shift() )
         // console.log(`  to obtain this ${lc.toString()}`)
         // console.log(`  with this array: ${presults.map(x=>x.toString())}`)
      }
      // (c) if the the last child is an environment, unwrap it
      // console.log(`pop terminal environments from ${lc.toString()}`)
      if ( lc.last && lc.last.isAnActualEnvironment() ) {
         let lastkid = lc.last
         lc.pop()
         lastkid.children().forEach( x => lc.push(x) )
      }
      // console.log(`  which produces this ${lc.toString()}`)
      // if lc is empty at this point, just delete it from the results
      if ( lc.isEmpty ) {
        // console.log(`we removed everything so delete ${lc.toString()}`)
        // console.log(`  and return this array: ${presults.map(x=>x.toString())}`)
        return presults
      } else {
        // console.log(`return whatever is left: ${lc.toString()}`)
        // console.log(`  tacked on to the end of this array: ${presults.map(x=>x.toString())}`)
        return [ ...presults , lc ]
      }
    }  // end of _flatForm

    // OK now we can use that function to return an actual LC instead of an
    // array. But we should save the LC attributes in case we mess it up.
    let savedAttributes = new Environment()
    this.copyLCattributes( savedAttributes )
    let ff = _flatForm( this )
    // console.log(`_flatForm returned [${ff}]`)
    // console.log(`  an array of length ${ff.length}`)
    // If the array does not contain a single environment, it had to
    // occur because we pulled out claims.
    // So wrap it back up, restoring the original attributes, and removing
    // the environment wrapper from the last entry, if present.
    if ( ff.length !== 1 || !ff[0].isAnActualEnvironment() ) {
      let ans = new Environment( ...ff )
      ans.copyLCattributes( savedAttributes )
      if ( ans.last && ans.last.isAnActualEnvironment() ) {
         let lastkid = ans.last
         ans.pop()
         lastkid.children().forEach( x => ans.push(x) )
      }
      // console.log(`returning ans: ${ff[0].toString()}`)
      return ans
    }
    // Otherwise just return it.
    // console.log(`returning ans: ${ff[0].toString()}`)
    return ff[0]
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
    const ident = /^[a-zA-Z_0-9⇒¬⇔→←=≠∈×⊆℘∩∪∀∃!∉∅\-+∘<>≤≥⋅]+/
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

  // Sometimes you want a copy that's guaranteed to be a given/claim
  claimCopy () {
    let copy = this.copy()
    copy.isAClaim = true
    return copy
  }
  givenCopy () {
    let copy = this.copy()
    copy.isAGiven = true
    return copy
  }
  // In order to use the FIC recursion for rules GR and GL we need
  // to make copies of the LC :A that is not a given.  This accomplishes that.
  // Note that this routine does not make a copy of something that is already
  // a claim.
  claim () { return this.isAClaim ? this : this.claimCopy() }
  given () { return this.isAGiven ? this : this.givenCopy() }

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

  //
  // SAT validation
  //
  // The above recursive validation is extremely slow and inefficient. I think
  // it is at best exponential growth (and maybe worse). Here we implement
  // another method of validation.  We assume classical logic, and interpret
  // the LC's as a proposition where { :A B } means A=>B and { A B } means
  // 'A and B', and convert any LC to CNF.

  // First, we make a catalog that numbers all of the statements.
  // Given an lc it returns
  // an array of statements contained in that lc, where no statement can appear
  // more than once. The value assigned to each statement is one more than its
  // index in its catalog (because it can't be zero).
  catalog () {
    let s=this.toString().replace(/:/g,'')
    // if its a statement, catalog it
    if (this.isAnActualStatement()) { return [ s ]
    // otherwise if it's an environment. Catalog its children in one big catalog
    } else {
      let A = this.LCchildren().map(x=>x.catalog()).flat()
      let ans = new Set(A)  // remove duplicates
      return Array.from(ans)
    }
  }

  // CNF - we need to convert an environment LC to its CNF in the format accepted
  // by SAT.js. It returns an array of arrays of non-zero integers.

  // We need to pass it an optional catalog in order to call it recursively.
  // For efficiency, our clauses will be js Sets.  These can be converted to
  // arrays before sending them to satSolve()
  toCNF (_cat,_lvl) {
    // We need to replace statements with integers, so we have a catalog
    // if this is a recursive call, it should be passed as an argument
    let cat = _cat ? _cat : this.catalog()
    // for debugging we can optionally pass the level of recursion
    let lvl = _lvl ? _lvl : 0
    let ind = '  '.repeat(lvl)
    // N(x) is the encoded numerical value of statement x
    let N = (x) => cat.indexOf(x.toString().replace(/:/g,''))+1

    // store the clauses as sets of integers, and the cnf as an array of clauses
    let cnf = [ ]

    // debugging utility for pretty formatting
    let say = x => {
      let varname = t => t<0 ? '-'+cat[-t-1] : cat[t-1]
      if ( x instanceof Set) { return `[${Array.from(x).map(varname)}]` }
      else if ( x.length>0 && x[0] instanceof Set ) {
        return `[${x.map( y => '['+Array.from(y).map(varname)+']')}]` }
      else { return `[${x.map( y => '['+y.map( z => '['+Array.from(z).map(varname)+']')+']')}]` }
    }
    // make it easy to toggle on/off
    let debug =  (arg) => true // console.log(arg)

    debug(ind + `Checking ${this.toString()} with catalog ${cat}`)
    // console.log(`Catalog is ${cat}`)

    // we will need utilities for negating a cnf, and'ing two cnfs, and or'ing
    // two cnfs.  They should all share the same catalog, cat, and modify
    // it as needed.

    // andCNF is easy... just concat them
    let andCNF = (...cnfs) => {
      let ans = cnfs.reduce((A,B)=>A.concat(B),[])
      debug(ind + `  and: ${cnfs.map(say)} -> ${say(ans)}`)
      return ans
    }

    // for orCNF we want to use switch variables to reduce the number of terms
    // produced from the product |A||B| to the sum |A|+|B|.  This
    // reduces it from exponential growth to quadratic.  For now we will add a
    // switch variable for every cnf argument.  Later we can improve it
    // by handling cnf's with only one clause separately to avoid the extra
    // switch variable in that case.
    // let orCNF = (...cnfs) => {
    //   debug(ind + `  **> try to or: ${cnfs.map(say)}`)
    //   // add one new switch variable for each cnf being or'ed
    //
    //   // TODO: handle the case of cnfs with a single clause separately since
    //   // there is no efficiency gain from adding a switch variable for them
    //   let l=cat.length + 1
    //   let m=cnfs.length
    //   let zees = seq(x=>x,l,l+m-1)
    //   cat = cat.concat(zees)
    //   debug(ind + `  new cat is ${cat}`)
    //
    //   // start with the switch variables clause
    //   let ans = [ new Set(zees) ]
    //   // then add the negation of one switch variable per cnf to each of its
    //   // clauses
    //   for (let i=0; i<m; i++) {
    //     let z=new Set([-zees[i]])
    //     let C=cnfs[i]
    //     ans.push( ...C.map( x => union(z,x) ) )
    //   }
    //   debug(ind + `  or: ${cnfs.map(say)} -> ${say(ans)}`)
    //   return ans
    //
    //   // if |A| or |B| is 1, or if both are 2, then just distribute because
    //   // it's more efficient than adding another variable
    //   if ( A.length==1 || B.length==1 || (A.length==2 && B.length==2) ) {
    //     A.forEach( x => B.forEach( y => ans.push( union(x,y) ) ) )
    //   } else {
    //     debug(ind + `   (big boy mode)`)
    //     // otherwise add another variable to the catalog.  Dummy vars have
    //     // integer values rather than strings.
    //     let l=cat.length + 1
    //     cat.push(l)
    //     debug(ind + `   Adding variable. cat is now [${cat}]`)
    //     // add the new dummy variable to all of the elements of the first
    //     // array and add those to the answer array
    //     A.map( y => y.add(l) ).forEach( z => ans.push(z) )
    //     // add -l to all of the remaining sets and add them to ans array
    //     B.map( y => y.add(-l) ).forEach( z => ans.push(z) )
    //   }
    //   debug(ind + `  ${say(A)} or ${say(B)} -> ${say(ans)}`)
    //   return ans
    // }

    // // for orCNF we want to use switch variables to reduce the number of terms
    // // produced from the product |A||B| to the sum |A|+|B|.  This
    // // reduces it from exponential growth to quadratic
    let orCNF = (A,B) => {
      debug(ind + `    ** trying ${say(A)} or ${say(B)} `)
      // initialize the answer array
      let ans = [ ]
      // if |A| or |B| is 1, or if both are 2, then just distribute because
      // it's more efficient than adding another variable
      if ( A.length==1 || B.length==1 || (A.length==2 && B.length==2) ) {
        A.forEach( x => B.forEach( y => ans.push( union(x,y) ) ) )
      } else {
        debug(ind + `\n    (big boy mode)`)
        // otherwise add another variable to the catalog.  Dummy vars have
        // integer values rather than strings.
        let l=cat.length + 1
        cat.push(l)
        debug(ind + `    Adding a variable. cat is now [${cat}]`)
        // add the new dummy variable to all of the elements of the first
        // array and add those to the answer array
        A.map( y => new Set(y).add(l) ).forEach( z => ans.push(z) )
        // add -l to all of the remaining sets and add them to ans array
        B.map( y => new Set(y).add(-l) ).forEach( z => ans.push(z) )
      }
      debug(ind + `  ${say(A)} or ${say(B)} -> ${say(ans)}`)
      return ans
    }

    // negation
    let negCNF = (A) => {
       debug(ind + `    ** trying to negate ${say(A)}`)
       // check for a single clause
       if (A.length == 1) {
         let ans = Array.from( A[0] ).map( x => new Set( [-x] ) )
         debug(ind + `  not: ${say(A)} -> ${say(ans)}`)
         return ans
       }
       // otherwise or the negations of the clauses
       let ans = negCNF( [A[0]] )
       for (let i=1; i<A.length; i++) {
         ans = orCNF( ans , negCNF( [A[i]] ) )
       }

       debug(ind + `  not ${say(A)} -> ${say(ans)}`)
       return ans
    }

    // if the LC is a Statement, it's CNF is itself.
    if (this.isAnActualStatement()) {
      return this.isAGiven ? [ new Set([-N(this)]) ] : [ new Set([N(this)]) ]

    // so it's an environment (for now... declarations and formulas later??)
    } else if (this.isAnActualEnvironment()) {
      // start with an empty array
      cnf = [ ]
      let fpf = this.fullyParenthesizedForm()
      //
      let kids = fpf.LCchildren()
      // if it has no children there are no clauses to report
      if (kids.length == 0) return cnf

      // IMPORTANT: I got burned by this the first time around.  In order to use
      // switch variables to improve efficiency, we MUST check if the environment
      // is a given first, and deal with that leading negation first rather than
      // converting the children first and then negating the whole thing.  Switch
      // variables don't work in that scenario because they are only applying to
      // a subexpression.

      // then check if we have to negate the whole thing.
      if (fpf.isAGiven) {
        // one argument
        if (kids.length == 1) {
          let kid = kids[0].copy()
          // double negative
          kid.isAGiven = kid.isAGiven ? false : true
          return kid.toCNF()
        // two arguments because it's fpf
        } else {
           // negate both args
           let A=kids[0].copy()
           let B=kids[1].copy()
           A.isAGiven = A.isAGiven ? false : true
           B.isAGiven = B.isAGiven ? false : true
           // then check if they should be ORed or ANDed
           lvl++
           // if the first child is a given, it's an OR, so AND them
           if (kids[0].isAGiven) {
             return andCNF(A.toCNF(cat,lvl),B.toCNF(cat,lvl))
           // otherwise it's an AND, so OR them
           } else {
             return orCNF(A.toCNF(cat,lvl),B.toCNF(cat,lvl))
           }
        }
      // the environment is not a given
      } else {
        // one argument
        if (kids.length == 1) {
          return kids[0].toCNF()
        // two arguments because it's fpf
        } else {
           // check if they should be ORed or ANDed
           lvl++
           // if the first child is a given, OR them
           if (kids[0].isAGiven) {
             return orCNF(kids[0].toCNF(cat,lvl),kids[1].toCNF(cat,lvl))
           // otherwise it's an AND
           } else {
             return andCNF(kids[0].toCNF(cat,lvl),kids[1].toCNF(cat,lvl))
           }
        }
      }
    }
    throw(`We don't handle that yet`)
  }

  // toCNF does all the work, but CNF converts it to the format
  // needed by satSolve
  CNF () { return this.toCNF().map( x => Array.from(x) ) }

  // This is the WRONG way to do this but it's ok for our purposes for now
  // We should really upgrade toCNF to use a CNF class object, not recompute the
  // number of variables after the fact
  static numvars (_CNF) {
    let cnf = _CNF ? _CNF.flat() : this.CNF().flat()
    return Math.max(Math.max(...cnf),Math.abs(Math.min(...cnf)))
  }

  Validate () {
    let debug=console.log
      let start= new Date
    debug(`Starting validation...`)
      let L=this.copy()
    L.isAGiven = this.isAGiven ? false : true
      let t1=new Date
      debug(`Copy the LC: ${(t1-start)/1000} seconds`)
    let cnf = L.CNF()
    let n = LC.numvars(cnf)
      let t2=new Date
      debug(`Convert to CNF: ${(t2-t1)/1000} seconds`)
    let ans=!satSolve(n,cnf)
    let t3=new Date
      debug(`Run SAT: ${(t3-t2)/1000} seconds`)
    return ans
  }

} // end of LC class definition

// The annoyance with satSolve is we need both the CNF and the number of variables
// So we wrap them up in their own class. TODO (use this :))
class CNF {

  constructor (cnf,cat) {
    this.value = cnf    // should be an array of sets of integers
    this.catalog=cat    // should be an array of the toString form of lc
                        // statements without any :'s
  }

  // converts an array of sets of integers to an array of arrays
  toArrays () {
    return this.value.map( x => Array.from(x) )
  }
  // the logical operators we need for manipulating CNFs
  static and () {
    return true
  }

  and () {
   return false
  }

}

// While we're here, let's add some global utilities...
Array.prototype.last = function () { return this[this.length-1] }
Array.prototype.without = function ( i ) {
  return [ ...this.slice( 0, i ), ...this.slice( i+1 ) ]
}

// it is nice to have set union.  This implementation returns a new Set
const union = (...sets) => {
    return new Set( sets.map( x=>Array.from(x) ).reduce( (A,B)=>A.concat(B),[] ) )
}

// it is also nice to have the subset relation.  This works for arrays as well
// as js Sets (both can have 'duplicate' elements in some situations, like a
// Set of Sets). The optional argument 'tester' is a boolean function that tests
// when two elements are equal.
const subset = (_A,_B,same = (x,y) => x===y ) => {
   let A = Array.from(_A)
   let B = Array.from(_B)
   return A.every( x => B.some( y => same(x,y)))
}

// it is also nice to have the set equality, which we can use
const setequals = (A,B,same = (x,y) => x===y) => {
   return (subset(A,B,same) && subset(B,A,same))
}

// sorry... the Aging Mathematician is too used to this Maple command.
const seq = (f,start,end,inc=1) => {
    let ans = []
    for (let x=start; x<=end; x += inc || 1) { ans.push( f(x) ) }
    return ans
}


module.exports.LC = LC
module.exports.CNF = CNF
module.exports.union = union
module.exports.subset = subset
module.exports.setequals = setequals
module.exports.seq = seq

const { Statement } = require( './statement.js' )
const { Environment } = require( './environment.js' )
const { existsDerivation, firstDerivation } =
       require( '../classes/deduction.js' )
const { Turnstile } = require( '../classes/deduction.js' )
