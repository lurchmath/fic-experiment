const { Structure } = require( '../dependencies/structure.js' )
const { LC, Times, StartTimes, TimerStart, TimerStop } = require( './lc.js' )
const { Statement } = require( './statement.js' )

///////////////////////////////////////////////////////////////////////
//  Step Class
//
//  Given an LC, L, and a claim C in L, we want to collect both C and
//  the array of its accessibles into a single object called a "step".
//  This will be used by validation to validate an LC proof one step
//  at a time.  This class provides useful utilities for dealing with
//  steps.  We refer to L as the 'parent' in this case, though it can be
//  more generally the outermost ancestor of C.
//
//  Rather than extensive argument checking, these routines assume you
//  have already run markDeclarations() and markScopes() on the parent LC.
class Step {

  // conclusion - is an LC
  // premises - are an array of LCs
  constructor ( parent , conclusion ) {
     this.parent = parent
     this.conclusion = conclusion
     this.premises = conclusion.allAccessibles()
     this.dopplegangers = [this]
  }

  // Here is the whole purpose for creating this class.  We will validate an LC,
  // L, one conclusion at a time.  For each conclusion C we will construct the
  // Step whose conclusion is C and whose premises are the accessibles of C in L.
  // Thus we need to validate Steps.  To do so we need to convert a Step to
  // a Propositional Form defined as follows:
  //
  //   - each Statement is assigned a single propositional variable string
  //     (currently its toString() value, such that two statements with the
  //     same meaning should be represented by the same propositional
  //     variable string.
  //   - each Declaration is treated the same as a Statement, with a single
  //     propositional variable string such that two declarations that
  //     have the same meaning, and which only contain free symbols which are
  //     in the same scope are represented by the same propositional variable
  //     string.
  //   - Environments that are not Declarations are left as is and not assigned a
  //     propositional variable but rather used by FIC and SAT to evaluate the
  //     expression defined by the propositional variables (along with the
  //     'Given' attribute, e.g. as in the .cnf() routine.
  //
  // We must flag dopplegangers of the conclusion of the step ... statements
  // C' contained anywhere in or among the premises such that C has the same
  // absolute value as C'.
  markDopplegangers () {

  }

  // pretty print
  show () { return `${this.premises+''} -> ${this.conclusion+''}` }

}

///////////////////////////////////////////////////////////////////////

module.exports.Step = Step
