
const { LC } = require( './lc.js' )
const { Environment } = require( './environment.js' )
const { Matcher } = require( '../classes/matching.js' )

// let verbose = false
// let debug = ( msg ) => { if (verbose) console.log(msg) }

function derives ( ...LCs ) {
  // You are allowed to pass only LCs to this function:
  if ( LCs.some( arg => !( arg instanceof LC ) ) )
    throw( 'The derives function accepts only LC instances as arguments' )

  // Compute normal forms of all arguments, splitting into premises & conclusion
  // If any premises are Givens, convert them to Claims (since 'premise' means
  // 'given' in LC-land.)
  let conclusion = LCs.pop().normalForm()
  let premises = LCs.map( premise => premise.normalForm().claim() )

  // if (premises) {
  //   debug( '** Does ' + premises.map( x => ''+x ).join( ', ' )
  //              + ' |- ' + conclusion + ' ?' )
  // } else {
  //   debug( '** Does |- ' + conclusion + ' ?' )
  // }

  // You're not supposed to ask whether assumptions are provable:
  if ( conclusion.isAGiven )
    throw( 'The derives function requires the conclusion to be a claim' )

  // debug('** Checking Rule S...')
  // S rule: Gamma, A |- A  and a special case of rules D and L
  if ( premises.some( premise => premise.value().hasSameMeaningAs( conclusion ) ) ) {
    // debug( '** S rule -> derivation holds.')
    return true
  }

  // debug('** Checking Rule T...')
  // T rule: Gamma |- { }
  if ( conclusion instanceof Environment
    && conclusion.children().length == 0 ) {
    // debug( '** T rule -> derivation holds.' )
    return true
  }

  // Now we consider the rules which require the conclusion to be a pair
  // but not a Declaration

  // a convenient utility for working with pairs
  let ABPair = ( lc ) =>
    lc instanceof Environment && lc.isAClaim
                              && lc.children().length == 2
                              && !lc.isAnActualDeclaration() ?
      { A : lc.children()[0], B : lc.children()[1] }
    : null

  // check if the conclusion is ab pair
  let cpair = ABPair( conclusion )
  if ( cpair ) {

    // debug('** Conclusion is a pair')

    // GR rule: From Gamma, A |- B get Gamma |- { :A B }
    if ( cpair.A.isAGiven ) {
      // debug( '** Try GR rule recursively:' )
      return derives( ...premises, cpair.A.claim(), cpair.B )
    }

    // CR rule: From Gamma |- A and Gamma |- B get Gamma |- { A B }
    // (at this point, we know A is a claim)
    // debug( '** Try CR rule recursively:' )
    return derives( ...premises, cpair.A )
        && derives( ...premises, cpair.B )
  }

  // debug('** The conclusion is not a pair.')

  // At this point we have taken care of the cases where the conclusion is { },
  // or a pair. Since it is in normal form, that leaves only the cases where
  // the conclusion is either a Declaration or a Statement.

  // If it is a declaration it can only follow from a Declaration of the
  // same type by rules (DI) and (LI).
  // But we might have to drill down into a pair to find it.

  // So we first check the current premises to see if any is a Declaration of
  // a similar form and check if its value justifies the value of
  // the conclusion.  This checks Rules (DI) and (LI), namely
  // from M|-L we can conclude Gamma,Declare{ ...c M } |- Declare{ ...c L }
  // and similarly for Lets.

  // debug('** Checking rules DI and DL')
  if ( premises.some( prem => prem.hasSimilarForm(conclusion) &&
                      derives(prem.value(),conclusion.value()) ) ) return true

  // debug('** Rules DI and DL do not apply.  Converting premises to their values')

  // If we made it this far then none of the current premises worked for DI or
  // LI, so we should replace any premises that are declarations with their
  // values by the special case of rules (D) and (L) with M=L.
  let premisevalues = premises.map( x => x.value() )

  // debug('** New premises are '+premisevalues)

  // OK, so the only rules we haven't tried are GL and CL.  We check each
  // with the following proc to see if one of these rules succeeds.
  let premiseWorks = (prem, premindex) => {
      let ppair = ABPair(prem)
      // if it isn't, then we are done with this premise.
      if (!ppair) return false

      let gamma = premisevalues.slice()
      gamma.splice( premindex, 1 )
      // debug( '** The premise being tested is a pair, so here is gamma:'+gamma )

      // GL rule: From Gamma |- A and Gamma, B |- C get Gamma, { :A B } |- C
      if ( ppair.A.isAGiven ) {
        // debug( '** Try GL rule recursively:' )
        return derives( ...gamma, ppair.A.claim() )
            && derives( ...gamma, ppair.B, conclusion )
      } else {
      // CL rule: From Gamma, A, B |- C get Gamma, { A B } |- C
      // (at this point, we know A is a claim)
      // debug( '** Try CL rule recursively:' )
      return derives( ...gamma, ppair.A, ppair.B,
                      conclusion )
    }
  }

  if (premisevalues.some(premiseWorks)) return true

  // If none of those rules help, it doesn't follow.
  // debug( '** no rule -> derivation does not hold.' )
  return false
}

