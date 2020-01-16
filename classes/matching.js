
// Create a wrapper around the second-order matching package,
// which is written in OM, and we're going to make it accessible to LCs

// Import all the stuff you could possibly need, w/brief notes on what it does.
const {
  setMetavariable, // procedure, apply to OM var
  isMetavariable, // function, queries attr set by previous
  makeGeneralExpressionFunction, // takes v1,...,vn,body, gives expr fn result
    // encodes as SecondOrderMatching.gEF[v1,...,vn,body]
  betaReduce, // takes lambda and inputs, does substitution in body
  Constraint, // class/constructor, takes pattern & expr, builds constraint pair
  ConstraintList, // class/constructor, takes list of >=0 pairs
  applyInstantiation, // takes constraint pair and OM obj, yields substituted OM
  instantiate, // takes fn-type CList and other CList; applies fn to 2nd arg
  makeConstantExpression, // takes var and expr and gives lambda var.expr
  makeProjectionExpression, // takes v1,...,vn and vi and gives lambda ....,vi
  makeImitationFunction, // complicated...see src docs and Huet-Lang paper
  MatchingChallenge, // class/constructor, takes list of >=0 Constraints
    // or you can do MC.addConstraint(p,e) later
    // and you can MC.clone() them
    // and ask MC.isSolvable() or MC.numSolutions() or MC.getSolutions()
} = require( '../dependencies/second-order-matching.js' )
const { LC } = require( '../classes/lc.js' )

// We need a way to get/set metavariable status on LCs

// A matcher is a tool that can solve matching problems.  It is the equivalent
// of the second-order matching package's MatchingChallenge class.
class Matcher {
  // When you build one, you can optionally provide constraints
  constructor ( ...constraints ) {
    this._MC = new MatchingChallenge()
    constraints.map( constraint => this.addConstraint( constraint ) )
  }
  // A constraint is a pattern-expression pair, each of which is an LC
  // (This is half of the job of this class, to convert to OM right here.)
  addConstraint ( pattern, expression ) {
    this._MC.addConstraint( pattern.toOM(), expression.toOM() )
  }
  // You can make a copy of a matcher
  copy () {
    let result = new Matcher()
    result._MC = this._MC.clone()
    return result
  }
  // You can query things about its solvability...that's the whole point.
  // (This is the other half of the job of this class, to convert from OM in
  // the getSolutions() function, below.)
  isSolvable () { return this._MC.isSolvable() }
  numSolutions () { return this._MC.numSolutions() }
  getSolutions () {
    return this._MC.getSolutions().map( solution =>
      solution.contents.map( constraint => ( {
        pattern : LC.fromOM( constraint.pattern ),
        expression : LC.fromOM( constraint.expression )
      } ) ) )
  }
}

module.exports.Matcher = Matcher
