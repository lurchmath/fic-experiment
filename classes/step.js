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
//  steps.
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
  }

  // pretty print
  show () { return `${this.premises+''} -> ${this.conclusion+''}` }

}

///////////////////////////////////////////////////////////////////////

module.exports.Step = Step