// Takes any generator and computes all its values, creating an array.
let generatorToArray = ( gen ) => {
  let next = gen.next()
  return next.done ? [ ] : [ next.value ].concat( generatorToArray( gen ) )
}

// Creates a generator that will iterate through all instantiations of
// metavariables that would let Gamma |- conclusion.  Clients should ignore
// the third parameter, which is used only in recursion.
function* iterateHowToDerive ( Gamma, conclusion, matchingProblems ) {

  // If this is a top-level call, the client will not pass a third argument,
  // and the default is a single, empty matching problem.
  if ( !matchingProblems ) matchingProblems = [ new Matcher() ]

  // // debugging stuff:
  // console.log( 'How to derive?' )
  // console.log( '\t', Gamma.map( x => x.toString() ).join( ', ' ),
  //              '|-', conclusion.toString(), '?' )
  // if ( !( matchingProblems instanceof Array ) )
  //   matchingProblems = generatorToArray( matchingProblems )
  // for ( let mp of matchingProblems )
  //   console.log( '\t', mp.toString() )
  // // end debugging stuff

  // Handle rule T:
  // If the conclusion is the empty environment (meaning "true") then every
  // matching problem we received as input trivially counts as a valid solution.
  if ( conclusion instanceof Environment && conclusion.children().length == 0 )
    yield* matchingProblems

  // Handle rule S:
  // For each premise in Gamma, could it alone justify the conclusion?
  for ( let premise of Gamma ) {
    // It may directly match, including having the same metavariable on both
    // sides of the turnstile.  We handle that simple case first.
    if ( premise.hasSameMeaningAs( conclusion ) ) {
      yield* matchingProblems
      continue
    }
    // If neither of the two have metavariables, that was our only hope, so
    // let's move on and not waste time exploring this rule further.
    let premiseHasMetavars =
      premise.hasDescendantSatisfying( x => x.isAMetavariable )
    let conclusionHasMetavars =
      conclusion.hasDescendantSatisfying( x => x.isAMetavariable )
    if ( !premiseHasMetavars && !conclusionHasMetavars ) continue
    // Conversely, if both sides have metavariables in them, we are stuck,
    // because that would be properly unification, not just matching,
    // so we don't have software to support it.
    if ( premiseHasMetavars && conclusionHasMetavars ) continue
    // Now figure out which one has the metavars...
    let withMV = premiseHasMetavars ? premise : conclusion
    let withoutMV = premiseHasMetavars ? conclusion : premise
    // We consider each currently existing possibility for how to instantiate
    // metavariables that's consistent with the needs of this derivation so far:
    for ( let possibility of matchingProblems ) {
      // Augment that possibility with the pair (withMV,withoutMV).
      // If the match is still possible, then yield it as one solution.
      // (We know this is OK because conclusion contains no metavariables.)
      let augmented = possibility.copy()
      augmented.addConstraint( withMV, withoutMV )
      if ( augmented.copy().isSolvable() ) yield augmented
    }
  }

  // Next we consider the two rules in which the conclusion is a pair:
  if ( conclusion instanceof Environment && conclusion.children().length == 2 )
  {
    let A = conclusion.children()[0]
    let B = conclusion.children()[1]

    // Handle rule GR:
    // If the conclusion is of the form { :A B }, then we just yield the same
    // thing we would if the problem had been Gamma,A |- B instead.
    if ( A.isAGiven && B.isAClaim )
      yield* iterateHowToDerive( Gamma.concat( [ A.claim() ] ), B,
                                 matchingProblems )

    // Handle rule CR:
    // If the conclusion is of the form { A B }, then we must be able to
    // establish both Gamma |- A and Gamma |- B.  This requires exploring
    // whether our current matching problems can be extended to support both of
    // those derivations, one after the other.
    if ( A.isAClaim && B.isAClaim )
      yield* iterateHowToDerive( Gamma, A,
        generatorToArray( iterateHowToDerive( Gamma, B, matchingProblems ) ) )
  }

  // Handle rules DI and LI:
  // If the conclusion is of the form Declare{ y1 ... yn B }, then any premise
  // of the form Declare{ x1 ... xn A } will justify it iff we can match each
  // xi to yi and Gamma, A |- B, once we've removed Declare{ x1 ... xn A } from
  // Gamma.
  // That's rule DI.  The same holds for Let{ ... } and is called rule LI.
  if ( conclusion.declaration && conclusion.declaration != 'none' ) {
    for ( let i = 0 ; i < Gamma.length ; i++ ) {
      let premise = Gamma[i]
      // A perfect match between premise and conclusion will always work:
      if ( premise.hasSameMeaningAs( conclusion ) ) {
        yield* matchingProblems
        continue
      }
      // If that's not the case, and the right hand side has metavariables in it,
      // we can go no further, because that would be properly unification, not
      // just matching, so we don't have software to support it.
      if ( conclusion.hasDescendantSatisfying( x => x.isAMetavariable ) )
        continue
      if ( premise.declaration == conclusion.declaration
        && premise.children().length == conclusion.children().length ) {
        let n = premise.children().length - 1
        let xs = premise.children().slice( 0, n )
        let A = premise.children()[n]
        let ys = conclusion.children().slice( 0, n )
        let B = conclusion.children()[n]
        let newGamma = Gamma.slice()
        newGamma.splice( i, 1 )
        newGamma.push( A )
        // We consider each currently existing possibility for how to
        // instantiate metavariables that's consistent with the needs of this
        // derivation so far:
        for ( let possibility of matchingProblems ) {
          // Augment that possibility with the pairs (xi,yi) for each i.
          // Generate all solutions to Gamma, A |- B under that constraint.
          let augmented = possibility.copy()
          for ( let j = 0 ; j < xs.length ; j++ )
            augmented.addConstraint( xs[j], ys[j] )
          yield* iterateHowToDerive( newGamma, B, [ augmented ] )
        }
      }
    }
  }

  // Last we consider the two rules in which a premise is a pair:
  for ( let i = 0 ; i < Gamma.length ; i++ ) {
    let premise = Gamma[i]
    if ( premise instanceof Environment
      && ( !premise.declaration || premise.declaration == 'none' )
      && premise.children().length == 2 )
    {
      let A = premise.children()[0]
      let B = premise.children()[1]
      let newGamma = Gamma.slice()
      newGamma.splice( i, 1 )

      // Handle rule GL:
      // If the premise is { :A B } then we recur on both Gamma |- A and
      // Gamma, B |- conclusion.
      if ( A.isAGiven && B.isAClaim )
        yield* iterateHowToDerive( newGamma, A.claim(),
          generatorToArray( iterateHowToDerive(
            newGamma.concat( [ B ] ), conclusion, matchingProblems ) ) )

      // Handle rule CL:
      // If the premise is { A B } then we recur on Gamma, A, B |- conclusion.
      if ( A.isAClaim && B.isAClaim )
        yield* iterateHowToDerive(
          newGamma.concat( [ A, B ] ), conclusion, matchingProblems )
    }
  }

  // There are no other rules to consider.

}

function derivesWithMatching ( premises, conclusion )
{
  return !iterateHowToDerive( premises, conclusion ).next().done
}

module.exports.derives = derives
module.exports.iterateHowToDerive = iterateHowToDerive
module.exports.generatorToArray = generatorToArray
module.exports.derivesWithMatching = derivesWithMatching
