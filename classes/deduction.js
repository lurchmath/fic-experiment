
const { LC } = require( './lc.js' )
const { Environment } = require( './environment.js' )

function derives ( ...LCs ) {
  // You are allowed to pass only LCs to this function:
  if ( LCs.some( arg => !( arg instanceof LC ) ) )
    throw( 'The derives function accepts only LC instances as arguments' )

  // Compute normal forms of all arguments, splitting into premises & conclusion
  // If any premises are Givens, convert them to Claims (since 'premise' means
  // 'given' in LC-land.)
  let conclusion = LCs.pop().normalForm()
  let premises = LCs.map( premise => premise.normalForm().claim() )
  // console.log( '** ' + premises.map( x => ''+x ).join( ', ' )
  //            + ' |- ' + conclusion + ' ?' )

  // You're not supposed to ask whether assumptions are provable:
  if ( conclusion.isAGiven )
    throw( 'The derives function requires the conclusion to be a claim' )

  // S rule: Gamma, A |- A
  if ( premises.some( premise => premise.hasSameMeaningAs( conclusion ) ) ) {
    // console.log( '** S rule -> derivation holds.')
    return true
  }

  // T rule: Gamma |- { }
  if ( conclusion instanceof Environment
    && conclusion.children().length == 0 ) {
    // console.log( '** T rule -> derivation holds.' )
    return true
  }

  // Now we consider the rules which require the conclusion to be a pair
  let ABPair = ( lc ) =>
    lc instanceof Environment && lc.isAClaim
                              && lc.children().length == 2 ?
      { A : lc.children()[0], B : lc.children()[1] }
    : null
  let cpair = ABPair( conclusion )
  if ( cpair ) {

    // GR rule: From Gamma, A |- B get Gamma |- { :A B }
    if ( cpair.A.isAGiven ) {
      // console.log( '** Try GR rule recursively:' )
      return derives( ...premises, cpair.A.claim(), cpair.B )
    }

    // CR rule: From Gamma |- A and Gamma |- B get Gamma |- { A B }
    // (at this point, we know A is a claim)
    // console.log( '** Try CR rule recursively:' )
    return derives( ...premises, cpair.A )
        && derives( ...premises, cpair.B )
  }

  // Now we consider the rules which require a premise that's a pair
  // There might be more than one, so we have to try them all until we find
  // a successful one.

  // Define a boolean function to test each pair premise.  Then we just
  // see if premises.some(premisePairWorks) returns true.
  let premisePairWorks = (prem, premindex) => {

      let ppair = ABPair(prem)
      if (!ppair) return false
      let gamma = premises.slice()
      gamma.splice( premindex, 1 )

      // GL rule: From Gamma |- A and Gamma, B |- C get Gamma, { :A B } |- C
      if ( ppair.A.isAGiven ) {
        // console.log( '** Try GL rule recursively:' )
        return derives( ...gamma, ppair.A.claim() )
            && derives( ...gamma, ppair.B, conclusion )
      }

      // CL rule: From Gamma, A, B |- C get Gamma, { A B } |- C
      // (at this point, we know A is a claim)
      // console.log( '** Try CL rule recursively:' )
      return derives( ...gamma, ppair.A, ppair.B,
                      conclusion )
    }

  // So now we see if one of the premise pairs works...
  if (premises.some(premisePairWorks)) return true

  // If none of those rules help, it doesn't follow.
  // console.log( '** no rule -> derivation does not hold.' )
  return false
}

module.exports.derives = derives
