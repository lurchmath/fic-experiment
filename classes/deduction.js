
// To-Dos to fix this file:
//  * Extend solution.apply() to accept lists and map across them.  Then use
//    that convenience to simplify code herein.
//  * Add array.last() utility and use it to simplify code herein and elsewhere.
//  * Add array.without(i) utility and use it to simplify code herein.
//  * Add Problem.plusConstraint(A,B) and use it to simplify code herein.
//  * Change pairUp() to compare(), giving an object with of the form
//    { equal, pattern?, expression? }.  Change all calls to it.
//  * Create iteratorMap(it,f) that returns a new iterator, then use that to
//    simplify several pieces of code herein.
//  * In findDerivationMatches(), create a buildResult(solution,premises,
//    conclusion) function that does the following:
//    { solution:solution, premises:solution.apply(premises),
//      conclusion:solution.apply(conclusion) }
//    Then use that to simplify many of the yield calls.
//  * Move the options.workBothWays clause to the end of the whole function, not
//    restricted to conclusions of statement type only.
//  * The clause for Statement-type conclusions with Environment-type premises
//    needs to be duplicated for declaration-type conclusions with Environment-
//    type premises, rather than dropping that from consideration entirely.

const { LC } = require( './lc.js' )
const { Statement } = require( './statement.js' )
const { Environment } = require( './environment.js' )
const { MatchingProblem, MatchingSolution } =
  require( '../classes/matching.js' )

let verbose = false
let indent = ''
let debugrestart = () => indent = ''
let debugin = () => indent += '    '
let debugout = () => indent = indent.substring( 4 )
let debug = ( ...msgs ) => {
  if ( verbose ) console.log( indent, ...msgs )
}

// Does the given LC contain a metavariable anywhere in its hierarchy?
const containsMetavariables = lc =>
  lc.isAMetavariable || lc.children().some( containsMetavariables )

// Pair up two LCs in a way that is useful for the derivation checker, below.
// Specifically, it follows these rules:
//  - If LC1 and LC2 both contain metavariables, then the only way that they can
//    match is if they are identical, so we return the answer to the question of
//    whether they can match--that is, are they exactly equal?  True or false.
//  - If LC1 and LC2 both do not contain metavariables, the exact same story is
//    true, and thus we do the exact same thing.  Equal?  True or false.
//  - If precisely one of them contains a metavariable, we return a pair (that
//    is, a length-2 JS array) with the pattern first and the expression second,
//    that is, either [ LC1, LC2 ] or [ LC2, LC1 ], depending on which of the
//    two contains metavariables.  (The one with metavariables goes first.)
const pairUp = ( LC1, LC2 ) => {
  const mv1 = containsMetavariables( LC1 )
  const mv2 = containsMetavariables( LC2 )
  return mv1 == mv2 ? LC1.hasSameMeaningAs( LC2 ) :
         mv1 ? [ LC1, LC2 ] : [ LC2, LC1 ]
}

// We can measure the complexity of a premise by the number of givens you would
// need to first prove to unlock the conclusion buried inside.  For instance, if
// we have a premise { :A :B C } then it has complexity 2, because there are 2
// givens (A and B) one must prove before one can use the conclusion C.  A
// statement has complexity 0 and a declaration has the complexity of it body.
const complexity = ( x ) =>
  x instanceof Statement ? 0 :
  x.isAnActualDeclaration() ? complexity( x.last ) :
  x.children().length - 1

// The canonical form of a premise list is this:
// Let C1, ..., Cn be the list of conslusions in the premise list.
// Then the set of entries in the canonical form is E1, ..., En, where each
// Ei = { :P1 ... :Pk Ci }, with P1 through Pk being all the givens accessible
// to Ci within the given premise list.
// The Ei should be returned as a list, sorted in increasing order of length of
// children (i.e., number of givens).
const canonicalPremises = ( premises ) => {
  const results = [ ]
  for ( const premise of premises ) {
    const prev = ( lc ) =>
      lc.previousSibling() ? lc.previousSibling() :
      lc.parent() && lc.parent() != premise ? prev( lc.parent() ) : null
    let body = premise.isAnActualDeclaration() ? premise.last : null
    const conclusions =
      premise instanceof Statement ?
        ( premise.isAGiven ? [ ] : [ premise ] ) :
      premise.isAnActualDeclaration() ?
        ( body instanceof Statement ? [ premise, body ] :
                                      [ premise, ...body.conclusions() ] ) :
        premise.conclusions()
    for ( const conclusion of conclusions ) {
      const result = [ conclusion ]
      let walk = conclusion
      while ( walk = prev( walk ) ) {
        if ( walk.isAGiven ) result.unshift( walk )
      }
      results.push( new Environment( ...result.map( x => x.copy() ) ) )
    }
  }
  results.sort( ( a, b ) => complexity( a ) - complexity( b ) )
  return results.map( premise =>
    premise.children().length == 1 ? premise.first : premise )
}

