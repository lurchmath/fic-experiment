
const { LC } = require( '../classes/all.js' )

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
    console.log( `Running ${repeats} FIC calls...` )
    const ficTime = time( x => x.IPLValidate(false), repeats )
    console.log( `\tTook ${ficTime}ms` )
    console.log( `Running ${repeats} SAT calls...` )
    const satTime = time( x => x.Validate(), repeats )
    console.log( `\tTook ${satTime}ms` )
    console.log( `Ratio: ${ficTime/satTime}` )
}
// compare( 10000 )

[
    '{ :{ :a b :{ :c d e } f g } { :a :d b g } }',
    '{ :{ :{ :p q } p } p }'
].forEach( text => {
    const foo = LC.fromString( text )
    foo.IPLValidate()
    foo.show()
} )
