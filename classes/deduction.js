
const { LC } = require( './lc.js' )
const { Statement } = require( './statement.js' )
const { Environment } = require( './environment.js' )
const { MatchingProblem, MatchingSolution } =
  require( '../classes/matching.js' )

let verbose = false
let debug = ( ...msgs ) => { if (verbose) console.log(...msgs) }

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
  return mv1 == mv2 ? LC1.equals( LC2 ) :
         mv1 ? [ LC1, LC2 ] : [ LC2, LC1 ]
}

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
    const conclusions = premise instanceof Statement ?
      ( premise.isAGiven ? [ ] : [ premise ] ) : premise.conclusions()
    for ( const conclusion of conclusions ) {
      const result = [ conclusion ]
      let walk = conclusion
      while ( walk = prev( walk ) ) {
        if ( walk.isAGiven ) result.unshift( walk )
      }
      results.push( new Environment( ...result.map( x => x.copy() ) ) )
    }
  }
  results.sort( ( a, b ) => a.children().length - b.children().length )
  return results.map( premise =>
    premise.children().length == 1 ? premise.children()[0] : premise )
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
function* findDerivationMatches ( premises, conclusion, toExtend ) {
  debug( premises.map( p => `${p}` ).join( ', ' ),
    `|- ${conclusion}     extending ${toExtend}` )
  // Consider the case where the conclusion is a Statement
  if ( conclusion instanceof Statement ) {
    debug( '\tconclusion is a statement' )
    for ( let i = 0 ; i < premises.length ; i++ ) {
      const premise = premises[i]
      if ( premise instanceof Statement ) {
        debug( `\tpremise is a statement: ${premise}` )
        const P = pairUp( premise, conclusion )
        if ( P === true ) { // premise equals conclusion -- apply rule S
          debug( '\trule S straight equality' )
          yield ({
            solution : toExtend,
            premises : premises,
            conclusion : conclusion
          })
        } else if ( P instanceof Array ) {
          // premise may match conclusion or vice versa; let's check
          const problem = toExtend.asProblem()
          problem.addConstraint( P[0], P[1] )
          debug( `\tadd S-match requirement: (${P[0]},${P[1]})` )
          // for each way that it matches, return that way as a solution
          for ( const solution of problem.enumerateSolutions() ) {
            debug( `\trule S by match: ${solution}` )
            yield ({
              solution : solution,
              premises : premises.map( p => solution.apply( p ) ),
              conclusion : solution.apply( conclusion )
            })
          }
        }
      } else { // premise is an environment, call it { :A1 ... :An B }
        debug( `\tpremise is an environment: ${premise}` )
        const As = premise.children().slice().map( A => A.claim() )
        const B = As.pop()
        const P = pairUp( B, conclusion )
        if ( P === true ) { // B equals conclusion -- apply rule GL
          debug( `\tconclusion match; recur w/GL: ${new Environment(...As)}` )
          yield* findDerivationMatches(
            [ ...premises.slice( 0, i ), ...premises.slice( i+1 ) ],
            new Environment( ...As ), toExtend )
        } else if ( P instanceof Array ) {
          // B may match conclusion or vice versa; let's check
          const problem = toExtend.asProblem()
          problem.addConstraint( P[0], P[1] )
          debug( `\tadd GL-match requirement: (${P[0]},${P[1]})` )
          // for each way that it matches, check to see if that match
          // can be extended to a proof of the required parts of rule GL,
          // and yield each way that it can
          for ( const solution of problem.enumerateSolutions() ) {
            debug( `\trule GL by match: ${solution}` )
            const fewerPremises =
              [ ...premises.slice( 0, i ), ...premises.slice( i+1 ) ]
            yield* findDerivationMatches(
              fewerPremises.map( p => solution.apply( p ) ),
              solution.apply( new Environment( ...As ) ),
              solution )
          }
        }
      }
    }
  } else { // conclusion is an Environment, call it { C1 ... Cn }
    debug( '\tconclusion is an environment' )
    // (Some of the C1,...Cn may be givens and some may be claims.)
    let Cs = conclusion.children().slice()
    if ( Cs.length == 0 ) {
      debug( '\trule T' )
      // We've been asked to prove the constant True, so just apply rule T.
      yield ({
        solution : toExtend,
        premises : premises,
        conclusion : conclusion
      })
    } else {
      const C1 = Cs.shift()
      Cs = new Environment( ...Cs )
      if ( C1.isAGiven ) {
        // In order to justify { :C1 C2 ... Cn }, we must assume C1 by moving it
        // to the premise list, and then prove { C2 ... Cn } (which contains
        // some combination of givens/claims unspecified here).
        // Because C1 may be a complex hierarchy, we first apply to it the
        // canonicalization scheme that gets it into the appropriate premise
        // form, then re-sort premises to preserve order.
        const combined = canonicalPremises( [ C1.claim() ] ).concat( premises )
        combined.sort( ( a, b ) => a.children().length - b.children().length )
        debug( '\trule GR, new premises:',
               combined.map( p => `${p}` ).join( ', ') )
        yield* findDerivationMatches( combined, Cs, toExtend )
      } else { // C1 is a claim
        // In order to justify the full set of Cs, we must first prove C1, then
        // see if any matching solution that let us do so is extendable to prove
        // the remaining Cs in the list.
        debug( `\tcan we prove ${C1}?  rule-CR recur...` )
        for ( const result1 of
              findDerivationMatches( premises, C1, toExtend ) ) {
          // result1 thus contains a solution that can be used to prove C1.
          // But can it be used to prove the remaining conclusions C2,...,Cn?
          // Our new goal is to prove those, with the solution we've found so
          // far applied to them, to instantiate any now-determined
          // metavariables:
          Cs = result1.solution.apply( Cs )
          debug( `\tapplied ${result1.solution} to conclusions: ${Cs}` )
          // Recur to try to prove the remaining environment { C2 ... Cn }
          // (which, again, may contain a combination of givens and claims).
          for ( const result2 of findDerivationMatches(
                  result1.premises, Cs, result1.solution ) ) {
            // For each solution that proved all of them, assemble a result:
            // Its solution is the solution we return.
            // Its premises are the premises we return.
            // Its conclusion is almost the conclusion we return; we just have
            // to re-add onto it the fully-instantiated copy of C1 we proved.
            debug( `\trule-CR recursion complete: ${result2.solution}` )
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
}

// Convenience wrapper around findDerivationMatches()
function* derivationMatches ( premises, conclusion ) {
  // convert the premises to canonical form, provide a default empty matching
  // solution, and return the result of the findDerivationMatches() iterator,
  // but filtered for uniqueness
  debug( '\nSTART:\n------' )
  const solutionsFound = [ ]
  for ( const result of findDerivationMatches( canonicalPremises( premises ),
                                               conclusion,
                                               new MatchingSolution() ) ) {
    if ( !solutionsFound.some( s => s.equals( result.solution ) ) ) {
      solutionsFound.push( result.solution )
      yield result.solution
    }
  }
}

// Convenience wrapper for computing all values of the iterator
// and dropping the premises/conclusions attributes in each
const allDerivationMatches = ( premises, conclusion ) => {
  const result = [ ]
  for ( const solution of derivationMatches( premises, conclusion ) )
    result.push( solution )
  return result
}

// To do:
//  - Start testing and debugging findDerivationMatches().
//  - Efficiency improvements for later:
//     - When the conclusion is a statement, so our only two rules are S and GL,
//       do not loop through the premises, trying S and GL on each.  Instead,
//       loop through all premises trying S first, and only if they all fail,
//       loop through all premises trying GL.
//     - In the final subcase of findDerivationMatches(), where you are trying
//       to prove many conclusions C1,...,Cn, after having successfully proven
//       C1, take advantage of that to simplify further recursion, in two ways:
//       1. Add C1 to the list of premises (LHS of turnstile) when you recur.
//       2. Remove C1 from any other premise's list of givens-needing-proof, and
//       adjust the order of those premises to preserve increasing order of
//       number of givens.
//     - When adding new premises in findDerivationMatches() recursion, don't
//       re-sort the whole premises list; just insert the new ones in ways that
//       preserve ordering.
//     - Pre-compute which LCs contain metavariables and just
//       looking it up in pairUp() rather than recomputing it.

module.exports.containsMetavariables = containsMetavariables
module.exports.pairUp = pairUp
module.exports.canonicalPremises = canonicalPremises
module.exports.derivationMatches = derivationMatches
module.exports.allDerivationMatches = allDerivationMatches
