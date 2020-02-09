
const { LC } = require( './lc.js' )
const { Environment } = require( './environment.js' )

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

  // So we first check the currrent premises to see if any is a Declaration of
  // the similar type and check if its value justifies the value of them
  // the conclusion.  This checks Rules (DI) and (LI), namely
  // from M|-L we can conclude Gamma,Declare{ ...c M } |- Declare{ ...c L }
  // and similarly for Let's.

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

module.exports.derives = derives
