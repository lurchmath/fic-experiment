
const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( '../dependencies/openmath.js' )
const { LC, Times, StartTimes, TimerStart, TimerStop } = require( './lc.js' )
const { Statement } = require( './statement.js' )

let debug = ( ...args ) => console.log( ...args )

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
  // indefinitely.  For declarations that are claims, the entire declaration
  // is considered to be an 'atomic' conclusion.
  conclusions () {
    let result = [ ]
    this.LCchildren().map( child => {
      if ( child.isAGiven ) return
      if ( child.isAnActualDeclaration() || child.isAnActualStatement() ) {
        result.push( child )
      } else if ( child.isAnActualEnvironment() )
        result = result.concat( child.conclusions() )
    } )
    return result
  }
  // An Environment can be a constant or variable declaration iff
  // (a) it is not a formula,
  // (b) it has n>0 children,
  // (c) the first n-1 are identifiers,
  // (d) the last one is a claim, and
  // (e) that claim contains neither formulas nor other declarations.
  canBeADeclaration () {
    const noFormulasNorDeclarations = ( lc ) =>
      !lc.isAFormula && ( !lc.isAnActualDeclaration() ) &&
      lc.children().every( noFormulasNorDeclarations )
    return !this.isAFormula && this.children().length > 0
        && this.last.isAClaim && this.allButLast.every( v => v.isAnIdentifier )
        && noFormulasNorDeclarations( this.last )
  }
  // If something's allowed to be a declaration as above, then we'll let you set
  // it as one, providing you're trying to set it as type "variable" or
  // "constant" or "none".  Otherwise, this does nothing.
  set declaration ( value ) {
    return this.canBeADeclaration()
        && [ 'variable', 'constant', 'none' ].includes( value ) ?
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
    if ( !this.isAnActualDeclaration() )
      return this.clearAttributes( 'declaration failures' )
    let triedToDeclare = this.allButLast.map( declared => declared.identifier )
    this.setAttribute( 'declaration failures',
      identifierNames.filter( name => triedToDeclare.includes( name ) ) )
  }
  // A declaration failed if it failed to declare any one of its identifiers.
  declarationFailed () {
    return ( this.getAttribute( 'declaration failures' ) || [ ] ).length > 0
  }
  // A declaration "successfully declares" an identifier if that identifier is
  // on its list of declared identifiers but not on its list of failures (as in
  // the definition of markFailures(), above.)
  successfullyDeclares ( identifierName ) {
    return this.isAnActualDeclaration() &&
      ( this.getAttribute( 'declaration failures' ) || [ ] )
        .indexOf( identifierName ) == -1 &&
      this.allButLast.some( declared => declared.identifier == identifierName )
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
  // The optional argument options should be an object with named booleans
  // which are false when omitted.
  toString ( options ) {

    debug(`Converting this environment to string:`)
    this.inspect()
    ////////////////////
    // let recursive = TimerStart('toString')
    ////////////////////

    // options.Indent determines if we should indent and add newlines
    if (options && options.Indent ) {
      // indentLevel and tabsize are also optional options
      if (!options.hasOwnProperty('indentLevel')) options.indentLevel = 0
      if (!options.hasOwnProperty('tabsize')) options.tabsize = 2
      let tab = () => ' '.repeat(options.tabsize).repeat(options.indentLevel)
      let result = ''
      result+=( this.isAGiven    ? ':'         : '' )
            + ( this.isAFormula  ? '['        :
              ( this.declaration && this.declaration === 'variable'
                                 ? 'Let{'     :
              ( this.declaration && this.declaration === 'constant'
                                 ? 'Declare{' : '{' )))
            + '\n'
      options.indentLevel++
      result+= tab()
            + this.children().map( child => child.toString(options) )
                             .join('\n'+tab())
            + '\n'
      options.indentLevel--
      result+= tab()
            + ( this.isAFormula  ? ']' : '}' )
            + ( ( options && options.FIC && this.isValidated ) ?
                ( (this.isValid) ? '✓' : '✗' ) : '' )

      ////////////////////
      // TimerStop('toString',recursive)
      ////////////////////

      return result
    } else {

      ////////////////////
      // TimerStop('toString',recursive)
      ////////////////////

      return ( this.isAGiven    ? ':'         : '' )
           + ( this.isAFormula  ? '[ '        :
             ( this.declaration && this.declaration === 'variable'
                                ? 'Let{ '     :
             ( this.declaration && this.declaration === 'constant'
                                ? 'Declare{ ' : '{ ' )))
           + this.children().map( child => child.toString(options) ).join( ' ' )
           + ( this.isAFormula ? ' ]' : ' }' )
           + ( ( options && options.FIC && this.isValidated ) ?
               ( (this.isValid) ? '✓' : '✗' ) : '' )
    }
  }

  // What do Environments look like in OM form?
  toOM () {
    return this.copyFlagsTo( OM.app( OM.sym( 'Env', 'Lurch' ),
      ...this.children().map( child => child.toOM() ) ) )
  }
  // Extending helper functions to support the declaration attribute:
  copyFlagsTo ( om ) {
    LC.prototype.copyFlagsTo.call( this, om )
    if ( this.isAnActualDeclaration() )
      om.setAttribute( OM.sym( 'Decl', 'Lurch' ), OM.str( this.declaration ) )
    else
      om.removeAttribute( OM.sym( 'Decl', 'Lurch' ) )
    return om
  }
  copyFlagsFrom ( om ) {
    LC.prototype.copyFlagsFrom.call( this, om )
    let attr = om.getAttribute( OM.sym( 'Decl', 'Lurch' ) )
    this.declaration = attr ? attr.value : 'none'
    return this
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
  markDeclarations ( declaredConstNames = [ ], declaredVarNames = [ ] , enclosingEnvironment ) {
    // utility functions:
    let isDeclared = ( x ) => declaredConstNames.includes( x )
                           || declaredVarNames.includes( x )
    let union = ( list1, list2 ) => {
      let result = list1.slice()
      list2.map( entry => {
        if ( result.indexOf( entry ) == -1 ) result.push( entry ) } )
      return result
    }
    let implicitDeclarations = [ ] // names of implicitly declared variables
    let whereToSave = enclosingEnvironment ? enclosingEnvironment : this
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
      if ( child.isAnActualDeclaration() ) {
        let names = child.allButLast.map( declared => declared.identifier )
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
        // a declaration also behaves as if it's body is at the same level as the
        // declaration itself.

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
      // if ( child instanceof Environment ) {
      //   ( function ( constants, variables, enclosing ) {
      //     recursiveCalls.push( function ( implicitVars ) {
      //       // console.log( 'Recurring inside child (environment) '+index+'...' )
      //       child.markDeclarations( constants,
      //         child.isAFormula ? [ ] : union( variables, implicitVars ),
      //         enclosing )
      //       // console.log( '...stepping back out of recursion.' )
      //     } )
      //   } )( declaredConstNames.slice(), declaredVarNames.slice(),
      //        enclosingEnvironment ? enclosingEnvironment :
      //        child.declaration && child.declaration != 'none' ? this :
      //        undefined )
      // }
      if ( child.isAnActualEnvironment() ) {
        ( function ( constants, variables, enclosing ) {
          recursiveCalls.push( function ( implicitVars ) {
            // console.log( 'Recurring inside child (environment) '+index+'...' )
            child.markDeclarations( constants,
              child.isAFormula ? [ ] : union( variables, implicitVars ),
              enclosing )
            // console.log( '...stepping back out of recursion.' )
          } )
        } )( declaredConstNames.slice(), declaredVarNames.slice(),
             enclosingEnvironment ? enclosingEnvironment :
             child.declaration && child.declaration != 'none' ? this :
             undefined )
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

        // The previous routine doesn't consider quantifiers themselves to
        // be free in the statement, so we tack them on.
        if (child.getAttribute('quantifier') &&
            !isDeclared( child.identifier )) {
          implicitDeclarations.push( child.identifier )
          declaredVarNames.push( child.identifier )
        }
        // console.log( '\tIt\'s a statement; we validated quantifiers and now '
        //            + 'additional implicit vars are ['
        //            + implicitDeclarations.join( ',' ) + ']' )
      }
    } )
    // Now store in this environment anything that we must implicitly declare
    // in it, using the "implicit declarations" attribute.  This will often be
    // an empty array, but this attribute will be added to every environment.
    whereToSave.implicitDeclarations =
      union( whereToSave.implicitDeclarations, implicitDeclarations )
    // Then make any recursive calls into child environments that we saved until
    // now, to be sure we knew all the implicit variable declarations we would
    // need to add to them.
    recursiveCalls.map( f => f( whereToSave.implicitDeclarations ) )
  }
  // This function should be called only in formulas.  If it is called in
  // anything else, it returns undefined.
  // If the environment doesn't have an "implicit declarations" attribute, then
  // this will return undefined, because it requires such data to function.  The
  // client should instead call markDeclarations() on this (or its topmost
  // parent instead, probably) to add scoping info to the tree, then call this
  // to get a correct result.
  // Within a formula, it returns list of all the identifiers (names, as
  // strings) that appear in the formula and that should be marked as
  // metavariables when the formula is used (as a formula).
  formulaMetavariables () {
    if ( !this.isAFormula
      || this.getAttribute( 'implicit declarations' ) === undefined )
      return undefined
    let result = [ ]
    let add = ( names ) => names.map( name => {
      if ( result.indexOf( name ) == -1 ) result.push( name )
    } )
    let recur = ( env ) => {
      add( env.implicitDeclarations )
      if ( env.isAnActualDeclaration() )
        env.allButLast.map( declared => {
          if ( env.successfullyDeclares( declared.identifier ) )
            add( declared.identifier )
        } )
    }
    recur( this )
    return result
  }

}

module.exports.Environment = Environment
