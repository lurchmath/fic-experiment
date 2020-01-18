
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
  // Environment will need to be able to store lists of identifiers that they
  // implicitly declare (by using them free and undeclared).  We thus make a
  // getter/setter pair for conveniently doing so.
  get implicitDeclarations () {
    return this.getAttribute( 'implicit declarations' ) || [ ]
  }
  set implicitDeclarations ( list ) {
    return this.setAttribute( 'implicit declarations', list )
  }
  // Traverse this environment and all its descendants, marking them in three
  // ways:
  //  - Every environment will be assigned its .implicitDeclarations list, even
  //    environments for which that list is empty.  See explanation above for
  //    the meaning of that attribute.
  //  - Every environment that is also a declaration will be marked with its
  //    declaration failures, even if that list is empty.  See the
  //    markFailures() and successfullyDeclares() functions above for details.
  //  - Every quantified expression will be marked with its binding failures,
  //    even if that list is empty.  See the markFailures() and
  //    successfullyBinds() functions in the Statement class for details.
  markDeclarations ( declaredConstNames = [ ], declaredVarNames = [ ] ) {
    // utility function:
    let isDeclared = ( x ) =>
      declaredConstNames.indexOf( x ) > -1 ||
      declaredVarNames.indexOf( x ) > -1
    let implicitDeclarations = [ ] // names of implicitly declared variables
    let recursiveCalls = [ ] // recursive function calls to make later
    // console.log( 'Mark declarations in ' + this + ' w/consts ['
    //            + declaredConstNames.join( ',' ) + '] and vars ['
    //            + declaredVarNames.join( ',' ) + ']:' )
    this.children().map( ( child, index ) => {
      // console.log( 'Handling child ' + child + ':' )

      // If it's a declaration, grade whether any of its declarations are wrong.
      // Do this by writing to the "declaration failures" attribute an array of
      // names of things you tried to declare but failed.  If the declaration
      // was 100% OK, this will be an empty list, but it will always be present.
      if ( child.declaration && child.declaration != 'none' ) {
        let names = child.children().slice( 0, child.children().length - 1 )
                         .map( declareThis => declareThis.identifier )
        let failures = [ ]
        names.map( name => {
          if ( isDeclared( name ) )
            failures.push( name )
          else if ( child.declaration == 'constant' )
            declaredConstNames.push( name )
          else // if ( child.declaration == 'variable' )
            declaredVarNames.push( name )
        } )
        child.markFailures( failures )
        // console.log( '\tIt\'s a declaration w/failures ['
        //            + failures.join( ',' ) + '] and now consts ['
        //            + declaredConstNames.join( ',' ) + '] and vars ['
        //            + declaredVarNames.join( ',' ) + ']' )
      }
      // If this child is an environment (which includes declarations as a
      // special case), we will want to recur inside it, but we can't do so yet,
      // because we haven't yet checked to see if/where all the implicit variabe
      // declarations are.  So instead, we're just going to store here the
      // function we will call later to do the recursion.  To that recursion, we
      // will pass copies of the parameters given to us, so the recursion can
      // modify them without messing up our copies.  This is because anything
      // declared in one of our children ends its scope at the end of the child,
      // so it shouldn't impact later children.  Note that some environments are
      // formulas, which ignore declared variables, as in the second parameter,
      // below.
      if ( child instanceof Environment ) {
        recursiveCalls.push( ( function ( constants, variables ) {
          return function ( implicitVars ) {
            // console.log( 'Recurring inside child (environment) '+index+'...' )
            child.markDeclarations( constants,
              child.isAFormula ? [ ] : variables.concat( implicitVars ) )
            // console.log( '...stepping back out of recursion.' )
          }
        } )( declaredConstNames.slice(), declaredVarNames.slice() ) )
      }
      // If this child is a statement, do two things:
      if ( child instanceof Statement ) {
        // First, make sure none of its quantifiers break the rule of not trying
        // to bind something that's declared to be a constant:
        child.validateQuantifiers( declaredConstNames )
        // Second, notice any undeclared free variables in it, and put them on
        // the list of things we have to implicitly declare in this environment:
        child.toOM().freeVariables().map( name => {
          if ( !isDeclared( name ) ) {
            implicitDeclarations.push( name )
            declaredVarNames.push( name )
          }
        } )
        // console.log( '\tIt\'s a statement; we validated quantifiers and now '
        //            + 'implicit variables list is ['
        //            + implicitDeclarations.join( ',' ) + ']' )
      }
    } )
    // Now store in this environment anything that we must implicitly declare
    // in it, using the "implicit declarations" attribute.  This will often be
    // an empty array, but this attribute will be added to every environment.
    this.implicitDeclarations = implicitDeclarations
    // Then make any recursive calls into child environments that we saved until
    // now, to be sure we knew all the implicit variable declarations we would
    // need to add to them.
    recursiveCalls.map( f => f( implicitDeclarations ) )
  }
}

module.exports.Environment = Environment
