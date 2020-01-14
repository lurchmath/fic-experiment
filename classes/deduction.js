
const { LC } = require( './lc.js' )
const { Environment } = require( './environment.js' )

function derives ( ...LCs ) {
  let conclusion = LCs.pop().normalForm()
  let premises = LCs.map( premise => premise.normalForm() )
  // S rule: Gamma, A |- A
  if ( premises.some( premise => premise.equals( conclusion ) ) ) return true
  // T rule: Gamma |- { }
  if ( conclusion instanceof Environment
    && conclusion.children().length == 0 ) return true
  // Now we consider the rules which require the conclusion to be a pair
  let ABPair = ( lc ) => lc instanceof Environment && lc.isAClaim
    && lc.children().length == 2 ?
      { A : lc.children()[0], B : lc.children()[1] } : null
  let cpair = ABPair( conclusion )
  if ( cpair ) {
    // GR rule: From Gamma, A |- B get Gamma |- { :A B }
    if ( cpair.A.isAGiven )
      return derives( ...premises, cpair.A.normalForm(), cpair.B.normalForm() )
    // CR rule: From Gamma |- A and Gamma |- B get Gamma |- { A B }
    // (at this point, we know A is a claim)
    return derives( ...premises, cpair.A.normalForm() )
        && derives( ...premises, cpair.B.normalForm() )
  }
  // Now we consider the rules which require a premise that's a pair
  let ppairIndex = premises.findIndex( ABPair )
  if ( ppairIndex > -1 ) {
    let ppair = ABPair( premises[ppairIndex] )
    premises.splice( ppairIndex, 1 )
    // GL rule: From Gamma |- A and Gamma, B |- C get Gamma, { :A B } |- C
    if ( ppair.A.isAGiven )
      return derives( ...premises, ppair.A.normalForm() )
          && derives( ...premises, ppair.B.normalForm(), conclusion )
    // CL rule: From Gamma, A, B |- C get Gamma, { A B } |- C
    // (at this point, we know A is a claim)
    return derives( ...premises, ppair.A.normalForm(), ppair.B.normalForm(),
                    conclusion )
  }
  // If none of those rules help, it doesn't follow.
  return false
}

module.exports.derives = derives
