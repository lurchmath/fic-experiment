
const { LC } = require( './lc.js' )
const { Environment } = require( './environment.js' )

let verbose = false
let debug = ( msg ) => { if (verbose) console.log(msg) }

function derives ( ...LCs ) {
  // You are allowed to pass only LCs to this function:
  if ( LCs.some( arg => !( arg instanceof LC ) ) )
    throw( 'The derives function accepts only LC instances as arguments' )

  // Compute normal forms of all arguments, splitting into premises & conclusion
  // If any premises are Givens, convert them to Claims (since 'premise' means
  // 'given' in LC-land.)
  let conclusion = LCs.pop().normalForm()
  let premises = LCs.map( premise => premise.normalForm().claim() )
  debug( '** ' + premises.map( x => ''+x ).join( ', ' )
               + ' |- ' + conclusion + ' ?' )

  // You're not supposed to ask whether assumptions are provable:
  if ( conclusion.isAGiven )
    throw( 'The derives function requires the conclusion to be a claim' )

  // S rule: Gamma, A |- A
  if ( premises.some( premise => premise.hasSameMeaningAs( conclusion ) ) ) {
    debug( '** S rule -> derivation holds.')
    return true
  }

  // T rule: Gamma |- { }
  if ( conclusion instanceof Environment
    && conclusion.children().length == 0 ) {
    debug( '** T rule -> derivation holds.' )
    return true
  }

  // Now we consider the rules which require the conclusion to be a pair
  // but not a declaration, which we handle separately
  let ABPair = ( lc ) =>
    lc instanceof Environment && lc.isAClaim
                              && lc.children().length == 2 ?
      { A : lc.children()[0], B : lc.children()[1] }
    : null
  let cpair = ABPair( conclusion )
  if ( cpair ) {

    // DI rule: From Gamma, M |- L get
    // Gamma, Declare(x1 ... xn M) |- Declare(x1 ... xn L)
    if (cpair.B.declaration === 'constant') {

    }

    // GR rule: From Gamma, A |- B get Gamma |- { :A B }
    if ( cpair.A.isAGiven ) {
      debug( '** Try GR rule recursively:' )
      return derives( ...premises, cpair.A.claim(), cpair.B )
    }

    // CR rule: From Gamma |- A and Gamma |- B get Gamma |- { A B }
    // (at this point, we know A is a claim)
    debug( '** Try CR rule recursively:' )
    return derives( ...premises, cpair.A )
        && derives( ...premises, cpair.B )
  } else if (conclusion.declaration == 'none') {
    debug("Validating a declaration: "+conclusion.toString())
    return 'YES!'
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
        debug( '** Try GL rule recursively:' )
        return derives( ...gamma, ppair.A.claim() )
            && derives( ...gamma, ppair.B, conclusion )
      }

      // CL rule: From Gamma, A, B |- C get Gamma, { A B } |- C
      // (at this point, we know A is a claim)
      debug( '** Try CL rule recursively:' )
      return derives( ...gamma, ppair.A, ppair.B,
                      conclusion )
    }

  // So now we see if one of the premise pairs works...
  if (premises.some(premisePairWorks)) return true

  // If none of those rules help, it doesn't follow.
  debug( '** no rule -> derivation does not hold.' )
  return false
}

module.exports.derives = derives
