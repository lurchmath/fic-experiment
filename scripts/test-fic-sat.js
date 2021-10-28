
const all = require( '../classes/all.js' )
const LC = all.LC
const Environment = all.Environment
const Statement = all.Statement

const constantTrue = LC.fromString( 'True' ) // ???

let dbgON = true
const dbgLCs = lcs => lcs.map( x => x.toString() ).join( ', ' )
const dbg = ( ...args ) => { if ( dbgON ) console.log( ...args ) }

const isAtomic = lc => lc.isAnActualStatement() || lc.isAnActualDeclaration()
const catName = at => at.toString().replace( /:/g, '' )
const asClaim = lc => {
    if ( lc.isAClaim ) return lc
    const other = lc.copy()
    other.isAClaim = true
    return other
}
const givenCopy = lc => {
    const result = lc.copy()
    result.isAGiven = true
    return result
}

const arrowForms = lc => {
    if ( isAtomic( lc ) ) return [ lc ]
    const chi = lc.children()
    if ( chi.length == 0 ) return constantTrue
    const recur = arrowForms( chi[0] )
    if ( chi.length == 1 ) return recur
    const rest = arrowForms( new Environment( ...chi.slice( 1 ).map( c => c.copy() ) ) )
    if ( chi[0].isAClaim ) return recur.concat( rest )
    recur.forEach( x => x.isAGiven = true )
    const wrap = ( outsides, inside ) =>
        outsides.length == 0 ? inside :
        wrap( outsides.slice( 0, outsides.length-1 ),
            new Environment( outsides[outsides.length-1].copy(), inside ) )
    return rest.map( f => wrap( recur, f ) )
}
const fic = ( premises, conclusion ) => {
    premises = premises.map( arrowForms ).flat()
    conclusions = arrowForms( conclusion )
    dbg( 'FIC:', dbgLCs( premises ), '|-', dbgLCs( conclusions ) )
    const atomics = premises.filter( isAtomic ).map( catName )
    const arrows = premises.filter( x => !isAtomic( x ) )
    return conclusions.every( C => simpleFic( atomics, arrows, C, arrows.length ) )
}
const simpleFic = ( atomics, arrows, C, stop/*, indent*/ ) => {
    // if ( typeof indent === 'undefined' ) indent = 0
    // if ( indent > 10 ) throw 'uh-oh'
    // let tab = ''; while ( tab.length < 4*indent ) tab += '    '
    // dbg( tab, 'simpleFIC:', atomics.length?atomics+',':'',
        // dbgLCs( arrows ), '|-', C.toString(), `  @${stop}` )
    // don't bother with FIC if SAT says no
    const atomicLCs = atomics.map( a => {
        const result = new Statement()
        result.identifier = a
        result.isAGiven = true
        return result
    } )
    const toSat = new Environment( ...atomicLCs, ...arrows.map( givenCopy ), C.copy() )
    if ( !toSat.Validate() ) {
        // dbg( tab, 'SAT SAID STOP!' )
        return false
    }
    // apply the GR rule as many times as needed to achieve an atomic RHS
    // const needsReducing = ( C instanceof Environment )
    while ( C instanceof Environment ) {
        const A = C.children()[0] // A in { :A B }
        const B = C.children()[1] // B in { :A B }
        if ( isAtomic( A ) ) {
            const cA = catName( A )
            if ( !atomics.includes( cA ) ) atomics.push( cA )
        } else {
            arrows.unshift( A )
            stop++
        }
        C = B
    }
    // if ( needsReducing )
    //     dbg( tab, 'reduced:', atomics.length?atomics+',':'',
    //         dbgLCs( arrows ), '|-', C.toString(), `  @${stop}` )
    // C is now atomic.  if the S rule applies, done
    if ( atomics.includes( catName( C ) ) ) {
        // dbg( tab, 'yes--S' )
        return true
    }
    // recursive applications of GL rule, not yet smartly
    for ( let i = 0 ; i < arrows.length ; i++ ) {
        if ( i >= stop ) break
        const Ai = asClaim( arrows[i].children()[0] ) // Ai in { :Ai Bi }
        const Bi = arrows[i].children()[1] // Bi in { :Ai Bi }
        // dbg( tab, `consider ${i}. `, arrows[i].toString() )
        if ( !simpleFic( atomics, arrows.without( i ), Ai, i/*, indent+1*/ ) ) continue
        // dbg( tab, 'can prove LHS, so now try using the RHS:' )
        let arCopy = arrows.without( i )
        if ( isAtomic( Bi ) ) {
            const cBi = catName( Bi )
            const atCopy = atomics.includes( cBi ) ? atomics : atomics.concat( [ cBi ] )
            const withRHS = simpleFic( atCopy, arCopy, C, arrows.length/*, indent+1*/ )
            return withRHS // if ( withRHS ) return true
        } else {
            arCopy.push( Bi )
            const withRHS = simpleFic( atomics, arCopy, C, arrows.length/*, indent+1*/ )
            return withRHS // if ( withRHS ) return true
        }
    }
    // dbg( tab, 'failed to prove:', atomics.length?atomics+',':'',
    //     dbgLCs( arrows ), '|-', C.toString(), `  @${stop}` )
    return false
}

const show = text => {
    const x = LC.fromString( text )
    console.log( 'x =', x.toString() )
    // console.log( 'arrowForms(x) =', dbgLCs( arrowForms( x ) ) )
    console.log( fic( [], x ) )
}

const many = [
    '{ :{ :a b :{ :c d e } f g } { :a :d :e g } }',
    '{ :{ :a b :{ :c d e } f g } { :a :d e g } }',
    '{ :{ :a b :{ :c d e } f g } { :a d e g } }'
].map( LC.fromString )

dbgON = false
const time = ( validator, repeats ) => {
    const start = new Date
    for ( let i = 0 ; i < repeats ; i++ )
        many.forEach( validator )
    return new Date - start
}
const compare = repeats => {
    console.log( `Running ${repeats} FIC calls...` )
    const ficTime = time( x => fic( [], x ), repeats )
    console.log( `\tTook ${ficTime}ms` )
    console.log( `Running ${repeats} SAT calls...` )
    const satTime = time( x => x.Validate(), repeats )
    console.log( `\tTook ${satTime}ms` )
    console.log( `Ratio: ${ficTime/satTime}` )
}
compare( 1000 )
