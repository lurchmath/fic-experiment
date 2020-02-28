
// Create a wrapper around the second-order matching package,
// which is written in OM, and we're going to make it accessible to LCs

// Import all the stuff you could possibly need, w/brief notes on what it does.
const {
  setMetavariable, // procedure, apply to OM var
  isMetavariable, // function, queries attr set by previous
  makeGeneralExpressionFunction, // takes v1,...,vn,body, gives expr fn result
    // encodes as SecondOrderMatching.gEF[v1,...,vn,body]
  makeGeneralExpressionFunctionApplication, // takes one of two forms:
    // metavar, arg --> F(arg)
    // general expression function, arg --> (lambda ...)(arg), ready to b-reduce
    // in both forms, you can replace arg with [arg1,arg2,...]
    // encodes as SecondOrderMatching.gEFA(func,arg)
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
} = require( '../dependencies/matching.js' )
const { OM } = require( '../dependencies/openmath.js' )
const { LC } = require( './lc.js' )

// A MatchingSolution is a mapping from metavariables to expressions,
// representing the solution to a MatchingProblem (which is defined below).
class MatchingSolution {
  // You build one by providing the mapping, as a JS object, or by providing a
  // solution of the type returned by MatchingChallenge, and this constructor
  // will convert it to LC format.
  constructor ( mapping = { } ) {
    this._mapping = { }
    if ( mapping.hasOwnProperty( 'contents' ) ) {
      // converting a MatchingChallenge solution into LC form
      mapping.contents.map( constraint => this.add(
        LC.fromOM( constraint.pattern ), LC.fromOM( constraint.expression ) ) )
    } else {
      // copying values from a regular JS object into our internal storage
      for ( let key in mapping )
        if ( mapping.hasOwnProperty( key ) )
          this._mapping[key] = mapping[key]
    }
  }
  // You can extend the solution with arbitrary metavariable/expression pairs
  // after constructing it.  The metavariable can be a string or a Statement LC
  // that is a metavariable.
  add ( metavariable, expression ) {
    const metavariableName =
      ( metavariable instanceof String || typeof metavariable == 'string' ) ?
      metavariable : metavariable.identifier
    if ( !metavariableName )
      throw Error( 'Invalid metavariable given to MatchingSolution.add()' )
    if ( !( expression instanceof LC ) )
      throw Error( 'Invalid expression given to MatchingSolution.add()' )
    this._mapping[metavariableName] = expression
  }
  // Does the solution contain the given metavariable?
  has ( metavariableName ) {
    return this._mapping.hasOwnProperty( metavariableName )
  }
  // What metavariables does it contain?
  keys () { return Object.keys( this._mapping ) }
  // Look up the given metavariable in this mapping
  lookup ( metavariableName ) {
    return this.has( metavariableName ) ? this._mapping[metavariableName]
                                        : undefined
  }
  // Equality relation for solutions
  equals ( other ) {
    return other.keys().every( key => this.has( key ) )
        && this.keys().every( key => other.has( key )
          && other.lookup( key ).equals( this.lookup( key ) ) )
  }
  // Apply this solution as a metavariable intantiation to the given LC
  // (It assumes all instantiations are free to be done and does not do any
  // variable capture checks in this function.)
  // The instantiation is done in-place, modifying the given argument.
  applyInPlace ( target ) {
    if ( target.children().length > 0 ) {
      target.children().map( child => this.applyInPlace( child ) )
    } else if ( target.isAnIdentifier && target.isAMetavariable
                                      && this.has( target.identifier ) ) {
      const replacement = this.lookup( target.identifier ).copy()
      replacement.isAGiven = target.isAGiven
      target.replaceWith( replacement )
    }
  }
  // Apply this solution as a metavariable instantiation to the given LC,
  // returning a modified copy, rather than modifying the LC in place
  // (Like applyInPlace(), does no variable capture checks.)
  apply ( target ) {
    const result = target.copy()
    this.applyInPlace( result )
    return result
  }
  // It is also possible to convert an old solution to a new problem, so that we
  // might extend it with new constraints and see if it is still solvable.
  asProblem () { return new MatchingProblem( this ) }
  // For debugging purposes
  toString () {
    return '{ ' + this.keys().map( metavariableName =>
      `(${metavariableName},${this.lookup(metavariableName)})` ) + ' }'
  }
}

