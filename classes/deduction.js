
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

// A Turnstile is a list of premise LCs and a conclusion LC, so that one might
// write them as P1,...,Pn |- C (using the turnstile symbol).  Although one
// often reads that statement as "P1 through Pn derive C" we cannot call this
// class a derivation, because that would imply that P1,...,Pn |- C is true and
// the entire proof were contained in this object.  Rather, this object permits
// us to pose P1,...,Pn |- C as a question and ask whether it holds, and if it
// holds, then in what ways.
class Turnstile {
  // Construct one by providing a premise list and a conclusion
  constructor ( premises, conclusion ) {
    this.premises = premises
    this.conclusion = conclusion
  }
  // make a shallow copy
  shallowCopy () { return new Turnstile( this.premises, this.conclusion ) }
  // you can apply a metavariable instantiation to this turnstile, and it
  // distributes it over all premises and the conclusion
  instantiateWith ( solution ) {
    this.premises = solution.apply( this.premises )
    this.conclusion = solution.apply( this.conclusion )
  }
  // for debugging
  toString () {
    return `${this.premises.map(p=>`${p}`).join(', ')} |- ${this.conclusion}`
  }
  // for use in Jupyter notebooks
  _toHtml () {
    const withoutPreTags = ( html ) => html.substring( 5, html.length - 6 )
    const prems = this.premises.map(p=>withoutPreTags(p._toHtml())).join(', ')
    const concl = withoutPreTags( this.conclusion._toHtml() )
    return `<tt>${prems}</tt> $~\\vdash~$ <tt>${concl}</tt>`
  }
  // for converting Jupyter notebooks to LaTeX/PDF
  _toMime () {
    const removeMathMode = ( text ) => text.substring( 1, text.length - 1 )
    const prems = this.premises.map( p =>
      removeMathMode( p._toMime()["text/latex"] ) ).join( ', ' )
    const concl = removeMathMode( this.conclusion._toMime()["text/latex"] )
    return { "text/latex": `$${prems} \\vdash ${concl}$` }
  }
  // Compare two LCs in a way that is useful for the derivation checker, defined
  // later in this class.
  // Specifically, it returns an object with the following attributes:
  //  - First, one attribute that is always present:
  //     - same: always a boolean, whether the two LCs had the same meaning and
  //       should thus be considered equal for deduction
  //  - Second, two attributes that are present only if !same and precisely one
  //    of the two inputs contains metavariables:
  //     - pattern: the one input that contains metavariables
  //     - expression: the one input that does not
  // Thus we will get one of three types of results:
  // { same: true } means the LCs have the same meaning
  // { same: false } means the LCs have different meanings, but either both or
  //   neither had metavariables, so we cannot use matching to make progress on
  //   trying to reconcile their differing meanings
  // { same: false, pattern: P, expression: E } means the CLs have different
  //   meanings, and we can use matching with the given (P,E) pair to try to
  //   make progress on reconciling those different meanings
  // One exception:  The { same: false } case may also be returned in cases when
  // precisely one LC had metavariables, but it was obvious from a cursory
  // inspection that they could never match, so we state that now to save
  // unnecessary matchmaking attempts.
  static compareLCs ( lc1, lc2 ) {
    // if they have the same meaning, including metavariables, this is easy
    if ( lc1.hasSameMeaningAs( lc2 ) ) return { same : true }
    // if they have different meanings, but the same metavariable status,
    // they're clearly different, so this is also easy
    const mv1 = lc1.containsAMetavariable()
    const mv2 = lc2.containsAMetavariable()
    if ( mv1 == mv2 ) return { same : false }
    // the next two clauses handle the "one exception" case mentioned above
    const differentExpressions = ( x, y ) => !x.containsAMetavariable()
                                          && !y.containsAMetavariable()
                                          && !x.hasSameMeaningAs( y )
    const nc1 = lc1.children().length
    const nc2 = lc2.children().length
    if ( nc1 == nc2 ) {
      if ( lc1.children().some( ( child, index ) =>
          differentExpressions( child, lc2.child( index ) ) ) ) {
        // same # children, but one pair that would need to match are two
        // different expressions, neither containing metavariables
        return { same : false }
      }
      if ( !lc1.isAMetavariable && !lc2.isAMetavariable
        && lc1.identifier != lc2.identifier ) {
        // equivalent to asking if the heads of each LC are diff. expressions
        return { same : false }
      }
    } else {
      if ( nc1 == 0 && mv2 || nc2 == 0 && mv1 || nc1 > 0 && nc2 > 0 ) {
        // either we have a non-metavariable atomic trying to match a
        // compound statement or we are trying to match two compound statements
        // of different # children; metavariables can't solve these problems
        return { same : false }
      }
    }
    // last, if precisely one contains metavariables, correctly sort which is
    // the pattern vs. which is the expression
    return mv1 ? { same : false, pattern : lc1, expression : lc2 }
               : { same : false, pattern : lc2, expression : lc1 }
  }
  // We can measure the complexity of a premise by the number of givens you would
  // need to first prove to unlock the conclusion buried inside.  For instance, if
  // we have a premise { :A :B C } then it has complexity 2, because there are 2
  // givens (A and B) one must prove before one can use the conclusion C.  A
  // statement has complexity 0 and a declaration has the complexity of it body.
  static complexity ( x ) {
    return x instanceof Statement ? 0 :
           x.isAnActualDeclaration() ? Turnstile.complexity( x.last ) :
           x.children().length - 1
  }
  // It's efficient to treat premises in these ways:
  // First, keep them sorted by complexity, so the easiest ones are tried first.
  // Second, don't include any duplicate statements, since statement premises are
  // not consumed when used, so one copy is as good as a thousand.
  // Third, apply the previous idea to situations like X vs. { :A :B X }, where
  // we will keep only the X rather than the strictly weaker form.
  makePremisesEfficient () {
    this.premises.sort( ( a, b ) =>
      Turnstile.complexity( a ) - Turnstile.complexity( b ) )
    const result = [ ]
    for ( const premise of this.premises ) {
      if ( ( premise instanceof Statement || premise.isAnActualDeclaration() )
        && result.some( entry => entry.hasSameMeaningAs( premise ) ) ) continue
      if ( premise instanceof Environment
        && result.some( entry => entry.hasSameMeaningAs( premise.last ) ) )
        continue
      result.push( premise )
    }
    this.premises = result
  }
  // I will wite S(L) to refer to the simplification of an LC L to a list of
  // zero or more LCs that are interpreted as a conjunction.  We define that
  // simplification routine as follows, using an auxiliary routine P defined
  // thereafter.
  // S(A) = [ A ] if A is a statement
  // S(:A) = [ ] if A is a statement
  // S({}) = [ ]
  // S({ A ...others }) = [ ...S(A), ...S({...others}) ]
  // S({ :A ...others }) = [ ...S({...others}).map(x=>G(S(A),x)) ]
  // G([...As],{...Bs}) = { ...:As ...Bs } (that is, each A is a given)
  // G([...As],B) = G([...As],{ B }) for an isolated statement B
  // We now implement these as two internal functions inside simplifyPremises(),
  // and that routine just applies them to all the premises, then sorts and
  // removes duplicates through makePremisesEfficient().
  simplifyPremises () {
    // neither S nor G ever make copies; they just manipulate the originals,
    // because we make copies before we call either S or G, so that the copying
    // happens precisely once.
    const G = ( givens, conclusion ) =>
      conclusion instanceof Statement || conclusion.isAnActualDeclaration() ?
      G( givens, new Environment( conclusion ) ) :
      new Environment( ...givens.map( g => g.given() ),
                       ...conclusion.children() )
    const S = L =>
      L instanceof Statement || L.isAnActualDeclaration() ?
        ( L.isAGiven ? [ ] : [ L ] ) :
      L.children().length == 0 ? [ ] :
      L.first.isAClaim ?
        [ ...S( L.first ),
          ...S( new Environment( ...L.children().slice( 1 ) ) ) ] :
        [ ...S( new Environment( ...L.children().slice( 1 ) ) ).map(
            x => G( S( L.first.claimCopy() ), x ) ) ]
    this.premises = this.premises.map( p => S( p.copy() ) )
                                 .reduce( ( a, b ) => a.concat( b ), [ ] )
    this.makePremisesEfficient()
  }
  // This function is not intended for client use; call derivationMatches()
  // instead, and it will call this one after preparing the parameters
  // appropriately.
  // This function creates an iterator that yields all matches (that is,
  // metavariable instantiations) that cause the premises to derive the
  // conclusion using only the rules in FIC.  The first parameter must be a
  // MatchingSolution instance, and this routine will consider only solutions
  // that extend that one.
  // The premises in this object must each be of the form { :G1 ... :Gn C },
  // for n>=0.  Premises not of this form can be converted to this form by first
  // calling this.simplifyPremises().  This is not needed if you use the client-
  // facing routine derivationMatches() instead, which does this for you, and is
  // why it is the appropriate API.
  // This function yields an iterator which creates MatchingSolution instances,
  // optionally with proofs contained in them, if options.withProofs is truthy.
  *findDerivationMatches ( toExtend, options = { } ) {
    // first a utility function for returning solutions with embedded proofs
    const ruleWorked = ( ruleName, solution, subproofs = [ ] ) => {
      const copy = solution.copy()
      if ( options.withProofs ) {
        copy.proof = new Proof( this.shallowCopy(), ruleName, subproofs )
      }
      return copy
    }
    // now the actual routine begins
    debugin()
    debug( `${this}     extending ${toExtend}` )
    // Most of our code works on conclusions that are Statements, so let's begin
    // by taking conclusions that are Environments and recursively breaking them
    // down, so that in the rest of this routine we can assume the conclusion is
    // a statement.
    if ( this.conclusion instanceof Environment       // say { C1 ... Cn }
      && !this.conclusion.isAnActualDeclaration() ) { // declarations come later
      let Cs = this.conclusion.children().slice()
      debug( `conclusion is an Environment of length ${Cs.length}` )
      // If the environment is length 0, that's equivalent to the constant True.
      if ( Cs.length == 0 ) {
        // apply rule T:
        debug( 'rule T' )
        yield ruleWorked( 'T', toExtend )
      // This case is not strictly necessary, but improves efficiency:
      } else if ( Cs.length == 1 ) {
        debug( 'just address the single statement in the conclusion' )
        const T = new Turnstile( this.premises, Cs[0] )
        yield* T.findDerivationMatches( toExtend, options )
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
          const T = new Turnstile( [ C1.claimCopy() ], Cs )
          T.simplifyPremises()
          T.premises = T.premises.concat( this.premises )
          T.makePremisesEfficient()
          debug( 'rule GR, new premises:',
                 T.premises.map( p => `${p}` ).join( ', ' ) )
          for ( const solution of T.findDerivationMatches( toExtend, options ) ) {
            yield ruleWorked( 'GR', solution, [ solution.proof ] )
          }
        } else { // C1 is a claim
          // In order to justify the full set of Cs, we must first prove C1, then
          // see if any matching solution that let us do so is extendable to prove
          // the remaining Cs in the list.
          debug( `can we prove ${C1}?  rule-CR recur...` )
          const T = new Turnstile( this.premises, C1 )
          for ( const result1 of T.findDerivationMatches( toExtend, options ) ) {
            // result1 thus contains a solution that can be used to prove C1.  But
            // can it be used to prove the remaining conclusions C2,...,Cn?  Our
            // new goal is to prove those, with the solution we've found so far
            // applied to them, to instantiate any now-determined metavariables:
            Cs = result1.apply( Cs )
            const subproof = result1.proof // store here, before result1 changes
            // Recur to try to prove the remaining environment { C2 ... Cn }
            // (which, again, may contain a combination of givens and claims).
            debug( `applied ${result1} to conclusions: ${Cs}; continuing rule CR` )
            const T2 = new Turnstile( [ result1.apply( C1 ) ], Cs )
            T2.simplifyPremises()
            T2.premises = T2.premises.concat( result1.apply( this.premises ) )
            T2.makePremisesEfficient()
            for ( let solution of T2.findDerivationMatches( result1, options ) ) {
              yield ruleWorked( 'CR', solution, [ subproof, solution.proof ] )
            }
          }
        }
      }
    // Now we know the conclusion is either a Statement or a Declaration
    } else if ( this.conclusion instanceof Statement ) {
      debug( 'conclusion is a statement' )
      // Let's try to work backwards from the conclusion, seeing if any one of the
      // premises can make progress on it.  (Later we will try to work forwards
      // from the premises if working backwards fails, and if the options
      // parameter says we should also try to work forwards.)
      for ( let i = 0 ; i < this.premises.length ; i++ ) {
        let premise = this.premises[i]
        // If the premise is another statement, we can make progress only 2 ways:
        // Either rule S applies, or we can simplify through matching.
        if ( premise instanceof Statement ) {
          debug( `premise is a statement: ${premise}` )
          const comparison = Turnstile.compareLCs( premise, this.conclusion )
          // If there's a direct match, then apply rule S:
          if ( comparison.same ) {
            debug( 'straight premise-conclusion equality, so apply rule S' )
            yield ruleWorked( 'S', toExtend )
          // Otherwise, try to simplify the question through matching
          // (unless Turnstile.compareLCs() already said this was impossible):
          } else if ( comparison.pattern ) {
            const problem = toExtend.asProblem().plusConstraint(
              comparison.pattern, comparison.expression )
            debug( 'add S-match requirement: '
                 + `(${comparison.pattern}, ${comparison.expression})` )
            // For each way that it matches, that's a new solution via rule S:
            for ( const solution of problem.enumerateSolutions() ) {
              debug( `match ${solution} lets us apply rule S` )
              yield ruleWorked( 'S', solution )
            }
          }
        // If the premise is an environment, then canonicalPremises() guarantees
        // it must be of the form { :A1 ... :An B }, so we break it out as such:
        } else if ( premise instanceof Environment
                 && !premise.isAnActualDeclaration() ) {
          debug( `premise is an environment: ${premise}` )
          const As = premise.children().map( A => A.claimCopy() )
          const B = As.pop()
          // The GL rule splits this into 2 subgoals:
          // 1. Can our other premises plus B prove the conclusion?
          // 2. Can our other premises prove { A1 ... An }?
          // These must both happen with the same metavariable instantiation, so
          // we must explore them using nested recursion.
          // This outer loop finds all the ways to solve subgoal 1:
          const T = new Turnstile( [ ...this.premises.without( i ), B ],
                                   this.conclusion )
          T.makePremisesEfficient()
          for ( const result1 of T.findDerivationMatches( toExtend, options ) ) {
            debug( `rule GL proved ${this.conclusion} with ${result1}` )
            // result1 thus contains a solution that can be used to prove B.  But
            // can it be used to prove the required assumptions A1,...,An?  Our
            // new goal is to prove those, with the solution we've found so far
            // applied to them, to instantiate any now-determined metavariables:
            let AEnv = result1.apply( new Environment( ...As ) )
            const subproof = result1.proof // store here, before result1 changes
            debug( `applying rule GL means next attacking the givens ${AEnv}` )
            // Recur to try to prove the remaining environment { A1 ... An }
            // (which, again, may contain a combination of givens and claims).
            // This inner loop finds all the ways to solve subgoal 2, while
            // remaining consistent with the current solution of subgoal 1:
            const T2 = new Turnstile(
              result1.apply( this.premises.without( i ) ), AEnv )
            for ( let solution of T2.findDerivationMatches( result1, options ) ) {
              yield ruleWorked( 'GL', solution, [ subproof, solution.proof ] )
            }
          }
        } else { // the premise is a declaration
          // The only way a declaration can prove the conclusion is if its body
          // can prove the conclusion.  So we replace the declaration with its
          // body, converted to canonical premise form, and recur.  This requires
          // re-sorting the premises by complexity.
          debug( `Trying the DE/LE rule on premise ${premise}` )
          const T = new Turnstile( [ premise.last ], this.conclusion )
          T.simplifyPremises()
          T.premises = [ ...this.premises.without( i ), ...T.premises ]
          T.makePremisesEfficient()
          for ( let solution of T.findDerivationMatches( toExtend, options ) ) {
            yield ruleWorked( 'DE/LE', solution, [ solution.proof ] )
          }
        }
      }
    // Finally, consider the case where the conclusion is a Declaration:
    } else if ( this.conclusion.isAnActualDeclaration() ) {
      debug( `conclusion is a ${this.conclusion.declaration} declaration` )
      // We have only one rule that can prove a declaration:  The LI/DI rule,
      // which says we must have a premise of the same form, and its body must
      // prove the conclusion's body.  We thus pre-compute key features of the
      // conclusion's form, as a declaration, for use in comparison, below:
      const cmv = this.conclusion.containsAMetavariable()
      const cBody = this.conclusion.last.copy()
      const cVars = new Environment(
        ...this.conclusion.allButLast.map( child => child.copy() ) )
      debug( `cVars ${cVars} cBody ${cBody} cmv ${cmv}` )
      // Then we loop through all premises, seeking one of the same form:
      for ( let i = 0 ; i < this.premises.length ; i++ ) {
        let premise = this.premises[i]
        // If one is a declaration, then process it as follows:
        if ( premise.isAnActualDeclaration() ) {
          // It must be the same type and declare the same number of variables:
          if ( premise.declaration != this.conclusion.declaration
            || premise.children().length != this.conclusion.children().length )
            continue
          debug( `found premise ${premise} of the same form` )
          const pmv = premise.containsAMetavariable()
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
            const T = new Turnstile( [ pBody ], cBody )
            T.simplifyPremises()
            for ( let solution of T.findDerivationMatches( toExtend, options ) ) {
              yield ruleWorked( 'LI/DI', solution, [ solution.proof ] )
            }
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
              const T = new Turnstile( [ matchSol.apply( pBody ) ],
                                       matchSol.apply( cBody ) )
              T.simplifyPremises()
              for ( let solution of T.findDerivationMatches( matchSol, options ) ) {
                yield ruleWorked( 'LI/DI', solution, [ solution.proof ] )
              }
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
          if ( body.declaration != this.conclusion.declaration
            || body.children().length != this.conclusion.children().length )
            continue
          debug( `found premise ${premise} w/body of the same form` )
          const pmv = body.containsAMetavariable()
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
            const T = new Turnstile( [ pBody ], cBody )
            T.simplifyPremises()
            for ( const result1 of T.findDerivationMatches( toExtend, options ) ) {
              debug( `rule GL proved ${this.conclusion} with ${result1}` )
              // result1 thus contains a solution that can be used to prove B.  But
              // can it be used to prove the required assumptions A1,...,An?  Our
              // new goal is to prove those, with the solution we've found so far
              // applied to them, to instantiate any now-determined metavariables:
              let AEnv = result1.apply( new Environment(
                ...premise.allButLast.map( A => A.claimCopy() ) ) )
              const subproof = result1.proof // store here, before result1 changes
              debug( `applying rule GL means next attacking the givens ${AEnv}` )
              // Recur to try to prove the remaining environment { A1 ... An }
              // (which, again, may contain a combination of givens and claims).
              // This inner loop finds all the ways to solve subgoal 2, while
              // remaining consistent with the current solution of subgoal 1:
              const T2 = new Turnstile(
                result1.apply( this.premises.without( i ) ), AEnv )
              for ( let solution of T2.findDerivationMatches( result1, options ) ) {
                yield ruleWorked( 'GL', solution, [ subproof, solution.proof ] )
              }
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
              const T = new Turnstile( [ matchSol.apply( pBody ) ],
                                       matchSol.apply( cBody ) )
              T.simplifyPremises()
              for ( const result1 of T.findDerivationMatches( matchSol, options ) ) {
                debug( `rule GL proved ${conclusion} with ${result1}` )
                // very similar to above; not repeating comments again
                let AEnv = result1.apply( new Environment(
                  ...premise.allButLast.map( A => A.claimCopy() ) ) )
                const subproof = result1.proof // store here, before result1 changes
                debug( `applying rule GL means next attacking the givens ${AEnv}` )
                // very similar to above; not repeating comments again
                const T2 = new Turnstile(
                  result1.apply( this.premises.without( i ) ), AEnv )
                T2.simplifyPremises()
                for ( let solution of T2.findDerivationMatches( result1, options ) ) {
                  yield ruleWorked( 'GL', solution, [ subproof, solution.proof ] )
                }
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
    //     if ( !F.containsAMetavariable() || !( F instanceof Environment ) )
    //       continue
    //     let G = F.first
    //     if ( !G.isAGiven ) continue
    //     debug( `can we satisfy premise ${G} in ${F}?` )
    //     for ( let P of premises.filter( p => !p.isAFormula ) ) {
    //       const problem = toExtend.asProblem().plusConstraint( G.claimCopy(), P )
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
  *derivationMatches ( options = { } ) {
    // convert the premises to canonical form, provide a default empty matching
    // solution, and return the result of the findDerivationMatches() iterator,
    // but filtered for uniqueness
    debug( '\nSTART:\n------' )
    debugrestart()
    const solutionsFound = [ ]
    this.simplifyPremises()
    for ( const result of
          this.findDerivationMatches( new MatchingSolution(), options ) ) {
      if ( !solutionsFound.some( s => s.equals( result ) ) ) {
        if ( options.withProofs ) {
          result.proof.instantiateWith( result )
          if ( verbose ) console.log( result.proof.toString() )
        } else if ( verbose ) console.log( result.toString() )
        solutionsFound.push( result )
        yield result
      }
    }
    debugrestart()
    debug( '------\n END' )
  }

  // Convenience wrapper for computing all values of the iterator
  // and dropping the premises/conclusions attributes in each
  allDerivationMatches ( options = { } ) {
    const result = [ ]
    for ( const solution of this.derivationMatches( options ) )
      result.push( solution )
    return result
  }

  // Convenience wrapper for getting the first way in which a derivation holds,
  // if any, without computing any beyond the first
  firstDerivation ( options = { } ) {
    return this.derivationMatches( options ).next().value
  }

  // Convenience wrapper for checking whether a turnstile holds/not, without
  // getting any matches, and by being more efficient.
  existsDerivation ( options = { } ) {
    // console.log( `Does ${premises.map(p=>`${p}`).join(', ')} |- ${conclusion} ?` )
    // console.log( 'Efficient:',
    //              canonicalPremises( premises ).map( x=>`${x}` ).join( ', ' ) )
    const result = this.firstDerivation( options ) !== undefined
    // console.log( `\t${result ? 'YES' : 'NO'}` )
    return result
  }
}

// A proof contains a rule name R, a list of zero or more premises P, a
// conclusion C, and a list of zero or more subproofs S.  These are guaranteed
// to relate in the following ways, respecting the meaning of the rule names.
//  - If R = "S" then P = [ C ] and S = [ ].
//  - If R = "T" then C = { }.
//  - If R = "GL" then there is a p in P of the form { :A1 ... :An B } and S
//    contains two subproofs, call them S1 and S2, and we will use dot notation
//    to speak of their components, which satisfy:
//    S1.P = P - p and S1.C = { A1 ... An }
//    S2.P = P - p + B and S2.C = { A1 ... An }
//  - If R = "GR" then C is of the form { :A1 ...others } and S contains one
//    subproof whose premises are P + A1 and whose conclusion is { ...others }.
//  - There will not be a case in which R = "CL" because we will use a
//    canonicalPremises() function to eliminate all such cases, but if there
//    were, then the meaning of the CL rule would dictate that there would be a
//    p in P of the form { A1 ... An } and S would consist of precisely one
//    subproof with the same conclusion but with premises P - p + A1 + ... + An.
//  - If R = "CR" then C is of the form { A1 ... An } and S contains two
//    subproofs, both of which have the same premises as this one, but one of
//    which has conclusion A1, and the other conclusion { A2 ... An }.  This is
//    true even if n=1, in which case { A2 ... An } = { }.
//  - If R = "DI/LI" then C is of the form Let{ v1 ... vn B } or the form
//    Declare{ v1 ... vn B } and and there is some premise p with the same
//    declaration type (Let/Declare), same variables list, and body B', and
//    there is a single subproof whose premise list is [ B' ] and whose
//    conclusion is B.
//  - If R = "DE/LE" then some p in P is of the form Let{ v1 ... vn B } or
//    Declare{ v1 ... vn B } and S contains a single subproof with the same
//    conclusion as this one, but whose premise list is equivalent to P - p + B
//    (but with B potentially simplified or reformulated for efficiency).
// These guarantees are not enforced by the Proof constructor; they are enforced
// by the routines below which use the Proof constructor.
class Proof {
  // Build one; feel free to write to these variables at any time
  constructor ( turnstile, rule, subproofs ) {
    this.turnstile = turnstile
    this.rule = rule
    this.subproofs = subproofs
  }
  // Apply a MatchingSolution to instantiate metavariables across all parts of
  // this proof
  instantiateWith ( solution ) {
    this.turnstile.instantiateWith( solution )
    this.subproofs.map( S => S.instantiateWith( solution ) )
  }
  // Get a string representation.  If compact is false, all steps are printed.
  // If compact is true, steps involving CR, GR, and T are omitted for
  // compactness.  The depth parameter should not be used by clients; it is for
  // use in recursion only.
  toString ( compact = false, depth = 0 ) {
    if ( compact ) {
      if ( this.rule == 'T' && depth > 0 ) return ''
      if ( this.rule == 'CR' || this.rule == 'GR' )
        return this.subproofs.map( S => S.toString( compact, depth ) ).join( '' )
    }
    let result = ''
    for ( let i = 0 ; i < depth ; i++ ) result += '. '
    result += `${this.turnstile} by ${this.rule}`
    if ( this.subproofs.length > 0 ) result += ' using these subproof(s):'
    result += '\n'
    this.subproofs.map( S => result += S.toString( compact, depth + 1 ) )
    return result
  }
  // For use in Jupyter notebooks
  _toHtml () {
    const lines = this.toString().split( '\n' ).map( line => {
      if ( line.substring( line.length - 25 ) == ' using these subproof(s):' )
        line = line.substring( 0, line.length - 25 )
      const rule = line.split( ' ' ).pop()
      line = line.substring( 0, line.length - rule.length - 4 )
      let result = ''
      while ( line.substring( 0, 2 ) == '. ' ) {
        line = line.substring( 2 )
        result += '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; '
      }
      result += '<tt>' + line.replace( /&/g, "&amp;" )
                             .replace( /</g, "&lt;" )
                             .replace( />/g, "&gt;" )
                             .replace( /"/g, "&quot;" )
                             .replace( /'/g, "&#039;" ) + '</tt>'
      result = result.replace( / [|]- /g, '</tt> $~\\vdash~$ <tt>' )
      return `<tr><td style="text-align: left;">${result}</td>`
           + `<td style="text-align: left;">${rule}</td></tr>`
    } )
    return `<table style="border: 1px solid black;">${lines.join( '' )}</table>`
  }
  // for converting Jupyter notebooks to LaTeX/PDF
  _toMime () {
    const prepareMath = ( text ) =>
      text.replace( / /g, '~' ).replace( /{/g, '\\{' ).replace( /}/g, '\\}' )
          .replace( /[:]/g, '{:}' ).replace( /[|]-/g, '\\vdash' )
    const lines = this.toString().split( '\n' ).map( line => {
      if ( line.substring( line.length - 25 ) == ' using these subproof(s):' )
        line = line.substring( 0, line.length - 25 )
      const rule = line.split( ' ' ).pop()
      line = line.substring( 0, line.length - rule.length - 4 )
      let indent = ''
      while ( line.substring( 0, 2 ) == '. ' ) {
        line = line.substring( 2 )
        indent += '\\hspace{1cm}'
      }
      return `${indent}${prepareMath( line )} & \\text{${rule}}`
    } )
    return {
      "text/latex": `$\\begin{array}{ll}${lines.join('\\\\\n')}\\end{array}$`
    }
  }
}


// Efficiency improvements for later, in decreasing priority order:
//  - Consider the redundancy inherent in exploring all possibilities from
//    Gamma, { :A B }, { :C D } |- P.  If we apply GL to the first environment
//    premise and then the second, we get four subcases we must prove, but the
//    first of them implies the third, so we should consider only three:
//    Gamma |- C;  Gamma, D |- A;  Gamma, B |- C;  Gamma, B, D |- P.
//    This efficiency improvement is significant, because a 2^n improvement
//    becomes an F_n improvement (still exponential but much smaller).  But we
//    already have the strategy of applying GL to Gamma, { :A B } |- C by first
//    asking whether Gamma, B |- C before checking whether Gamma |- A because,
//    in general, there is more than one premise A, and this is a time saver.
//    This means that we would evaluate the four cases above in reverse order,
//    and thus not be able to carry the informtion from the leftmost over to
//    help us skip the 3rd-from-the-left.  This efficiency regarding multiple
//    premises may be more important, and thus this idea may be irrelevant.
//  - Pre-compute which LCs contain metavariables and just look the result up
//    in Turnstile.compareLCs() rather than recomputing it.  This may be more
//    trouble than it's worth, because these computations are rather trivial.
//  - In findDerivationMatches(), where you are trying to prove many conclusions
//    C1,...,Cn, after having successfully proven C1, we already take advantage
//    of that to simplify further recursion by adding C1 to the list of premises
//    (LHS of turnstile) when we recur, but we could also remove C1 from any
//    other premise's list of givens-needing-proof (then adjust the order of
//    those premises to preserve increasing order of number of givens).  The
//    reason we do not yet do this is because it would make our proofs no longer
//    able to cite specific rules for their steps, because this would be a
//    shortcut not justifiable by only one rule application.

module.exports.Turnstile = Turnstile
module.exports.Proof = Proof
