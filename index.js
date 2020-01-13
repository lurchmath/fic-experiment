
const { OM } = require( './dependencies/openmath.js' )
const { LC, Statement, Environment } = require( './classes/lc.js' )

console.log( 'Checking to be sure all defined classes exist...' )
console.log( 'LC?', !!LC )
console.log( 'Statement?', !!Statement )
console.log( 'Environment?', !!Environment )

console.log( 'Checking to be sure I can build instances...' )
console.log( 'LC?', !!new LC() )
console.log( 'Statement?', !!new Statement() )
console.log( 'Environment?', !!new Environment() )

console.log( 'Checking to be sure I can build trees...' )
console.log( 'LC in LC?', new LC( new LC() ).children().length )
console.log( 'LCs in LC?', new LC( new LC(), new LC() ).children().length )
console.log( 'Statement in Statement?',
             new Statement( new Statement() ).children().length )
console.log( 'Statements in Statement?',
             new Statement( new Statement(), new Statement() ).children().length )
console.log( 'Environment in Environment?',
             new Environment( new Environment() ).children().length )
console.log( 'Environment in Environment?',
             new Environment( new Environment(), new Environment() ).children().length )
console.log( 'Statement in Environment?',
             new Environment( new Statement() ).children().length )
console.log( 'Environment in Statement?',
             new Statement( new Environment() ).children().length )
