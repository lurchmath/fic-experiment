
const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( '../dependencies/openmath.js' )

class LC extends Structure {

  // register with Structure ancestor class for good serialization/copying
  className = Structure.addSubclass( 'LC', LC )

  // LCs may contain only other LCs:
  insertChild ( child, beforeIndex = 0 ) {
    if ( child instanceof LC )
      Structure.prototype.insertChild.call( this, child, beforeIndex )
  }

  // LCs have the isAGiven boolean, which defaults to false.
  // We also define the isAClaim boolean, which is !isAGiven.
  // Both of these use the private attribute "given."
  constructor ( ...children ) {
    super( ...children )
    this.setAttribute( 'given', false )
  }
  get isAGiven () { return this.getAttribute( 'given' ) }
  set isAGiven ( value ) { return this.setAttribute( 'given', !!value ) }
  get isAClaim () { return !this.getAttribute( 'given' ) }
  set isAClaim ( value ) { return this.setAttribute( 'given', !value ) }

  // Abstract-like method that subclasses will fix:
  toString () {
    return ( this.isAGiven ? ':' : '' )
         + 'LC('
         + this.children().map( child => child.toString() ).join( ',' )
         + ')'
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

  // The fully parenthesized form of an LC L = { L1 L2 ... Ln } is the form
  // { L1 { L2 ... { Ln-1 Ln } ... } }.
  // The formula and given statuses of the original L are copied over.
  // The following routine computes this, which involves making copies of each
  // Li, so that we do not destroy/alter the original LC L.
  fullyParenthesizedForm () {
    if ( this.children().length < 3 ) return this.copy()
    let kids = this.children().slice()
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
    // console.log( '** N('+this+'):' )
    let say = ( x ) => {
      // console.log( `** = ${x}` )
      return x
    }
    let fpf = this.fullyParenthesizedForm()
    // console.log( '** FPF = '+fpf )
    // If fpf is a statement, then that's the normal form.
    if ( fpf instanceof Statement ) return say( fpf )
    // console.log( '** It was not a Statement' )
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
    // console.log( '** It was not a Type 1' )
    // If A is nonTrivial, and B is Trivial, then { A } and { A B }
    // have normal form N(A).
    if ( fpf.children().length == 1
      || fpf.children().length == 2 &&
         isTrivial( fpf.children()[1] ) ) {
      let NA = fpf.children()[0].normalForm()
      NA.isAGiven = fpf.isAGiven
      return say( NA )
    }
    // Also A is nonTrivial and N(B) is Empty, { B A }
    // also has normal form N(A).
    if ( isEmpty( fpf.children()[0].normalForm() ) ) {
      let NA = fpf.children()[1].normalForm()
      NA.isAGiven = fpf.isAGiven
      return say( NA )
    }
    // console.log( '** It was not Type 2' )
    // If none of the above cases apply, then fpf has two children, call them
    // A and B, with normal forms NA and NB, respectively, and its normal form
    // fits one of these cases:
    //  { A B } ->  { NA NB }     { :A B } ->  { :NA NB }
    // :{ A B } -> :{ NA NB }    :{ :A B } -> :{ :NA NB }
    let NA = fpf.children()[0].normalForm()
    let NB = fpf.children()[1].normalForm()
    // console.log( '** NA = '+NA )
    // console.log( '** NB = '+NB )
    let result = new Environment( NA, NB )
    result.isAGiven = fpf.isAGiven
    return say( result )
  }

  // Reverse operation of the toString() functions defined below.
  static fromString ( string ) {
    const ident = /^[a-zA-Z_0-9]+/
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
      if ( string[0] == ':' ) {
        if ( !follows( null, 'space', '~', '{', '}', '[', ']' ) || given )
          stop( 'Found a given marker (:) in the wrong place' )
        given = true
        munge( 1 )
      } else if ( string[0] == '~' ) {
        if ( !follows( null, 'space', ':', '{', '(', '[' ) || quantifier )
          stop( 'Found a quantifier marker (~) in the wrong place' )
        quantifier = true
        munge( 1 )
      } else if ( match = ident.exec( string ) ) {
        let S = setFlags( new Statement() )
        S.identifier = match[0]
        stack.push( S )
        munge( match[0].length )
        last = 'identifier'
      } else if ( string[0] == '{' ) {
        if ( quantifier )
          stop( 'Trying to mark an environment as a quantifier' )
        if ( stack.some( entry => entry._lastStatementHead ) )
          stop( 'Found an environment open bracket ({) inside a statement' )
        let E = setFlags( new Environment() )
        E._lastOpenBracket = true
        stack.push( E )
        munge( 1 )
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
      } else if ( string[0] == '(' ) {
        if ( stack.length == 0 || stack[stack.length-1] instanceof Environment )
          stop( 'Found an open paren not following an identifier' )
        stack[stack.length-1]._lastStatementHead = true
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

}

module.exports.LC = LC

const { Statement } = require( './statement.js' )
const { Environment } = require( './environment.js' )
