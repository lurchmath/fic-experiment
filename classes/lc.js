const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( '../dependencies/openmath.js' )
const { satSolve } = require( '../dependencies/LSAT.js' )
const util = require('util')
const chalk = require('chalk')
const print = console.log

const verbose = true
let debug = ( ...args ) => { if (verbose) console.log( ...args ) }

/////////////////////////////////////////////
//
// Global profiling utility
//
// Times is an object whose keys are the names of subroutines
// and whose values are the total amount of time that routine was executed
let Times = {}       // global
let StartTimes = {}  // global
// TimerStart saves the current time globally. Then TimerStop adds it to
// the Times table.  If the start time is already set, don't update it
// (for recursive calls).  This is done by TimerStart returning true if
// it is a recursive call, and false if it is not a recursive call.
//
//  Usage: To time a function first make a local variable at the top
//
// ////////////////////
// let recursive = TimerStart(fname)
// ////////////////////
//
//  where fname is the name you want to give the function (it doesn't
//  have to match any js name of the function.  It can be any string).
//  Then just before returning, call
//
// ////////////////////
// TimerStop(fname,recursive)
// ////////////////////
//
let TimerStart = (fname) => {
        // check if timing is a recursive call
        if (!StartTimes.hasOwnProperty(fname)) {
           StartTimes[fname] = new Number(process.hrtime.bigint())/1000000
           return false
        // if it is recursive, just return true and do nothing else
        } else {
          return true
        }
      }
let TimerStop = (fname,recursive) => {
   // should not do anything if it's a recursive call
   if (!recursive) {
     let time = new Number(process.hrtime.bigint())/1000000 - StartTimes[fname]
     if (Times.hasOwnProperty(fname)) {
       Times[fname]=Times[fname]+time
     } else {
       Times[fname]=time
     }
     delete StartTimes[fname]
   }
 }

// const { MatchingProblem, MatchingSolution } = require( './matching.js' )
let MatchingProblem, MatchingSolution

class LC extends Structure {

  // register with Structure ancestor class for good serialization/copying
  className = Structure.addSubclass( 'LC', LC )

  // inspecting LCs at the node prompt
  inspect (depth=null) { console.log(util.inspect(this,false,depth,true)) }

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
  // Syntactic sugar.  Calling X.child(1,0,3) returns
  // X.child(1).child(0).child(3).
  // Without this we would need X.children()[1].children()[0].children()[3]
  child ( ...indices ) {
    return indices.reduce( (x,n) =>
           x=x.children()[n < 0 ? this.children().length + n : n],this)
    // return this.children()[n < 0 ? this.children().length + n : n]
  }