// This function is not intended for client use; call derivationMatches()
// instead, and it will call this one after preparing the parameters
// appropriately.
// This function creates an iterator that yields all matches (that is,
// metavariable instantiations) that cause the premises to derive the conclusion
// using only the rules in FIC.  The third parameter must be a MatchingSolution
// instance, and this routine will consider only solutions that extend that one.
// The premises must each be of the form { :G1 ... :Gn C }, for n>=0.
// Premises not of this form can be converted to this form with the use of
// appropriate logical equivalences; derivationMatches() will do this, which is
// one of its roles, and why it is the appropriate API.
// This function yields an iterator which creates items of the form
// { solution, premises, conclusion }, where the solution has been applied to
// the other two already, so none of its metavariables remain uninstantiated in
// them.
function* findDerivationMatches ( premises, conclusion, toExtend,
                                  options = { } ) {
  debugin()
  debug( premises.map( p => `${p}` ).join( ', ' ),
    `|- ${conclusion}     extending ${toExtend}` )
  // Consider the case where the conclusion is a Statement
  if ( conclusion instanceof Statement ) {
    debug( 'conclusion is a statement' )
    for ( let i = 0 ; i < premises.length ; i++ ) {
      let premise = premises[i]
      // Declaration premises can justify statements only if their bodies do,
      // but canonicalPremises() has already broken the bodies of declarations
      // out for us, so we can skip that case:
      if ( premise.isAnActualDeclaration() ) {
        continue
      } else if ( premise instanceof Statement ) { // premise is a Statement
        debug( `premise is a statement: ${premise}` )
        const P = pairUp( premise, conclusion )
        if ( P === true ) { // premise equals conclusion -- apply rule S
          debug( 'rule S straight equality' )
          yield ({
            solution : toExtend,
            premises : premises,
            conclusion : conclusion
          })
        } else if ( P instanceof Array ) {
          // premise may match conclusion or vice versa; let's check
          const problem = toExtend.asProblem()
          problem.addConstraint( P[0], P[1] )
          debug( `add S-match requirement: (${P[0]},${P[1]})` )
          // for each way that it matches, return that way as a solution
          for ( const solution of problem.enumerateSolutions() ) {
            debug( `rule S by match: ${solution}` )
            yield ({
              solution : solution,
              premises : premises.map( p => solution.apply( p ) ),
              conclusion : solution.apply( conclusion )
            })
          }
        }
      } else { // premise is an environment, call it { :A1 ... :An B }
        debug( `premise is an environment: ${premise}` )
        const As = premise.children().map( A => A.claim() )
        const B = As.pop()
        const P = pairUp( B, conclusion )
        if ( P === true ) { // B equals conclusion -- apply rule GL
          debug( `conclusion match; recur w/GL: ${new Environment(...As)}` )
          yield* findDerivationMatches(
            [ ...premises.slice( 0, i ), ...premises.slice( i+1 ) ],
            new Environment( ...As ), toExtend, options )
        } else if ( P instanceof Array ) {
          // B may match conclusion or vice versa; let's check
          const problem = toExtend.asProblem()
          problem.addConstraint( P[0], P[1] )
          debug( `add GL-match requirement: (${P[0]},${P[1]})` )
          // for each way that it matches, check to see if that match
          // can be extended to a proof of the required parts of rule GL,
          // and yield each way that it can
          for ( const solution of problem.enumerateSolutions() ) {
            debug( `requirement satisfiable: ${solution}...applying rule GL` )
            const fewerPremises =
              [ ...premises.slice( 0, i ), ...premises.slice( i+1 ) ]
            yield* findDerivationMatches(
              fewerPremises.map( p => solution.apply( p ) ),
              solution.apply( new Environment( ...As ) ),
              solution, options )
          }
        }
      }
    }
    // In the event that we found no solutions by working backwards from our
    // goal, we may still find solutions by working forward from our premises,
    // but this is typically more expensive.  So we do not do it by default.
    // But if the user sets options.workBothWays to true, we will.
    // To do so, we seek any formula premise F and any non-formula premise P
    // such that the first given inside F matches P.
    if ( options.workBothWays ) {
      debug( `trying working forwards from premises...` )
      for ( let i = 0 ; i < premises.length ; i++ ) {
        let F = premises[i]
        if ( !containsMetavariables( F ) || !( F instanceof Environment ) )
          continue
        let G = F.first
        if ( !G.isAGiven ) continue
        debug( `can we satisfy premise ${G} in ${F}?` )
        for ( let P of premises.filter( p => !p.isAFormula ) ) {
          const problem = toExtend.asProblem()
          problem.addConstraint( G.claim(), P )
          debug( `trying out this new matching constraint: (${G},${P})` )
          // for each way that it matches, check to see if that match can be the
          // start of a proof using the now one-step-smaller premise F
          for ( const solution of problem.enumerateSolutions() ) {
            debug( `satisfied: ${solution}...so removing ${G} from ${F}` )
            const newPremises = premises.map( p => solution.apply( p ) )
            newPremises[i].removeChild( 0 )
            yield* findDerivationMatches(
              newPremises, solution.apply( conclusion ), solution, options )
          }
        }
      }
    }
  } else if ( conclusion.isAnActualDeclaration() ) {
    // conclusion is a declaration; consider all same-type premises
    debug( `conclusion is a ${conclusion.declaration} declaration` )
    const cmv = containsMetavariables( conclusion )
    let childrenCopy = conclusion.children().slice()
    const cBody = childrenCopy.pop()
    const cVariables =
      new Environment( ...childrenCopy.map( child => child.copy() ) )
    debug( `cVariables ${cVariables} cBody ${cBody}` )
    for ( let premise of premises ) {
      debug( `considering premise w/decl=${premise.declaration}`,
             `and ${premise.children().length} children` )
      if ( premise.declaration != conclusion.declaration ) continue
      if ( premise.children().length != conclusion.children().length ) continue
      childrenCopy = premise.children().slice()
      const pBody = childrenCopy.pop()
      const pVariables =
        new Environment( ...childrenCopy.map( child => child.copy() ) )
      debug( `pVariables ${pVariables} pBody ${pBody}` )
      const pmv = containsMetavariables( premise )
      if ( cmv == pmv ) {
        // either both contain metavariables or both do not,
        // so the only way for them to match is strict equality of variables
        debug( `comparing conclusion to this premise: ${premise}` )
        if ( pVariables.hasSameMeaningAs( cVariables ) ) {
          for ( let deriveSol of findDerivationMatches(
                canonicalPremises( [ pBody ] ), cBody, toExtend, options ) ) {
            yield ({
              solution : deriveSol.solution,
              premises : premises.map( p => deriveSol.solution.apply( p ) ),
              conclusion : deriveSol.solution.apply( conclusion )
            })
          }
        }
      } else {
        // one contains metavariables and the other does not, so we must extend
        // our matching problem to take these potential variable matches into
        // account
        const lefts = cmv ? cVariables : pVariables
        const rights = pmv ? cVariables : pVariables
        debug( `adding constraints from ${premise}...${lefts} ~ ${rights}` )
        const problem = toExtend.asProblem()
        for ( let i = 0 ; i < lefts.children().length ; i++ )
          problem.addConstraint( lefts.child( i ), rights.child( i ) )
        debug( `obtained this problem: ${problem}` )
        for ( const matchSol of problem.enumerateSolutions() ) {
          debug( `requirement satisfiable: ${matchSol}...applying decl-I` )
          for ( let deriveSol of findDerivationMatches(
                  canonicalPremises( [ matchSol.apply( pBody ) ] ),
                  matchSol.apply( cBody ), matchSol, options ) ) {
            yield ({
              solution : deriveSol.solution,
              premises : premises.map( p => deriveSol.solution.apply( p ) ),
              conclusion : deriveSol.solution.apply( conclusion )
            })
          }
        }
      }
    }
  } else { // conclusion is an Environment, call it { C1 ... Cn }
    debug( 'conclusion is an environment' )
    // (Some of the C1,...Cn may be givens and some may be claims.)
    let Cs = conclusion.children().slice()
    if ( Cs.length == 0 ) {
      debug( 'rule T' )
      // We've been asked to prove the constant True, so just apply rule T.
      yield ({
        solution : toExtend,
        premises : premises,
        conclusion : conclusion
      })
    } else {
      const C1 = Cs.shift()
      Cs = new Environment( ...Cs.map( child => child.copy() ) )
      if ( C1.isAGiven ) {
        // In order to justify { :C1 C2 ... Cn }, we must assume C1 by moving it
        // to the premise list, and then prove { C2 ... Cn } (which contains
        // some combination of givens/claims unspecified here).
        // Because C1 may be a complex hierarchy, we first apply to it the
        // canonicalization scheme that gets it into the appropriate premise
        // form, then re-sort premises to preserve order.
        const combined = canonicalPremises( [ C1.claim() ] ).concat( premises )
        combined.sort( ( a, b ) => complexity( a ) - complexity( b ) )
        debug( 'rule GR, new premises:',
               combined.map( p => `${p}` ).join( ', ') )
        yield* findDerivationMatches( combined, Cs, toExtend, options )
      } else { // C1 is a claim
        // In order to justify the full set of Cs, we must first prove C1, then
        // see if any matching solution that let us do so is extendable to prove
        // the remaining Cs in the list.
        debug( `can we prove ${C1}?  rule-CR recur...` )
        for ( const result1 of
              findDerivationMatches( premises, C1, toExtend, options ) ) {
          // result1 thus contains a solution that can be used to prove C1.
          // But can it be used to prove the remaining conclusions C2,...,Cn?
          // Our new goal is to prove those, with the solution we've found so
          // far applied to them, to instantiate any now-determined
          // metavariables:
          Cs = result1.solution.apply( Cs )
          debug( `applied ${result1.solution} to conclusions: ${Cs}` )
          // Recur to try to prove the remaining environment { C2 ... Cn }
          // (which, again, may contain a combination of givens and claims).
          for ( const result2 of findDerivationMatches(
                  result1.premises, Cs, result1.solution, options ) ) {
            // For each solution that proved all of them, assemble a result:
            // Its solution is the solution we return.
            // Its premises are the premises we return.
            // Its conclusion is almost the conclusion we return; we just have
            // to re-add onto it the fully-instantiated copy of C1 we proved.
            debug( `rule-CR recursion complete: ${result2.solution}` )
            yield ({
              solution : result2.solution,
              premises : result2.premises,
              conclusion : new Environment(
                result1.conclusion, ...result2.conclusion.children() )
            })
          }
        }
      }
    }
  }
  debugout()
}