// A matching problem is an object that a client constructs to pose a matching
// problem, and subsequently calls routines in that object to solve the problem.
// It is the equivalent of the second-order matching package's MatchingChallenge
// class.
class MatchingProblem {
  // When you build one, you can optionally provide constraints.  Do so like so:
  // new MatchingProblem( [ pat1, expr1 ], [ pat2, expr2 ], ... )
  // Or don't provide any, but call .addConstraint() after the fact; see below.
  // Alternately, you can provide a single MatchingSolution as the first and
  // only parameter, and all of its pairs will be lifted out and used to create
  // a new matching problem (which can, of course, be extended as well).
  constructor ( ...constraints ) {
    this._MC = new MatchingChallenge()
    if ( constraints.length == 1
      && constraints[0] instanceof MatchingSolution ) {
      // the case where one MatchingSolution was given
      constraints[0].keys().map( key => {
        const metavariable = LC.fromString( key )
        metavariable.isAMetavariable = true
        this.addConstraint( metavariable, constraints[0].lookup( key ) )
      } )
    } else {
      // the case where 0 or more pattern-expresson pairs were given
      constraints.map( constraint => this.addConstraint( ...constraint ) )
    }
  }
  // A constraint is a pattern-expression pair, each of which is an LC
  // (This is half of the job of this class, to convert to OM right here.)
  addConstraint ( pattern, expression ) {
    let patternAsOM = pattern.toOM()
    const subSymbol = OM.var( 'SUB' )
    patternAsOM.descendantsSatisfying( d =>
      d.children.length == 3 && d.children[0].equals( subSymbol )
    ).map( sub =>
      sub.replaceWith( makeGeneralExpressionFunctionApplication(
        sub.children[1], sub.children.slice( 2 ) ) ) )
    this._MC.addConstraint( patternAsOM, expression.toOM() )
  }
  // You can make a copy of a matching problem
  copy () {
    let result = new MatchingProblem()
    result._MC = this._MC.clone()
    return result
  }
  // You can query things about its solvability...that's the whole point.
  // (This is the other half of the job of this class, to convert from OM in
  // the getSolutions() function, below.)
  // The following function should complete as quickly as possible, because it
  // requires finding only one solution (if one exists), not all solutions.
  isSolvable () { return this._MC.isSolvable() }
  // The following function should be similarly speedy, for the same reason.
  // It returns either an instance of MatchingSolution (if the problem has at
  // least one solution) or null (if it does not).
  getOneSolution () {
    const solution = this._MC.getOneSolution()
    return solution ? new MatchingSolution( solution ) : null
  }
  // If you'd like to be able to iterate through the solutions one at a time,
  // call the following function.  This does not add anything to any cache, so
  // walking through this iterator doesn't actually speed up any future calls.
  *enumerateSolutions () {
    for ( let solution of this._MC.solutionsIterator() )
      yield new MatchingSolution( solution )
  }
  // The following function may not complete quickly, because it requires
  // finding all solutions that exist, which may require a lengthy search.
  // However, once this function has been called, the inner _MC object caches
  // the solution set, so future calls will be fast.
  numSolutions () { return this._MC.numSolutions() }
  // Same warning as the previous function, including caching.
  getSolutions () {
    return this._MC.getSolutions().map(
      solution => new MatchingSolution( solution ) )
  }
  // For debugging purposes
  toString () {
    return '{ ' +
      this._MC.challengeList.contents.map( pair =>
        `(${pair.pattern.simpleEncode()},${pair.expression.simpleEncode()})` )
      .join( ',' ) + ' }'
  }
}

module.exports.MatchingSolution = MatchingSolution
module.exports.MatchingProblem = MatchingProblem