  // We have getAttribute() and setAttribute() from the Structure class
  // but not hasAttribute().
  hasAttribute ( key ) {
    return this.attributes.hasOwnProperty(key)
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

  // Returns an array containing all descendants satisfying the given predicate.
  // It does check the descendants of a decendant that satisfies the predicate.
  // It does not drill down into statements too, so whatever predicate you
  // supply should specify exactly what it's looking for.
  descendantsSatisfying ( predicate ) {
    let ans=[]
    if ( predicate(this) ) ans.push(this)
    this.children().forEach( x => {
       ans = ans.concat( x.descendantsSatisfying( predicate ) )
    } )
    return ans
  }

  // check if this is an EE
  get isEE () { return this.hasAttribute('EE') && this.getAttribute('EE') }
  // check if this is the descendant of an EE
  // (even if it is inside a compound Statement)
  get inEE () {
    let here = this
    // check if this is an EE
    if ( here.isEE ) { return true }
    // otherwise check its ancestors
    while ( here.parent() ) {
      here=here.parent()
      if ( here.isEE ) { return true }
    }
    return false
  }

  // returns an array containing all constants in the LC.  Here, a constant
  // is something declared by a constant declaration that is not inside the
  // declaration itself (see isAnActualConstant() )
  constants ( ignoreEmpty ) { return this.descendantsSatisfying(
    x => x.isAnActualConstant( ignoreEmpty )
  )}

  // Skolemize all constant names.  Currently this just appends '_n" where n
  // is the ID of the constant declaration that declares the constant.
  // Eventually this might be replaced with something better that prevents
  // accidental name conflics if the user e.g. happens to enter c_3 as a
  // variable name.
  //
  // Note that Declarations with the same constants and bodies get the same ID
  // and Declarations that have no body do not get their constants Skolemized,
  // because they are just declaring constants that have no particular
  // properties associated with them to prevent them from being used as bound
  // variables.
  skolemize ( ) {
    this.constants(true).forEach( x => {
      x.setAttribute('username', x.identifier )
      x.identifier += '_'+x.scope().getAttribute('ID')
    })
  }

  // We assign a unique ID to all of the constant declarations
  // (but identical declarations with the same propositional form
  // share the same ID).
  markIDs ( ) {
    let constDecs = this.descendantsSatisfying( x => {
      return x.isAnActualDeclaration() && x.declaration === 'constant'
    } )
    // keep track of duplicates
    let cat = {}
    let ID = 0
    constDecs.forEach( x => {
      // get the prop form as a claim
      let prop = x.propositionalForm()
      // Remove leading ;'s if present since the ID will be the same either way
      prop = ( prop[0]===':' ) ? prop.slice(1) : prop
      if (cat.hasOwnProperty(prop)) {
        x.setAttribute( 'ID' , cat[prop] )
      } else {
        cat[prop]=ID
        x.setAttribute('ID',ID++)
      }
    })
  }

  // Add the relevant existential elimination axioms for each constant declaration
  // to the top of the document.
  // - it requires that addIDs has already been run
  // - markDeclarations and Skolemize should be run after this
  //
  // The copies of the declarations in the EEs are flagged with the attribute
  // 'EE'=true.
  //
  //  While technically not EEs, we also add these for Let{} declarations
  //  to make their bodies available outside of the declaration itself.
  //  Duplicate EEs are omitted.
  //
  addEEs ( ) {
    // only works on environments
    if (this.isAnActualEnvironment) {
      // get the list of all declarations
      let allDecs = this.descendantsSatisfying( x => x.isAnActualDeclaration() )
      // keep track of duplicates
      let cat = {}
      // check each duplicate to see if it needs an EE
      allDecs.forEach( x => {
        if (!x.last.isEmpty) {
          // see if we already have this EE
          let prop = x.propositionalForm()
          // remove leading : if it is there since the EEs are the same
          prop = ( prop[0]===':' ) ? prop.slice(1) : prop
          if (!cat.hasOwnProperty(prop)) {
            // build the EE
            let EE = new Environment()
            EE.isAGiven = true
            // This should copy the ID attribute too, which is what we want.
            EE.push(x.givenCopy())
            let body = x.last.claimCopy()
            EE.push(body)
            EE.setAttribute('EE',true)
            // add the EE at the start of the environment as the first child
            this.unshift( EE )
            // and add it to our temporary catalog to prevent further duplication
            cat[prop] = EE
          }
        }
      })
    }
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
  // check if this LC is a actual Quantifier.
  isAnActualQuantifier () { return this instanceof Statement &&
                                   this.isAQuantifier }
  // check if this LC is a actual constant
  // if ignoreEmpty is true, ignore constants declared by declarations with
  // an empty body
  isAnActualConstant ( ignoreEmpty ) {
     // debug(`Checking ${this+''}`)
     if (!(this instanceof Statement)) return false
     let scope = this.scope()
     // debug(`it has scope ${scope+''}`)
     return scope.isAnActualDeclaration() &&
            scope.declaration === 'constant' &&
            !scope.isAncestorOf(this) &&
            !( ignoreEmpty && scope.last.isEmpty )
  }

  // For FIC validation we only need the declaration's last argument LC.
  // We call this its 'value'. Everything else is its own value.
  value () { return this.isAnActualDeclaration() ? this.last : this }

  // FIC validation uses lower case 'v' names
  get isvalidated () { return !!this.getAttribute( 'validation' ) }
  get isvalid () {
    return this.getAttribute( 'validation' ).status
  }
  // SAT validation uses upper case 'V' names
  get isValidated () { return this.hasAttribute( 'Validation' ) }
  get isValid () {
    return this.getAttribute( 'Validation' )
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
  // This is just a utility for syntactic sugar.  It isn't efficient.
  // If it becomes heavily relied on (it's not yet) we should rewrite it to
  // optimize it instead of doing the brute force thing below.
  isAConclusionIn ( ancestor , includeEnv ) {
    return ancestor.conclusions(includeEnv).includes(this)
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
  fullyParenthesizedForm (showtimes) {

    ////////////////////
    // let recursive = TimerStart('fpf')
    ////////////////////

      let debug = (msg) => { if (showtimes) console.log(msg) }
      let start= new Date
      debug(`Computing fully parenthesized form ...`)
    if ( this.LCchildren().length < 3 ) {
      // time the copying
      let thiscopy=this.copy()
      ////////////////////
      // TimerStop('fpf',recursive)
      ////////////////////
      return thiscopy
    }
    let kids = this.LCchildren().slice()
    let result = new Environment( kids[kids.length-2].copy(),
                                  kids[kids.length-1].copy() )
    kids.pop()
    kids.pop()
    while ( kids.length > 0 )
      result = new Environment( kids.pop().copy(), result )
    result.isAFormula = this.isAFormula
    result.isAGiven = this.isAGiven
      let fin = new Date
      debug(`... ${(fin-start)/1000} seconds`)

    ////////////////////
    // TimerStop('fpf',recursive)
    ////////////////////

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
  //
  static fromString ( string ) {
    const ident = /^[a-zA-Z_0-9⇒¬⇔→←=≠∈×⊆℘∩∪∀∃!∉∅\-+∘<>≤≥⋅⊥]+/
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
      '∃!' : 'existsunique' , '0' : 'zero'      , '1' : 'one'      ,
      '→←' : 'contradiction', '◼' : 'qed'
    }
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
        /////////////////////////////////////////
        // Adding body doubles for Let's
        // if ( args[0].isAnActualDeclaration() &&
        //      args[0].declaration === 'variable' &&
        //      args[0].isAGiven ) {
        //      stack.push( args[0].last.givenCopy() )
        // }
        /////////////////////////////////////////
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
          stop( 'Found a close bracket (]) outside of any environment' )
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
        S.identifier  = (match[0] in longnames) ? longnames[match[0]] : match[0]
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
    } // end while loop
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

  /////////////////////////////////////////////////////////////////////
  // Dumb Fast FIC
  //
  // The .validate() command is extremely complex and slow because it incorporates
  // matching and propositional validation recursively together. SAT Validation
  // below doesn't do Matching.  So we want to see how well it would work if
  // we do a fast FIC validation with no matching. This version is dumb - it does
  // it without any speed up tricks.  But it should be a lot faster than
  // .validate() so we can do benchmarking and decide if it's worth optimizing.


  // we need a utility first.  We say an LC is harmless if
  // (a) it's a statement or declaration (not an actual environment)
  // (b) it's a claim environment all of whose children are harmless
  get isHarmless () {
    if (this.isAnActualEnvironment() ) {
      if (this.isAGiven) { // by definition, it's not harmless
        return false
      } else {  // it's a claim environment, check the children
        return this.children().every( X => X.isHarmless )
      }
    }
    // it's a statement or declaration
    return true
  }

  dumbFIC () {

    // SAT is fast, and classically false implies intuitionistically false, so we
    // check that first.  Note that has to be a top level
    // environment
    let SAT = this.Validate()
    if (!SAT) return SAT

    // Base Case: if it's harmless, just return whatever SAT says
    if (this.isHarmless) { return SAT }

    // test each non-harmless child in order, drilling into claim environments as
    // necessary
    let n=this.children().length
    for (i=0;i<n;i++) {
      let kid = this.child(i)
      if (!kid.isHarmless) {
        if(kid.isAGiven) {
        }
      }
    }
    // couldn't find a proof
    return false
  }

  /////////////////////////////////////////////////////////////////////
  //
  // SAT validation
  //
  // The above recursive validation is extremely slow and inefficient. I think
  // it is at best exponential growth (and maybe worse). Here we implement
  // another method of validation.  We assume classical logic, and interpret
  // the LC's as a proposition where { :A B } means A=>B and { A B } means
  // 'A and B', and convert any LC to CNF.

  // Since { :A :B :C D } is effectively declaring A,B,C|-D, something of the
  // form { }, { :A } or { :A :B } are not something we need to validate,
  // and we will return True in that situation.
  //
  // Similarly, we will treat something of the form { A :B } as being
  // equivalent to { A } for Validation purposes, which in turn is equivalent
  // to just A.

  // An LC can compute its own cnf form, which is an array of js sets.
  // Each set should represent a clause in the cnf, and is the disjunction of
  // its elements.  The array containing the sets represents their conjunction.

  // For Statements, S, the cnf is [ X ] where X is a js set containing
  // S.toString(). These strings are eventually numbered for passing to
  // satSolve.

  // For Environments, E, we use the interpretations above to recursively
  // construct the cnf.

  // IMPORTANT NOTE:  We CANNOT cache these values for an
  // important reason.  Namely, if we do not use switch variables when computing
  // the cnf, we will have exponential growth in the number of terms.  But if we
  // do use switch variables, then the cnf form of a decendant of an LC depends
  // on it's ancestors.  This is because introducing switch variables produces a
  // cnf that is equisatisfiable but not logically equivalent.  If we cache
  // cnfs that are not logically equivalent to the original LC, then if we use
  // substitute those cnfs into a larger expression we can obtain a cnf which is
  // neither logically equivalent, nor equisatisfiable with, the larger
  // expression.  See the Infamous Bug Proposition in the testing suite for
  // an example.
  //
  // There is one caveate to note, however, that might be useful.  Supposed we
  // are validating an LC one claim at a time, so that for a particular claim C
  // we have effectively the LC L={:P1 ... :Pn C } where Pi are the accessibles
  // to C. When we incorporate matching and formulas to this, we will be
  // instantiating rules one at a time, and putting those instantiations onto the
  // list of premises to see if it validates. If we cache the cnf form of L,
  // it will be ok because we then combine that cnf with the one from L and
  // decide if we need to add one more switch variable.  The prior switch
  // variables will have been determined since we compute the cnf recursively
  // starting from the rightmost child, and tacking on one child at a time.

  // For efficiency, it's better to add an extra argument to cnf that tells us
  // whether that cnf should have its Given attribute toggled.  The reason this
  // is more efficient is because the cnf form of an LC is generally much larger
  // than the original LC, so negating the cnf's of the children of an Environment
  // is generally more time consuming than computing the cnf's of the negations
  // of the children (which in LC form is determined by the Given attribute).

  /////////////////////////////////////////////////////////////////////
  // CNF Utilities
  //
  // We need some obvious utilities. These will take arguments A,B which
  // should be cnf's of LC's, and an option switch variable when needed.
  //
  // andFast is easy... just concat them.
  // this does not check for duplicates
  static andFast = (A,B) => {
    // debug(`Computing AND of`)
    // debug(A,B)
    return A.concat(B) }

  // for orFast we want to use switch variables to reduce the number of terms
  // produced from the product |A||B| to the sum |A|+|B|.  This
  // reduces it from exponential growth to quadratic
  // The third argument is the name to use for a switch variable if needed.
  static orFast = (A,B,switchVar) => {
    // debug(`Computing OR of`)
    // debug(A,B)
    // if one of the cnfs is empty, just concat them
    if ( A.length===0 || B.length===0 ) {
      return A.concat(B)

    } else {
      // initialize the answer array
      let ans = [ ]

      // if |A| or |B| is 1, or if both are 2, then just distribute because
      // it's more efficient than adding a switch variable
      if ( A.length==1 || B.length==1 || (A.length==2 && B.length==2) ) {
        A.forEach( x => B.forEach( y => ans.push( union(x,y) ) ) )

      } else {
        // add the new switch variable to all of the elements of the first
        // array
        A.forEach( y => y.add(switchVar) )
        // add the negation of the switch variable to the remaining sets
        let negSwitchVar = LC.negateFast(switchVar)
        B.map( y => y.add(negSwitchVar) )
        // then just concatenate them
        ans = A.concat(B)
      }
      return ans
    }
  }

  // a leading ':' in a string can conveniently act as our negation symbol
  // so we want to be able to toggle it for variables.
  static negateFast = (str) => {
    // debug(`Negating the string ${str} ... returning `+
          // `${(str[0]===':') ? str.slice(1) : ':'+str}`)
    return (str[0]===':') ? str.slice(1) : ':'+str
  }

  // increment the subscript on the switchvar
  static nextSwitchVar = (switchVar) => {
    return 'Z'+(parseInt(switchVar.slice(1))+1)
  }

  // check if an LC is an ancestor of another one
  isAncestorOf (x) {
    let anc=x
     while (anc) {
       if (this===anc) { return true
       } else {
         anc = anc.parent()
       }
     }
     return false
  }
  // check if an LC is an ancestor of another one
  isDescendantOf (x) {
     return x.hasDescendantSatisfying( d => d==this )
  }
  // check if either this LC or one of it's ancestors is accessible to target
  hasAncestorAccessibleTo ( target ) {
    let here = this
    // check if this is an EE
    if ( here.isAccessibleTo( target ) ) { return true }
    // otherwise check its ancestors
    while ( here.parent() ) {
      here = here.parent()
      if ( here.isAccessibleTo( target ) ) { return true }
    }
    return false
  }
  // check if this LC should be considered to be a given for target
  // (syntactic sugar)
  isAGivenFor ( target ) { return this.isAccessibleTo(target) || this.isAGiven }

  // After markingDeclarations we can scan the whole thing to mark the scopes
  // of all identifiers throughout the LC (even in compound statements). We
  // store this in the 'declared by' attribute of the individual LC nodes.  Thus,
  // a compound statement like f(x,g(y)) will have a separate scopes
  // attribute stored for each of f, x, g, and y.
  //
  // This assumes you have called markDeclarations() on the surrounding LC so
  // scope information can be computed.
  // markScopes ( ) {
  //    // each time you encounter a Statement, mark its scope
  //    // debug(`Is ${this+''} an instance of Statement? `+
  //    //       `${(this instanceof Statement) ? 'Yes' : 'No'}`)
  //    if ( this instanceof Statement ) {
  //       // debug(`attributing ${this.toString()}`)
  //       this.setAttribute( 'declared by' , this.scope() )
  //    }
  //    // and whether it's a Statement, Environment, or Declaration, recursively
  //    // mark all it's children
  //    this.children().forEach( x => x.markScopes() )
  // }

  // for debugging ... a nice utility to print all the scopes of symbols
  // showAllScopes ( recursive = false ) {
  //   if (!recursive) {
  //     console.log(`\nShowing scopes for ${this+''}\n`)
  //     this.markDeclarations()
  //     this.markScopes()
  //   }
  //   if ( this instanceof Statement ) {
  //     let scp = this.getAttribute('declared by')
  //      console.log(
  //        `Symbol ${this.identifier} is declared by #${scp.getAttribute('ID')} = ${scp+''}`
  //      )
  //   }
  //   // and whether it's a Statement, Environment, or Declaration, recursively
  //   // mark all it's children
  //   this.children().forEach( x => x.showAllScopes( true ) )
  // }

  // prettyprint an LC with various options (see toString())

  show ( options = { Conc:true, Env: true, Bound:true, Indent:true, Color:true,
                     EEs:false, Skolem:false } ,
         ...args ) {
    // allow multiple option arguments to be combined into one
    let allopts = { ...options }
    for (let n=0;n<args.length;n++) allopts = { ...allopts , ...(args[n]) }
    // see if we have to markAll it to give the appropriate feedback
    if ( ( allopts.Skolem || allopts.EEs ) && !this.isMarked ) this.markAll()

    // We used to Validate if .show askes for Conc or Env, but we don't know
    // what the target should be anymore, so we no longer do this.
    // see if we have to Validate it to give the appropriate feedback
    // if ( ( allopts.Conc || allopts.Env ) && !this.isValidated ) this.Validate()

    // print the result
    console.log(this.toString( allopts ))
  }

  // check if this is already marked
  get isMarked ( ) {
    return this.hasAttribute('marked') && this.getAttribute('marked')
  }

  // This pre-processes an LC before validation by
  //
  // - mark all declarations (the scoping pass) as valid, invalid, and implicit
  // - assign ID numbers to all declarations
  // - skolemize all of the constants
  // - add the EE rules to the start of the environment
  // - set the attribute "marked" to 'true' so routines can check whether to
  //   run this or not.  Otherwise we will end up with extra EE clauses piling up.
  //
  // Note: these have to be run in this order for it to work correctly
  markAll () {
    // do nothing if it's already marked
    if ( this.isMarked ) return
    this.markIDs()
    this.addEEs()
    this.markDeclarations()
    this.skolemize()
    this.setAttribute('marked',true)
  }

  // Each actual Statement and actual Declaration has a propositonal form
  // which is a string that is the single propositional variable representing it
  // for the purposes of validation by SAT or FIC. Two LCs have the same
  // propositional form iff
  //
  //   (a) they have the same meaning and
  //   (b) are both contained in all of the same scopes.
  //
  // We currently use toString(options)to accomplish both (a) and (b).
  // See toString() for environments and statements for details.
  //
  // Currently this routine only works for (actual) Statements and Declarations.
  // because our current cnf routine works on Environments. In the future
  // we might upgrade this to give a propositional form to an environments too
  // and then convert those to cnfs.
  //
  // This routine assumes you have run this.markAll() already.
  propositionalForm ( options ) {
     if (this.isAnActualStatement() || this.isAnActualDeclaration()) {
       return this.toString( options )
     }
     // undefined if it's anything else.
     return undefined
  }

  ///////////////////////////////////////
  // cnf
  //
  // Recursively compute the cnf of an LC. The options argument is an object
  // that is passed along to propositionalForm() to determine which identifiers
  // should have be distinguished both by name and by scope, and which only
  // by name.  This is needed because Declarations need two propositional forms..
  // one to see if they match another Declaration (in which case the identifiers
  // they declare have propositional form that is their name only) and a second
  // one for the body of a declartion to be converted to cnf and be treated like
  // any other non-declaration LC.
  //
  // If the optional argument 'target' is present, validate just that conclusion
  // or environment (which also must be a 'conclusion'). Thus target has to be a
  // sub-LC of this LC and a conclusion or conclusion-environment.
  cnf (switchVar = 'Z0',toggleGiven = false, target = this ) {

    let debug = (msg) => console.log(msg)
    // debug(`Computing cnf of ${this+''} with target ${target+''}`)

    ///////////////////////////////////////////////////////////
    // FOR NOW WE DO THESE CASES SEPARATELY UNTIL IT'S DEBUGGED
    ///////////////////////////////////////////////////////////

    // the original way first:
    if ( !target.parent() ) {
    /////////////////////////////////////////////////////////////////////
    // Process Statements
    //

    // For Statements or Declarations it's just their propositional form
    // (or its negation) wrapped appropriately
    if (this.isAnActualStatement() || this.isAnActualDeclaration() ) {
      let str = (toggleGiven) ? LC.negateFast(this.propositionalForm( )) :
                                      this.propositionalForm( )
      return [ new Set( [ str ] ) ]

    // environments are where all the action is
    } else if (this.isAnActualEnvironment()) {

      /////////////////////////////////////////////////////////////////////
      // Process Environments
      //

      // get the kids
      let kids = this.LCchildren()

      // A generic environment will have the form
      // { :A1 :A2 ... B1 B2 ... :C1 :C2 ... etc }
      // but this is equivalent to the fullyParenthesized form
      // so we can just process it by popping off one argument at a time
      // from the right, converting that to a cnf, and continuing until
      // all the children are processed.

      let currentcnf = [ ]

      // determine if we negate the children
      let toggle = (this.isAGiven) ? !toggleGiven : toggleGiven

      // IMPORTANT: I got burned by this the first time around.  In order to use
      // switch variables to improve efficiency, we MUST check if the environment
      // is a given first, and deal with that leading negation first rather than
      // converting the children first and then negating the whole thing.  Switch
      // variables don't work correctly in that scenario.

      // Note: since cnfs tend to be messier than the original LC, it is generally
      // messier to work with cnfs than with LC's.  So for Given Environments,
      // we negate the LC children first, and then compute AND or OR of their
      // cnfs, rather than computing the cnfs first, and then negating those
      // before ORing them.

      // First, toss out any trailing Givens or claims that have empty
      // cnf until we either run out of kids or find the first one that is
      // nontrivial inside of an environment
      while (kids.length>0 && currentcnf.length === 0) {
        // if it's a given, just ignore it
        if (kids[kids.length-1].isAGiven) { kids.pop()
        // if it's not a given, see if it's trivial
        } else {
          currentcnf = kids.pop().cnf(switchVar,toggle)
        }
      }
      // then starting from the right, pop off the last argument, convert it
      // to a cnf, and combine it appropriately with the cnf computed so far
      while (kids.length>0) {
         let A = kids.pop()
         switchVar = LC.nextSwitchVar(switchVar)
         if (A.isAGiven !== toggle) {
           currentcnf = LC.orFast(A.cnf(switchVar,toggle),currentcnf,switchVar)
         } else {
           currentcnf = LC.andFast(A.cnf(switchVar,toggle),currentcnf)
         }
      }

      return currentcnf

    }

  // there is a target
  } else {
    // debug(`Computing cnf of `)
    // debug(this.show({ Color:true }))
    // debug(`with target`)
    // debug(target.show({ Color:true }))

    /////////////////////////////////////////////////////////////////////
    // Process Statements
    //

    // For Statements or Declarations it's just their propositional form
    // (or its negation) wrapped appropriately
    //
    // If a statement is not supposed to be included in the cnf of a particular
    // target this routine should not be asked for its cnf when processing an
    // environment. Additionally, any statement that is accessible to the target
    // must be treated as if it were a given the target is not accessible to
    // itself). So we have to check these cases:
    //  1. this is not accessible to the target,
    //     in which case we negate it iff toggleGiven is true
    //  2. this is accessible to the target and not equal to the target, in
    //     in which case we negate it iff toggleGiven is equal to this.isAGiven
    //
    if (this.isAnActualStatement() || this.isAnActualDeclaration() ) {
      // debug('It is a statement or declaration')
      let accessible = this.isAccessibleTo(target)
      let str = ( ( !accessible && toggleGiven ) ||
                  (  accessible && ( this.isAGiven===toggleGiven ) ) )
         ? LC.negateFast(this.propositionalForm( )) : this.propositionalForm( )

      return [ new Set( [ str ] ) ]

    // environments are where all the action is
    } else if (this.isAnActualEnvironment()) {

      /////////////////////////////////////////////////////////////////////
      // Process Environments
      //

      // get the kids
      let kids = this.LCchildren()

      // A generic environment will have the form
      // { :A1 :A2 ... B1 B2 ... :C1 :C2 ... etc }
      // but this is equivalent to the fullyParenthesized form
      // so we can just process it by popping off one argument at a time
      // from the right, converting that to a cnf, and continuing until
      // all the children are processed.

      let currentcnf = [ ]

      // determine if we negate the children
      let toggle = ( this.isAGivenFor( target ) ) ? !toggleGiven : toggleGiven

      // IMPORTANT: I got burned by this the first time around.  In order to use
      // switch variables to improve efficiency, we MUST check if the environment
      // is a given first, and deal with that leading negation first rather than
      // converting the children first and then negating the whole thing.  Switch
      // variables don't work correctly in that scenario.

      // Note: since cnfs tend to be messier than the original LC, it is generally
      // messier to work with cnfs than with LC's.  So for Given Environments,
      // we negate the LC children first, and then compute AND or OR of their
      // cnfs, rather than computing the cnfs first, and then negating those
      // before ORing them.

      // First, toss out any trailing Givens or claims that have empty
      // cnf until we either run out of kids or find the first one that is
      // nontrivial inside of an environment
      while (kids.length>0 && currentcnf.length === 0) {
        // if it's a given, or has no ancestor accessible to the target
        // and is not an environment containing the target, or
        // a descendant of the target, ignore it
        if ( kids[kids.length-1].isAGiven ||
             !( kids[kids.length-1].hasAncestorAccessibleTo( target ) ||
                kids[kids.length-1].isAncestorOf( target ) ||
                target.isAncestorOf(kids[kids.length-1]))
           ) {
          // debug(`Discarding as irrelevant:`)
          // debug(kids[kids.length-1].show({ Color:true }))
          kids.pop()
        // if it's not a given, see if it's trivial
        } else {
          // note: if this is non-empty, it has to either be the target or
          // an ancestor of the target, since the target or it's ancestor
          // will be reached before any accessible of the target that does
          // not contain it is reached.  Thus, this will return the partial-cnf
          // containing the cnf of the target.
          // debug(`Computing cnf of this:`)
          // debug(kids[kids.length-1].show({ Color:true }))
          // debug(`with target`)
          // debug(target.show({ Color:true }))
          currentcnf = kids.pop().cnf(switchVar,toggle,target)
        }
      }
      // then starting from the right, pop off the last argument, convert it
      // to a cnf, and combine it appropriately with the cnf computed so far
      while (kids.length>0) {
         let A = kids.pop()
         switchVar = LC.nextSwitchVar(switchVar)
         // if it is accessible to the target, or a given, treat it as a given
         if ( A.isAGivenFor( target ) !== toggle) {
           currentcnf = LC.orFast(A.cnf(switchVar,toggle,target),currentcnf,switchVar)
         } else {
           currentcnf = LC.andFast(A.cnf(switchVar,toggle,target),currentcnf)
         }
      }

      return currentcnf

    }
  }
  }

  // produce the cnf in the format required by satSolve
  // if toggle is true, negate it (since you want to show the negation is not
  // satisfiable)
  satcnf ( toggle = false , target ) {

    let s = x => x.replace(/:/g,'')
    let c = this.cnf(undefined,toggle,target)
    // debug(`The cnf produced is`)
    // debug(c)
    let cat = new Set()
    c.map( x => {
      x.forEach( z => {
        let sz = s(z)
        if (!cat.has(sz)) { cat.add(sz) }
      } )
    } )
    cat=Array.from(cat)
    let N = s => { return (cat.indexOf(s.replace(/:/g,''))+1)*((s[0]==':')?-1:1) }
    return c.map(x=>Array.from(x)).map(x=>x.map(N))
  }

  // Validate - using SAT
  //
  // targetlist - an optional array of LC's to validate. They must be subLC's
  //              of the one being Validated.
  // showtimes  - set to true for benchmarking info
  //
  Validate ( targetlist = [ this ], showtimes ) {
      let debug = (msg) => { if (showtimes) console.log(msg) }

      let start= new Date
      debug(`Starting validation... `)

    // for now, restrict this to top level environments only
    if ( !this.isAnActualEnvironment() || this.parent() ) {
       console.log('Only top level environments (with optional targets) can be validated.')
       return undefined
    }


    // We run this here just in case.  Running it twice should be idempotent.
    this.markAll()

    let ts=new Date
    debug(`Compute all scopes: ${(ts-start)/1000} seconds`)

    let globalans = true

    targetlist.forEach( X => {

      // Don't validate targets that are givens
      if (!X.isAGiven) {

        let t0=new Date

        // debug(`Validating target ${this.toString()} `)
        // debug(`Computing satsnf:`)

        let c = this.satcnf( true, X )

        // debug(`resulting satsnf:`)
        // debug(c)

        // if the target has an empty cnf, just call it true
        if (c.length === 0) {
          X.setAttribute('Validation',true)
        } else {

          let n = LC.numvars(c)

          let t1=new Date
          if (targetlist.length===1) {
            debug(`Convert to SAT cnf (fast): ${(t1-t0)/1000} seconds`)
          }
          let ans=!satSolve(n,c)

          globalans = globalans && ans

          let t2=new Date
          if (targetlist.length===1) {
            debug(`Run SAT: ${(t2-t1)/1000} seconds`)
          }
          X.setAttribute('Validation',ans)

        }
      }
    } )

    let finish = new Date
    debug(`\nValidated ${targetlist.length} LCs in ${(finish-start)/1000} seconds`)

    return globalans

  }

  // syntactic sugar
  ValidateAll ( showtimes ) {
     return this.Validate(this.conclusions(true) , showtimes)
  }

  // show the catalog of unique statement names contained in this LC
  catalog () {
    ////////////////////
    let recursive = TimerStart('catalog')
    ////////////////////

    let s=this.toString().replace(/:/g,'')
    // if its a statement, catalog it
    if (this.isAnActualStatement() || this.isAnActualDeclaration()) {
      ////////////////////
      TimerStop('catalog',recursive)
      ////////////////////
      return [ s ]
    // otherwise if it's an environment. Catalog its children in one big catalog
    } else {
      let A = this.LCchildren().map(x=>x.catalog()).flat()
      let ans = new Set(A)  // remove duplicates
      ////////////////////
      TimerStop('catalog',recursive)
      ////////////////////
      return Array.from(ans)
    }
  }

  // This is the WRONG way to do this but it's ok for our purposes for now
  // We should really upgrade toCNF to use a CNF class object, not recompute the
  // number of variables after the fact
  static numvars (_CNF) {
    let cnf = _CNF ? _CNF.flat() : this.cnf().flat()
    return Math.max(Math.max(...cnf),Math.abs(Math.min(...cnf)))
  }

  GeneralValidate ( validator, attributeKey, trueFlag, falseFlag,
                    targetList = [ this ] ) {
    // compute PreppedPropForm for all targeted conclusions:
    this.markAll()
    const prepped = PreppedPropForm.createFrom( this, false, [ ], targetList )
    // define a function that validates a PreppedPropForm instance, w/caching:
    const checkPPF = ppf => {
      if ( !ppf.hasOwnProperty( 'result' ) ) ppf.result = validator( ppf )
      return ppf.result
    }
    // validate the stuff needed to grade each target:
    let finalAnswer = true
    targetList.forEach( target => {
      const result = prepped
        .filter( ppf => ppf.targets.includes( target ) )
        .every( checkPPF )
      target.setAttribute( attributeKey, result ? trueFlag : falseFlag )
      finalAnswer = finalAnswer && result
    } )
    return finalAnswer
  }

  CPLValidate ( targetList ) {
    return this.GeneralValidate(
      x => x.isAClassicalTautology(), 'Validation', true, false, targetList )
  }

  IPLValidate ( targetList ) {
    return this.GeneralValidate(
      x => LC.IPLValidationHelper( [ ], [ ], x ), 'validation',
        { status: true, feedback: 'Good job!' },
        { status: false, feedback: 'This doesn\'t follow.' },
        targetList )
  }

  static IPLValidationHelper (
    atomics, arrows, C,
    useSAT = true, known = new Set()
    //, indent = 0
  ) {
    // if ( indent > 10 ) throw 'uh-oh'
    // let tab = ''; while ( tab.length < 4*indent ) tab += ' '
    // dbg( tab, 'FIC:', atomics.map( a => a.text ), arrows.map( a => a.text ),
    //     '|-', C.text )

    // If the conclusion is literally the constant true, we're done.
    if ( C.isConstantTrue() ) {
      // dbg( tab, 'Conclusion == constant true' )
      return true
    }

    // don't bother with FIC if SAT says no...
    // ...unless the caller told us not to do this check.
    // (Recursive calls that already know the check will pass may tell us to
    // skip it to save time.)
    if ( useSAT ) {
      if ( !C.followsClassicallyFrom( ...atomics, ...arrows ) ) {
        // dbg( tab, 'SAT SAID STOP!' )
        return false
      }
    }

    // If the conclusion is already known, just stop now.
    if ( known.has( C.text ) ) {
      // dbg( tab, 'already proven elsewhere:', C.text )
      return true
    }

    // apply the GR rule as many times as needed to achieve an atomic RHS
    while ( C.isConditional() ) {
      const A = C.children[0]
      if ( A.isAtomic() ) {
        atomics = A.addedTo( atomics )
      } else {
        arrows = A.addedTo( arrows )
      }
      C = C.children[1]
    }

    // dbg( tab, 'reduced:', atomics.map( a => a.text ), arrows.map( a => a.text ),
    //     '|-', C.text )

    // C is now atomic.  if the S rule applies, done
    if ( C.isIn( atomics ) ) {
      // dbg( tab, 'yes--S' )
      return true
    }

    // recursive applications of GL rule
    const provenInRecursion = new Set()
    for ( let i = 0 ; i < arrows.length ; i++ ) {
      // dbg( tab, `consider ${i}. `, arrows[i].text )
      const Ai = arrows[i].children[0] // Ai in Ai->Bi
      const Bi = arrows[i].children[1] // Bi in Ai->Bi
      const provenInThisRecursion = new Set()
      if ( !LC.IPLValidationHelper( atomics, arrows.without( i ), Ai, true,
                                    provenInThisRecursion/*, indent+1*/ ) ) {
        Array.from( provenInThisRecursion ).forEach(
          proven => provenInRecursion.add( proven ) )
        continue
      }
      // dbg( tab, 'can prove LHS, so now try using the RHS:' )
      let arCopy = arrows.without( i )
      // Note: No need to call SAT in either of the following recursions, because
      // in both cases, the sequent we're deferring to in recursion is provable
      // (in both IPL and CPL) iff the current sequent is.  Since we already
      // know that the current one is CPL-provable, we know the one in the
      // recursion is, so there's no need to waste time verifying that fact.
      if ( Bi.isAtomic() ) {
        return LC.IPLValidationHelper(
          Bi.addedTo( atomics ), arCopy, C,
          false, provenInRecursion/*, indent+1*/ )
      } else {
        return LC.IPLValidationHelper(
          atomics, Bi.addedTo( arCopy ), C,
          false, provenInRecursion/*, indent+1*/ )
      }
    }

    // dbg( tab, 'failed to prove:', atomics.map( a => a.text ),
    //     arrows.map( a => a.text ), '|-', C.text )
    return false
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

//
// An instanceof the PreppedPropForm class is a propositional sentence that has
// been prepared/processed to be maximally efficient when used for FIC checking.
//
class PreppedPropForm {
  // Three ways to construct:
  // new PreppedPropForm(parity,catalog) == constant true
  // new PreppedPropForm(parity,catalog,A) == propositional letter
  //   (A must be an atomic LC--that is, a sentence or declaration)
  // new PreppedPropForm(A,B) == conditional expression
  //   (A and B must both be PreppedPropForm instances)
  constructor ( ...args ) {
    if ( args[0] === true || args[0] === false ) {
      if ( args.length == 2 ) {
        // constant true
        this.text = true // don't use a string, to disambiguate
        this.parity = args[0]
        this.catalog = args[1]
        this.cnf = this.parity ? [ ] : [ [ ] ]
        this.children = [ ]
        this.targets = [ ]
      } else {
        // atomic LC
        this.text = args[2].toString().replace( /:/g, '' )
        this.parity = args[0]
        this.catalog = args[1]
        this.cnf = [ [ this.catalogNumber( this.text, this.catalog )
                      * ( this.parity ? 1 : -1 ) ] ]
        this.original = args[2]
        this.children = [ ]
        this.targets = [ ]
      }
    } else {
      // conditional expression
      if ( !( args[0] instanceof PreppedPropForm )
        || !( args[1] instanceof PreppedPropForm ) )
        throw 'Invalid argument types to PreppedPropForm constructor'
      if ( args[0].parity == args[1].parity )
        throw 'Cannot make a conditional with the same parity in both children'
      this.text = `[${args[0].text},${args[1].text}]`
      this.parity = args[1].parity
      this.catalog = args[0].catalog
      this.cnf = this.parity ? args[0].disjoinedWith( args[1] ) :
                               args[0].cnf.concat( args[1].cnf )
      this.children = args
      this.targets = [ ]
    }
  }
  // Disjoin the CNF of this instance with that of another, using switch
  // variables to do so efficiently.  Note: This returns just the new CNF,
  // not a PreppedPropForm instance.
  disjoinedWith ( other ) {
    if ( this.cnf.length == 1 )
      return other.cnf.map( conjunct =>
        Array.from( new Set( this.cnf[0].concat( conjunct ) ) ) )
    if ( other.cnf.length == 1 )
      return this.cnf.map( conjunct =>
        Array.from( new Set( other.cnf[0].concat( conjunct ) ) ) )
    if ( this.cnf.length == 2 && other.cnf.length == 2 )
      return [ Array.from( new Set( this.cnf[0].concat( other.cnf[0] ) ) ),
               Array.from( new Set( this.cnf[1].concat( other.cnf[0] ) ) ),
               Array.from( new Set( this.cnf[0].concat( other.cnf[1] ) ) ),
               Array.from( new Set( this.cnf[1].concat( other.cnf[1] ) ) ) ]
    const maxSwitchVar = this.catalog.filter( x => /^switch[0-9]+$/.test( x ) )
                                     .map( x => parseInt( x.substring( 6 ) ) )
                                     .reduce( Math.max, -1 )
    const newSwitchVar = `switch${maxSwitchVar+1}`
    index = this.catalogNumber( newSwitchVar, this.catalog )
    return [ ...this.cnf.map( conjunct => conjunct.concat( [ newSwitchVar ] ) ),
             ...other.cnf.map( conjunct => conjunct.concat( [ -newSwitchVar ] ) ) ]
  }
  // Get the catalog number for a given atomic propositional letter.
  // (If it's not already in our catalog, add it, then return the new number.)
  catalogNumber ( letter ) {
    let index = this.catalog.indexOf( letter )
    if ( index == -1 ) {
      index = this.catalog.length
      this.catalog.push( letter )
    }
    return index + 1
  }
  // Is this atomic (either the constant true or a propositional letter)?
  isAtomic () { return this.children.length == 0 }
  // Is this conditional (the only non-atomic option)?
  isConditional () { return this.children.length > 0 }
  // Is this the atomic propositional constant "True"?
  isConstantTrue () { return this.text === true }
  // Is an instance equal to this one in the given array?
  isIn ( array ) { return array.some( x => x.text == this.text ) }
  // The given array, with this object added, if needed.
  addedTo ( array ) {
    return this.isIn( array ) ? array : array.concat( [ this ] )
  }
  // Check whether this is a tautology.  Works only if its parity is negative.
  // It's a tautology iff the CNF of its negation passes SAT.
  isAClassicalTautology () {
    if ( this.parity )
      throw 'Cannot check if an object with positive parity is a tautology'
    return !satSolve( this.catalog.length, this.cnf )
  }
  // Check whether this follows from the given premises.  Works only if its
  // parity is negative and all the premises' parities are positive, for the
  // same reason as above.  The premises must have been constructed with the
  // same catalog as this object.
  followsClassicallyFrom ( ...premises ) {
    if ( this.parity || premises.some( p => !p.parity ) )
      throw 'Invalid parity/parities in the sequent to check'
    if ( premises.some( p => p.catalog != this.catalog ) )
      throw 'Can check deduction only if all catalogs are the same'
    const cnf = premises.map( p => p.cnf )
                        .reduce( (a,b) => a.concat( b ), [ ] )
                        .concat( this.cnf )
    return !satSolve( this.catalog.length, cnf )
  }
  // String form for debugging
  toString () {
    return `${this.text} (CNF${this.parity?"+":"-"}:${JSON.stringify(this.cnf)})`
        + ( this.target ? ` [target:${this.target.toString()}]` : '' )
  }
  // Create an array of PreppedPropForm instances from a given LC.
  // The conjunction of the result is IPL-equivalent to the given LC.
  // If targets is an array of LCs within this one, we consider only conclusions
  // within that array.  If it contains the constant true, we consider all conclusions.
  // Note: This function will manipulate the targets array, in-place.
  // The final argument is typically not used by clients, but just in recursion.
  static createFrom ( lc, parity = false, catalog = [ ], targets = [ true ], index = 0 ) {

    // Base case 1: If there are no targets to pursue, the result is an empty list.
    if ( targets.length == 0 )
      return [ ]

    // If this LC is a target, just process ALL conclusions,
    // then mark all otherwise unmarked conclusions as having this LC as the target.
    if ( targets.includes( lc ) ) {
      targets = targets.map( x => x == lc ? true : x )
      const result = PreppedPropForm.createFrom( lc, parity, catalog, targets, index )
      result.forEach( ppf => ppf.targets.push( lc ) )
      return result
    }

    // Base case 2: atomic -> return a single propositional letter, unless our
    // targets list explicitly excludes it.
    if ( lc.isAnActualStatement() || lc.isAnActualDeclaration() ) {
      const index = targets.indexOf( lc )
      if ( index > -1 ) {
        // this atomic is on the target list, so return it, flagged as a target
        targets.splice( index, 1 )
        const result = new PreppedPropForm( parity, catalog, lc )
        result.targets.push( lc )
        return [ result ]
      } else if ( targets.includes( true ) ) {
        // this atomic is not on the target list, but we're supposed to return all
        // conclusions, so we return it, but not flagged as a target
        return [ new PreppedPropForm( parity, catalog, lc ) ]
      } else {
        // neither of the above is true, so return an empty list
        return [ ]
      }
    }

    // To proceed, we need to know where the final *claim* child is indexed.
    const chi = lc.children()
    let lastClaimIndex = chi.length - 1
    while ( lastClaimIndex >= 0 && chi[lastClaimIndex].isAGiven )
      lastClaimIndex--

    // Base case 3: no claims left -> return the constant "true"
    if ( index > lastClaimIndex )
      return [ new PreppedPropForm( parity, catalog ) ]

    // Inductive case 1: one claim left -> recur on that one claim
    if ( index == lastClaimIndex )
      return PreppedPropForm.createFrom( chi[index], parity, catalog, targets, 0 )

    // Inductive case 2: conjunction
    // chi[index] is a claim, so the env from chi[index] onwards is interpreted
    // as chi[index] ^ the rest.
    // No need to form any new CNFs because we are just concatenating arrays of
    // conditionals, not forming a containing expression for them.
    if ( chi[index].isAClaim ) {
      // recur on the first child first (which may exhaust all the targets),
      // but first keep a note of whether that child was itself a target:
      const wasTarget = targets.includes( chi[index] )
      if ( wasTarget ) targets = targets.filter( x => x != chi[index] )
      const first = PreppedPropForm.createFrom( chi[index], parity, catalog, targets, 0 )
      // if those results came from a specific target, then mark them as such:
      if ( wasTarget )
        first.forEach( ppf => ppf.targets.push( chi[index] ) )
      if ( targets.length == 0 ) return first // all targets found
      // there are still more targets to find, so we recursively find them:
      const rest = PreppedPropForm.createFrom( lc, parity, catalog, targets, index+1 )
      return first.concat( rest )
    }

    // Inductive case 3: conditional
    // chi[index] is a given, so the env from chi[index] onwards is interpreted
    // as chi[0] -> the rest.
    // For each result R in the recursive computation of the rest, form a new
    // result chi[0] -> R, except with chi[0] turned into a chain of arrows
    // based on a recursive call.
    // Do the recursive call first, because this can save time as follows:
    const rest = PreppedPropForm.createFrom( lc, parity, catalog, targets, index+1 )
    if ( rest.length == 0 )
      return [ ] // no sense computing premises for conclusions we don't have
    // OK, there were some conclusions, so compute their premises:
    const first = PreppedPropForm.createFrom( chi[index], !parity, catalog, [ true ], 0 )
    return rest.map( conclusion => {
      for ( let i = first.length - 1 ; i >= 0 ; i-- ) {
        conclusion = new PreppedPropForm( first[i], conclusion )
        conclusion.targets = conclusion.targets.concat( conclusion.children[1].targets )
      }
      return conclusion
    } )

  }
}

// While we're here, let's add some global utilities...
Array.prototype.last = function () { return this[this.length-1] }
Array.prototype.without = function ( i ) {
  return [ ...this.slice( 0, i ), ...this.slice( i+1 ) ]
}
Array.prototype.show = function () { return this.map(x=>x+'') }

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

// For testing we want to be able to check when two cnf arrays are equal
// as cnfs. A cnf is an array of sets, but that array itself is a conjunction
// so mathematically is also a set.  The array can contain duplicates, thus
// checking the array length is not a good test mathematically.  Similarly,
// js sets pretty much suck as mathematical sets, because you can't easily
// test them for equality without doing it all by hand. For example a js Set of
// js Sets could easily have duplicate elements.
equalcnf = (A,B) => setequals(A,B,setequals)

// We also want to easily construct a cnf by hand
makecnf = ( ...clauses ) => clauses.map( x => new Set(x) )

// Syntactic sugar
lc = (s) => {
  let L = LC.fromString(s)
  // L.markAll()
  return L
}

// quick hack for a global variable so I don't have to pass it as an arg
var indent = -1

///////////////////////////////////////////////////////////////////////

module.exports.LC = LC
module.exports.CNF = CNF
module.exports.union = union
module.exports.subset = subset
module.exports.setequals = setequals
module.exports.seq = seq
module.exports.equalcnf = equalcnf
module.exports.makecnf = makecnf
module.exports.lc = lc
module.exports.indent = indent
module.exports.Times = Times
module.exports.StartTimes = StartTimes
module.exports.TimerStart = TimerStart
module.exports.TimerStop = TimerStop
module.exports.PreppedPropForm = PreppedPropForm // exported only for debugging/testing

const { Statement } = require( './statement.js' )
const { Environment } = require( './environment.js' )
const { existsDerivation, firstDerivation } =
       require( '../classes/deduction.js' )
const { Turnstile } = require( '../classes/deduction.js' )
MatchingProblem = require('./matching.js').MatchingProblem
MatchingSolution = require('./matching.js').MatchingSolution

// pattern P to match against an expression E
// P contains metavars
// mark the identifiers in P with subexpr.isAMetavariable = true
// prob = new MatchingProblem( [ P, E ] )
// sols = prob.getSolutions()
// it's an array of MatchingSolution instances
// given any S in sols
// you can do: S.lookup('metavarname')
// you can do: S.keys() to get list of metavars in it
// you can do: S.toString() for debugging
// note: S.lookup() takes STRINGS as input, the NAMES of the metavars, not the LCs
// note: if there are no solutions to the matching problem, then sols is [ ]
// you can also do: prob.getOneSolution() and it will either be a
// MatchingSolution instance if one exists, or null if there are no solutions
// or prob.isSolvable()