// Convenience wrapper around findDerivationMatches()
function* derivationMatches ( premises, conclusion, options = { } ) {
  // convert the premises to canonical form, provide a default empty matching
  // solution, and return the result of the findDerivationMatches() iterator,
  // but filtered for uniqueness
  debug( '\nSTART:\n------' )
  debugrestart()
  const solutionsFound = [ ]
  for ( const result of findDerivationMatches( canonicalPremises( premises ),
                                               conclusion,
                                               new MatchingSolution(),
                                               options ) ) {
    if ( !solutionsFound.some( s => s.equals( result.solution ) ) ) {
      solutionsFound.push( result.solution )
      yield result.solution
    }
  }
}

// Convenience wrapper for computing all values of the iterator
// and dropping the premises/conclusions attributes in each
const allDerivationMatches = ( premises, conclusion, options = { } ) => {
  const result = [ ]
  for ( const solution of derivationMatches( premises, conclusion, options ) )
    result.push( solution )
  return result
}

// Convenience wrapper for checking whether a derivation holds/not, without
// getting any matches, and by being more efficient.
const existsDerivation = ( premises, conclusion, options = { } ) =>
  derivationMatches( premises, conclusion, options ).next().value !== undefined

// Efficiency improvements for later:
//  - When the conclusion is a statement, so our only two rules are S and GL,
//    do not loop through the premises, trying S and GL on each.  Instead,
//    loop through all premises trying S first, and only if they all fail,
//    loop through all premises trying GL.
//  - In the final subcase of findDerivationMatches(), where you are trying
//    to prove many conclusions C1,...,Cn, after having successfully proven
//    C1, take advantage of that to simplify further recursion, in two ways:
//    1. Add C1 to the list of premises (LHS of turnstile) when you recur.
//    2. Remove C1 from any other premise's list of givens-needing-proof, and
//    adjust the order of those premises to preserve increasing order of
//    number of givens.
//  - When adding new premises in findDerivationMatches() recursion, don't
//    re-sort the whole premises list; just insert the new ones in ways that
//    preserve ordering.
//  - Pre-compute which LCs contain metavariables and just
//    looking it up in pairUp() rather than recomputing it.
//  - Is there any efficiency in creating a routine that can quickly detect when
//    a match is not possible?  For example, if both are compound with different
//    head symbols or different numbers of children, it can't match.  Or if one
//    is a metavariable and the other is not, it can.  Could this be used to
//    prune some explorations early?
//  - Consider the redundancy inherent in exploring all possibilities from
//    Gamma, { :A B }, { :C D } |- P.  If we apply GL to the first environment
//    premise and then the second, we get four subcases we must prove, but the
//    first of them implies the third, so we should consider only three:
//    Gamma |- C;  Gamma, D |- A;  Gamma, B |- C;  Gamma, B, D |- P.

module.exports.containsMetavariables = containsMetavariables
module.exports.pairUp = pairUp
module.exports.canonicalPremises = canonicalPremises
module.exports.derivationMatches = derivationMatches
module.exports.allDerivationMatches = allDerivationMatches
module.exports.existsDerivation = existsDerivation
