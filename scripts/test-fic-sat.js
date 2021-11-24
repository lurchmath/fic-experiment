
const { LC, lc, Environment, Flat } = require( '../classes/all.js' )
const { EvenMoreLurchstr } = require( '../test/data/EvenMoreLurch.js' )
const fixLineEndingsForUnix = EvenMoreLurchstr.replace( /\r\n/g, '\n' )
const biggie = lc( fixLineEndingsForUnix )

const many = [
    LC.fromString( '{ :{ :a b :{ :c d e } f g } { :a :d :e g } }' ), true,
    LC.fromString( '{ :{ :a b :{ :c d e } f g } { :a :d e g } }' ), false,
    LC.fromString( '{ :{ :a b :{ :c d e } f g } { :a d e g } }' ), false
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
    console.log( `Running ${repeats} IPL calls...` )
    const time1 = time( x => x.IPLValidate(), repeats )
    console.log( `\tTook ${time1}ms` )
    // console.log( `Running ${repeats} CPL calls...` )
    // const time1 = time( x => x.CPLValidate(), repeats )
    // console.log( `\tTook ${time1}ms` )
    console.log( `Running ${repeats} SAT calls...` )
    const time2 = time( x => x.Validate(), repeats )
    console.log( `\tTook ${time2}ms` )
    console.log( `Ratio: ${time1/time2}` )
}
// compare( 10000 );

// [
//     '{ :{ :a b :{ :c d e } f g } { :a :d b g } }',
//     '{ :{ :{ :p q } p } p }'
// ].forEach( text => {
//     const foo = LC.fromString( text )
//     foo.IPLValidate( [ foo, ...foo.conclusions() ] )
//     foo.CPLValidate( [ foo, ...foo.conclusions() ] )
//     foo.show()
// } )

// const { MPCPFstr } = require( '../test/data/MPCPFexample.js' )
// let MPCPF = lc(MPCPFstr.replace( /\r\n/g, '\n' ))
// MPCPF.show()
// // MPCPF.Validate(MPCPF.conclusions())
// // MPCPF.CPLValidate(MPCPF.conclusions())
// MPCPF.IPLValidate(MPCPF.conclusions())
// MPCPF.show()

// let L = lc( `{ :A B A }` )
// L.show(Flat)
// L.CPLValidate(L.conclusions())
// L.show(Flat)
// L.Validate(L.conclusions())
// L.show(Flat)

const n = biggie.children().length
for ( let i = 0 ; i < n ; i++ ) {
    const segment = biggie.copy()
    while ( segment.children().length > i + 1 ) segment.last.removeFromParent()
    console.log( `Testing up to child ${i+1}/${n}...` )
    const resultV = segment.Validate()
    const resultC = segment.CPLValidate()
    if ( resultV !== resultC ) console.log( `V!==C@${i+1}/${n} ${segment.last}` )
}
console.log( 'Done.' )
