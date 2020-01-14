
const { OM } = require( '../dependencies/openmath.js' )
const { LC, Statement, Environment } = require( '../classes/lc.js' )

console.log( 'Checking to be sure all defined classes exist...' )
console.log( 'LC?', !!LC )
console.log( 'Statement?', !!Statement )
console.log( 'Environment?', !!Environment )

console.log( 'Checking to be sure I can build instances...' )
console.log( 'LC?', !!new LC() )
console.log( 'Statement?', !!new Statement() )
console.log( 'Environment?', !!new Environment() )

console.log( 'Checking to be sure I can build trees...' )
console.log( 'LC in LC?', ''+new LC( new LC() ) )
console.log( 'LCs in LC?', ''+new LC( new LC(), new LC() ) )
console.log( 'Statement in Statement?',
             ''+new Statement( new Statement() ) )
console.log( 'Statements in Statement?',
             ''+new Statement( new Statement(), new Statement() ) )
console.log( 'Environment in Environment?',
             ''+new Environment( new Environment() ) )
console.log( 'Environment in Environment?',
             ''+new Environment( new Environment(), new Environment() ) )
console.log( 'Statement in Environment?',
             ''+new Environment( new Statement() ) )
console.log( 'Environment in Statement?',
             ''+new Statement( new Environment() ) )
var R = new Statement()
R.identifier = 'R'
var S = new Statement()
S.identifier = 'S'
var T = new Statement( R, S )
T.identifier = 'T'
console.log( 'Appearance of a Statement tree with identifiers:', ''+T )

console.log( 'Verifying that these things don\'t have identifiers by default...' )
console.log( 'LC:', new LC().identifier )
console.log( 'Statement:', new Statement().identifier )
console.log( 'Environment:', new Environment().identifier )
console.log( 'Verifying that these things aren\'t quantifiers by default...' )
console.log( 'LC:', new LC().isAQuantifier )
console.log( 'Statement:', new Statement().isAQuantifier )
console.log( 'Environment:', new Environment().isAQuantifier )

console.log( 'Verify that we can play with given/claim status...' )
console.log( 'Default given value:', new LC().isAGiven )
console.log( 'Default claim value:', new LC().isAClaim )
console.log( 'Appearance:', ''+new LC() )
var tmp = new LC()
console.log( 'Making it a given...' )
tmp.isAGiven = true
console.log( 'Now the given value:', tmp.isAGiven )
console.log( 'Now the claim value:', tmp.isAClaim )
console.log( 'Appearance:', ''+tmp )
console.log( 'Making it a claim...' )
tmp.isAClaim = true
console.log( 'Now the given value:', tmp.isAGiven )
console.log( 'Now the claim value:', tmp.isAClaim )
console.log( 'Appearance:', ''+tmp )
