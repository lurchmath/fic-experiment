
const { LC } = require( './lc.js' )
const { Statement } = require( './statement.js' )
const { Environment } = require( './environment.js' )
const { MatchingProblem, MatchingSolution } =
  require( '../classes/matching.js' )

const verbose = false
const maxDepth = 30
const eachIndent = 4
let indent = ''
const debugrestart = () => indent = ''
const debugin = () => indent += '                 '.substring( 0, eachIndent )
const debugout = () => indent = indent.substring( eachIndent )
const debug = ( ...msgs ) => {
  if ( verbose ) {
    if ( indent.length > maxDepth * eachIndent ) {
      console.log( indent, '*** INDENT TOO DEEP -- INFINITE RECURSION ? ***' )
      throw Error( 'Infinite recursion???' )
    }
    console.log( indent, ...msgs )
  }
}

// Does the given LC contain a metavariable anywhere in its hierarchy?
const containsMetavariables = lc =>
  lc.isAMetavariable || lc.children().some( containsMetavariables )

// Compare two LCs in a way that is useful for the derivation checker, below.
// Specifically, it returns an object with the following attributes:
//  - First, one attribute that is always present:
//     - same: always a boolean, whether the two LCs had the same meaning and
//       should thus be considered equal for deduction
//  - Second, two attributes that are present only if !same and precisely one of
//    the two inputs contains metavariables:
//     - pattern: the one input that contains metavariables
//     - expression: the one input that does not
// Thus we will get one of three types of results:
// { same: true } means the LCs have the same meaning
// { same: false } means the LCs have different meanings, but either both or
//   neither had metavariables, so we cannot use matching to make progress on
//   trying to reconcile their differing meanings
// { same: false, pattern: P, expression: E } means the CLs have different
//   meanings, and we can use matching with the given (P,E) pair to try to make
//   progress on reconciling those different meanings
const compareLCs = ( lc1, lc2 ) => {
  if ( lc1.hasSameMeaningAs( lc2 ) ) return { same : true }
  const mv1 = containsMetavariables( lc1 )
  const mv2 = containsMetavariables( lc2 )
  return mv1 == mv2 ? { same : false } :
         mv1 ? { same : false, pattern : lc1, expression : lc2 }
             : { same : false, pattern : lc2, expression : lc1 }
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

// It's efficient to treat premises in these ways:
// First, keep them sorted by complexity, so the easiest ones are tried first.
// Second, don't include any duplicate statements, since statement premises are
// not consumed when used, so one copy is as good as a thousand.
// Third, apply the previous idea to situations like X vs. { :A :B X }, where
// we will keep only the X rather than the strictly weaker form.
const efficientPremiseList = ( premiseList ) => {
  premiseList.sort( ( a, b ) => complexity( a ) - complexity( b ) )
  const result = [ ]
  for ( const premise of premiseList ) {
    if ( premise instanceof Statement
      && result.some( entry => entry.hasSameMeaningAs( premise ) ) ) continue
    if ( premise instanceof Environment
      && result.some( entry => entry.hasSameMeaningAs( premise.last ) ) )
      continue
    result.push( premise )
  }
  return result
}

// The canonical form of a premise list is this:
// Let C1, ..., Cn be the list of conclusions in the premise list.
// Then the set of entries in the canonical form is E1, ..., En, where each
// Ei = { :P1 ... :Pk Ci }, with P1 through Pk being all the givens accessible
// to Ci within the given premise list.
// The Ei should be returned as a list, sorted in increasing order of length of
// children (i.e., number of givens).
const canonicalPremises = ( premises ) => {
  const results = [ ]
  for ( const premise of premises ) {
    const prev = ( lc ) =>
      lc == premise ? null :
      lc.previousSibling() ? lc.previousSibling() :
      lc.parent() && lc.parent() != premise ? prev( lc.parent() ) : null
    let body = premise.isAnActualDeclaration() ? premise.last : null
    const conclusions =
      premise instanceof Statement || premise.isAnActualDeclaration() ?
        ( premise.isAGiven ? [ ] : [ premise ] ) :
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
  return efficientPremiseList( results.map( premise =>
    premise.children().length == 1 ? premise.first : premise ) )
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
  // now the actual routine begins
  debugin()
  debug( premises.map( p => `${p}` ).join( ', ' ),
    `|- ${conclusion}     extending ${toExtend}` )
  // Most of our code works on conclusions that are Statements, so let's begin
  // by taking conclusions that are Environments and recursively breaking them
  // down, so that in the rest of this routine we can assume the conclusion is
  // a statement.
  if ( conclusion instanceof Environment        // say { C1 ... Cn }
    && !conclusion.isAnActualDeclaration() ) {  // handle declarations later
    let Cs = conclusion.children().slice()
    debug( `conclusion is an Environment of length ${Cs.length}` )
    // If the environment is length 0, that's equivalent to the constant True.
    if ( Cs.length == 0 ) {
      // apply rule T:
      debug( 'rule T' )
      yield toExtend
    } else { // n > 0, there are conclusions to prove
      // Pop the first thing off the conclusions Environment
      // and process it as either a given or a claim, depending on its status:
      const C1 = Cs.shift()
      Cs = new Environment( ...Cs.map( child => child.copy() ) )
      if ( C1.isAGiven ) {
        // In order to justify { :C1 C2 ... Cn }, we must assume C1 by moving it
        // to the premise list, and then prove { C2 ... Cn } (which contains
        // some combination of givens/claims unspecified by that notation).
        // Because C1 may be a complex hierarchy, we first apply to it the
        // canonicalization scheme that gets it into the appropriate premise
        // form, then re-sort premises to preserve order.
        const combined = efficientPremiseList(
          canonicalPremises( [ C1.claim() ] ).concat( premises ) )
        debug( 'rule GR, new premises:', combined.map( p => `${p}` ).join( ', ' ) )
        yield* findDerivationMatches( combined, Cs, toExtend, options )
      } else { // C1 is a claim
        // In order to justify the full set of Cs, we must first prove C1, then
        // see if any matching solution that let us do so is extendable to prove
        // the remaining Cs in the list.
        debug( `can we prove ${C1}?  rule-CR recur...` )
        for ( const result1 of
              findDerivationMatches( premises, C1, toExtend, options ) ) {
          // result1 thus contains a solution that can be used to prove C1.  But
          // can it be used to prove the remaining conclusions C2,...,Cn?  Our
          // new goal is to prove those, with the solution we've found so far
          // applied to them, to instantiate any now-determined metavariables:
          Cs = result1.apply( Cs )
          // Recur to try to prove the remaining environment { C2 ... Cn }
          // (which, again, may contain a combination of givens and claims).
          debug( `applied ${result1} to conclusions: ${Cs}; continuing rule CR` )
          yield* findDerivationMatches(
            result1.apply( premises ), Cs, result1, options )
        }
      }
    }
  // Now we know the conclusion is either a Statement or a Declaration
  } else if ( conclusion instanceof Statement ) {
    debug( 'conclusion is a statement' )
    // Let's try to work backwards from the conclusion, seeing if any one of the
    // premises can make progress on it.  (Later we will try to work forwards
    // from the premises if working backwards fails, and if the options
    // parameter says we should also try to work forwards.)
    for ( let i = 0 ; i < premises.length ; i++ ) {
      let premise = premises[i]
      // If the premise is another statement, we can make progress only 2 ways:
      // Either rule S applies, or we can simplify through matching.
      if ( premise instanceof Statement ) {
        debug( `premise is a statement: ${premise}` )
        const comparison = compareLCs( premise, conclusion )
        // If there's a direct match, then apply rule S:
        if ( comparison.same ) {
          debug( 'straight premise-conclusion equality, so apply rule S' )
          yield toExtend
        // Otherwise, try to simplify the question through matching
        // (unless compareLCs() already said this was impossible):
        } else if ( comparison.pattern ) {
          const problem = toExtend.asProblem().plusConstraint(
            comparison.pattern, comparison.expression )
          debug( 'add S-match requirement: '
               + `(${comparison.pattern}, ${comparison.expression})` )
          // For each way that it matches, that's a new solution via rule S:
          for ( const solution of problem.enumerateSolutions() ) {
            debug( `match ${solution} lets us apply rule S` )
            yield solution
          }
        }
      // If the premise is an environment, then canonicalPremises() guarantees
      // it must be of the form { :A1 ... :An B }, so we break it out as such:
      } else if ( premise instanceof Environment
               && !premise.isAnActualDeclaration() ) {
        debug( `premise is an environment: ${premise}` )
        const As = premise.children().map( A => A.claim() )
        const B = As.pop()
        // The GL rule splits this into 2 subgoals:
        // 1. Can our other premises plus B prove the conclusion?
        // 2. Can our other premises prove { A1 ... An }?
        // These must both happen with the same metavariable instantiation, so
        // we must explore them using nested recursion.
        // This outer loop finds all the ways to solve subgoal 1:
        for ( const result1 of findDerivationMatches(
              efficientPremiseList( premises.without( i ).concat( [ B ] ) ),
              conclusion, toExtend, options ) ) {
          debug( `rule GL proved ${conclusion} with ${result1}` )
          // result1 thus contains a solution that can be used to prove B.  But
          // can it be used to prove the required assumptions A1,...,An?  Our
          // new goal is to prove those, with the solution we've found so far
          // applied to them, to instantiate any now-determined metavariables:
          let AEnv = result1.apply( new Environment( ...As ) )
          debug( `applying rule GL means next attacking the givens ${AEnv}` )
          // Recur to try to prove the remaining environment { A1 ... An }
          // (which, again, may contain a combination of givens and claims).
          // This inner loop finds all the ways to solve subgoal 2, while
          // remaining consistent with the current solution of subgoal 1:
          yield* findDerivationMatches(
            result1.apply( premises.without( i ) ), AEnv, result1, options )
        }
      } else { // the premise is a declaration
        // The only way a declaration can prove the conclusion is if its body
        // can prove the conclusion.  So we replace the declaration with its
        // body, converted to canonical premise form, and recur.  This requires
        // re-sorting the premises by complexity.
        debug( `Trying the DE/LE rule on premise ${premise}` )
        const newPremises = [ ...premises.without( i ),
                              ...canonicalPremises( [ premise.last ] ) ]
        newPremises.sort( ( a, b ) => complexity( a ) - complexity( b ) )
        yield* findDerivationMatches(
          newPremises, conclusion, toExtend, options )
      }
    }
  // Finally, consider the case where the conclusion is a Declaration:
  } else if ( conclusion.isAnActualDeclaration() ) {
    debug( `conclusion is a ${conclusion.declaration} declaration` )
    // We have only one rule that can prove a declaration:  The LI/DI rule,
    // which says we must have a premise of the same form, and its body must
    // prove the conclusion's body.  We thus pre-compute key features of the
    // conclusion's form, as a declaration, for use in comparison, below:
    const cmv = containsMetavariables( conclusion )
    const cBody = conclusion.last.copy()
    const cVars = new Environment(
      ...conclusion.allButLast.map( child => child.copy() ) )
    debug( `cVars ${cVars} cBody ${cBody} cmv ${cmv}` )
    // Then we loop through all premises, seeking one of the same form:
    for ( let i = 0 ; i < premises.length ; i++ ) {
      let premise = premises[i]
      // If one is a declaration, then process it as follows:
      if ( premise.isAnActualDeclaration() ) {
        // It must be the same type and declare the same number of variables:
        if ( premise.declaration != conclusion.declaration
          || premise.children().length != conclusion.children().length ) continue
        debug( `found premise ${premise} of the same form` )
        const pmv = containsMetavariables( premise )
        const pBody = premise.last.copy()
        const pVars = new Environment(
          ...premise.allButLast.map( child => child.copy() ) )
        debug( `pVars ${pVars} pBody ${pBody} pmv ${pmv}` )
        // Now we must have the premise variables and conclusion variables are
        // the same (or can be made the same through matching) and then the
        // premise body proves the conclusion body (using the same metavariable
        // instantiation).  So we first find all instantiations that satisfy the
        // variable requirements (if any).
        if ( cmv == pmv ) {
          // In this case, either the premise and the conclusion contain
          // metavariables, or neither does.  Either way, strict equality of
          // variables is required:
          if ( cVars.children().some(
                ( v, i ) => !v.equals( pVars.child( i ) ) ) ) continue
          debug( 'straight match of variables; recurring with rule LI/DI' )
          // Now that it has been established, try recursion to see if the premise
          // body proves the conclusion body:
          yield* findDerivationMatches( canonicalPremises( [ pBody ] ), cBody,
                                        toExtend, options )
        } else {
          // In this case, either the premise has metavariables and the conclusion
          // does not, or vice versa.  We split their variables as follows.
          const patterns = pmv ? pVars : cVars
          const expressions = cmv ? pVars : cVars
          const problem = toExtend.asProblem().plusConstraints(
            patterns.children(), expressions.children() )
          // Now for each match of all those variables (if any), check to see if,
          // using that instantiation, we can then get the premise body to prove
          // the conclusion body:
          debug( `must check for matches among ${patterns} and ${expressions}` )
          for ( const matchSol of problem.enumerateSolutions() ) {
            debug( `instantiation ${matchSol} lets us recur with rule LI/DI` )
            yield* findDerivationMatches(
              canonicalPremises( [ matchSol.apply( pBody ) ] ),
              matchSol.apply( cBody ), matchSol, options )
          }
        }
      // Or if the premise is an environment { :A1 ... :An B }, then its
      // conclusion B might be a declaration that justifies this conclusion:
      } else if ( premise instanceof Environment ) {
        // We handle all this extremely similarly to the previous case, except
        // that if it works, we have to then try to prove all the required
        // premises A1 through An.  The following will seem quite familiar!
        const body = premise.last
        // It must be the same type and declare the same number of variables:
        if ( body.declaration != conclusion.declaration
          || body.children().length != conclusion.children().length ) continue
        debug( `found premise ${premise} w/body of the same form` )
        const pmv = containsMetavariables( body )
        const pBody = body.last.copy()
        const pVars = new Environment(
          ...body.allButLast.map( child => child.copy() ) )
        debug( `pVars ${pVars} pBody ${pBody} pmv ${pmv}` )
        // Now we must have the premise variables and conclusion variables are
        // the same (or can be made the same through matching) and then the
        // premise body proves the conclusion body (using the same metavariable
        // instantiation).  So we first find all instantiations that satisfy the
        // variable requirements (if any).
        if ( cmv == pmv ) {
          // In this case, either the premise and the conclusion contain
          // metavariables, or neither does.  Either way, strict equality of
          // variables is required:
          if ( cVars.children().some(
                ( v, i ) => !v.equals( pVars.child( i ) ) ) ) continue
          debug( 'straight match of variables; recurring with rule LI/DI' )
          // Now that it has been established, try recursion to see if the premise
          // body proves the conclusion body.  If it does, then try to use that
          // same match to prove the required givens A1 through An.
          for ( const result1 of findDerivationMatches(
                canonicalPremises( [ pBody ] ), cBody, toExtend, options ) ) {
            debug( `rule GL proved ${conclusion} with ${result1}` )
            // result1 thus contains a solution that can be used to prove B.  But
            // can it be used to prove the required assumptions A1,...,An?  Our
            // new goal is to prove those, with the solution we've found so far
            // applied to them, to instantiate any now-determined metavariables:
            let AEnv = result1.apply( new Environment(
              ...premise.allButLast.map( A => A.claim() ) ) )
            debug( `applying rule GL means next attacking the givens ${AEnv}` )
            // Recur to try to prove the remaining environment { A1 ... An }
            // (which, again, may contain a combination of givens and claims).
            // This inner loop finds all the ways to solve subgoal 2, while
            // remaining consistent with the current solution of subgoal 1:
            yield* findDerivationMatches(
              result1.apply( premises.without( i ) ), AEnv, result1, options )
          }
        } else {
          // In this case, either the body has metavariables and the conclusion
          // does not, or vice versa.  We split their variables as follows.
          const patterns = pmv ? pVars : cVars
          const expressions = cmv ? pVars : cVars
          const problem = toExtend.asProblem().plusConstraints(
            patterns.children(), expressions.children() )
          // Now for each match of all those variables (if any), check to see if,
          // using that instantiation, we can then get the premise body to prove
          // the conclusion body:
          debug( `must check for matches among ${patterns} and ${expressions}` )
          for ( const matchSol of problem.enumerateSolutions() ) {
            debug( `instantiation ${matchSol} lets us recur with rule LI/DI` )
            for ( const result1 of findDerivationMatches(
                  canonicalPremises( [ matchSol.apply( pBody ) ] ),
                  matchSol.apply( cBody ), matchSol, options ) ) {
              debug( `rule GL proved ${conclusion} with ${result1}` )
              // very similar to above; not repeating comments again
              let AEnv = result1.apply( new Environment(
                ...premise.allButLast.map( A => A.claim() ) ) )
              debug( `applying rule GL means next attacking the givens ${AEnv}` )
              // very similar to above; not repeating comments again
              yield* findDerivationMatches(
                result1.apply( premises.without( i ) ), AEnv, result1, options )
            }
          }
        }
      }
    }
  }
  // I am no longer sure the following code is required.

  // // In the event that we found no solutions by working backwards from our
  // // goal, we may still find solutions by working forward from our premises,
  // // but this is typically more expensive.  So we do not do it by default.
  // // But if the user sets options.workBothWays to true, we will.
  // // To do so, we seek any formula premise F and any non-formula premise P
  // // such that the first given inside F matches P.
  // if ( options.workBothWays ) {
  //   debug( `trying working forwards from premises...` )
  //   for ( let i = 0 ; i < premises.length ; i++ ) {
  //     let F = premises[i]
  //     if ( !containsMetavariables( F ) || !( F instanceof Environment ) )
  //       continue
  //     let G = F.first
  //     if ( !G.isAGiven ) continue
  //     debug( `can we satisfy premise ${G} in ${F}?` )
  //     for ( let P of premises.filter( p => !p.isAFormula ) ) {
  //       const problem = toExtend.asProblem().plusConstraint( G.claim(), P )
  //       debug( `trying out this new matching constraint: (${G},${P})` )
  //       // for each way that it matches, check to see if that match can be the
  //       // start of a proof using the now one-step-smaller premise F
  //       for ( const solution of problem.enumerateSolutions() ) {
  //         debug( `satisfied: ${solution}...so removing ${G} from ${F}` )
  //         const newPremises = solution.apply( premises )
  //         newPremises[i].removeChild( 0 )
  //         yield* findDerivationMatches(
  //           newPremises, solution.apply( conclusion ), solution, options )
  //       }
  //     }
  //   }
  // }
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
    if ( !solutionsFound.some( s => s.equals( result ) ) ) {
      solutionsFound.push( result )
      yield result
    }
  }
  debugrestart()
  debug( '------\n END' )
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
const existsDerivation = ( premises, conclusion, options = { } ) => {
  // console.log( `Does ${premises.map(p=>`${p}`).join(', ')} |- ${conclusion} ?` )
  // console.log( 'Efficient:',
  //              canonicalPremises( premises ).map( x=>`${x}` ).join( ', ' ) )
  const result = derivationMatches( premises, conclusion, options ).next().value
             !== undefined
  // console.log( `\t${result ? 'YES' : 'NO'}` )
  return result
}

// Efficiency improvements for later:
//  - In findDerivationMatches(), where you are trying to prove many conclusions
//    C1,...,Cn, after having successfully proven C1, take advantage of that to
//    simplify further recursion, in two ways:
//    1. Add C1 to the list of premises (LHS of turnstile) when you recur.
//    2. Remove C1 from any other premise's list of givens-needing-proof, and
//    adjust the order of those premises to preserve increasing order of
//    number of givens.
//  - Pre-compute which LCs contain metavariables and just look the result up
//    in compareLCs() rather than recomputing it.
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
//  - There is another redundancy in the recursion.  For example, consider the
//    rule that converts the goal Gamma, { :A B } |- C to the two subgoals
//    Gamma, B |- C and Gamma |- A.  In the first subgoal, we somehow want to
//    say "and you must use B," because any derivation Gamma, B |- C that
//    doesn't use B is a derivation Gamma |- C, which will be found without
//    our exploring { :A B } in the first place.  There's no need to find such a
//    derivation twice.  It would be nice to be able to mark some premise as
//    "must be used" so that if we ever get to a point where we would want to
//    drop that premise and explore a subgoal, we would simply give up and not
//    explore it, knowing that any such proof will be found elsewhere instead.

module.exports.containsMetavariables = containsMetavariables
module.exports.compareLCs = compareLCs
module.exports.canonicalPremises = canonicalPremises
module.exports.derivationMatches = derivationMatches
module.exports.allDerivationMatches = allDerivationMatches
module.exports.existsDerivation = existsDerivation
