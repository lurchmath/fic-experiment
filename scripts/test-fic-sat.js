
const { LC, lc, Environment, Flat, PreppedPropForm } = require( '../classes/all.js' )
const { EvenMoreLurchstr } = require( '../test/data/EvenMoreLurch.js' )
const fixLineEndingsForUnix = EvenMoreLurchstr.replace( /\r\n/g, '\n' )
const biggie = lc( fixLineEndingsForUnix )

const many = [
    // LC.fromString( '{ :{ :a b :{ :c d e } f g } { :a :d :e g } }' ), true,
    // LC.fromString( '{ :{ :a b :{ :c d e } f g } { :a :d e g } }' ), false,
    // LC.fromString( '{ :{ :a b :{ :c d e } f g } { :a d e g } }' ), false,
    biggie, true
]
const time = ( validator, repeats ) => {
    const start = new Date
    for ( let i = 0 ; i < repeats ; i++ ) {
        for ( let j = 0 ; j < many.length - 1 ; j += 2 ) {
            const result = validator( many[j] )
            if ( result != many[j+1] )
                throw `Error:\n\tRan: ${validator}\n\tOn: ${many[j]}\n\tWrong answer: ${result}\n\tShould be: ${many[j+1]}`
        }
    }
    return new Date - start
}
const compare = repeats => {
    // console.log( `Running ${repeats} IPL calls...` )
    // const time1 = time( x => x.IPLValidate(), repeats )
    // console.log( `\tTook ${time1}ms` )
    console.log( `Running ${repeats} CPL calls...` )
    const time1 = time( x => x.CPLValidate([x.child(240)]), repeats )
    console.log( `\tTook ${time1}ms` )
    console.log( `Running ${repeats} SAT calls...` )
    const time2 = time( x => x.Validate([x.child(240)]), repeats )
    console.log( `\tTook ${time2}ms` )
    console.log( `Ratio: ${time1/time2}` )
}
// compare( 100 );

const outer = LC.fromString( '{ :{ :a b :{ :c d e } f g } { :a :d e g } }' )
const addrs = [ [], [1,2], [1,3] ]
addrs.map( x => console.log( `${outer.index(x)}` ) )
let clone
clone = outer.copy() ; clone.CPLValidate( addrs.map( addr => clone.index( addr ) ) ) ; clone.show()
clone = outer.copy() ; clone.Validate(    addrs.map( addr => clone.index( addr ) ) ) ; clone.show()

/////////////////////////////////////////////////////////////////////////////////////

// const testLC = LC.fromString( '{ { :v1 v2 } :{ v3 v4 } v5 { :v1 v3 v5 } }' )
// console.log( `${testLC}` )
// const testResult = PreppedPropForm.fromTargets( testLC, [
//     [0,1],    // first v2, a conclusion
//     [1,0],    // first v3, not a conclusion
//     [2],      // first v5, a conclusion
//     [0,0],    // first v1, not a conclusion
//     [3],      // last env, with two conclusion, v3 and v5
//     [3,2]     // repeat of the same v5
// ].map( address => testLC.index( address ) ) )
// testResult.map( tr => console.log( `${tr}` ) )
