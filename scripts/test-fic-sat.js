
const { satSolve } = require( '../dependencies/LSAT.js' )
const all = require( '../classes/all.js' )
const LC = all.LC

// Debugging tools...will be deleted later after the debugging phase.
// let dbgON = true
// const dbgLCs = lcs => lcs.map( x => x.toString() ).join( ', ' )
// const dbg = ( ...args ) => { if ( dbgON ) console.log( ...args ) }

// Look up a string in a list of strings.
// If it's there, get its index in response.
// If it's not there, append it to the list (modifying the list in place), and
// then return the index at which we just inserted it.
const catalogNumber = ( name, catalog ) => {
    let index = catalog.indexOf( name )
    if ( index == -1 ) {
        index = catalog.length
        catalog.push( name )
    }
    return index + 1
}
// We store CNFs as arrays, that is, f.ex., (x1 v...v xn)^(y1 v...v ym) becomes
// [[x1,...,xn],[y1,...,ym]].  To compute cnf1^cnf2 is therefore trivial; just
// concat the arrays.  However, to compute cnf1 v cnf2 is not trivial, because
// it requires (possibly) many applications of the distributive law, which can
// lead to exponential growth in the number of terms.  So we write a function
// that does it linearly instead with the technique of switch variables and
// equisatisfiability, a well-known technique not documented here.
const disjoinCNFs = ( cnf1, cnf2, catalog ) => {
    if ( cnf1.length == 1 )
        return cnf2.map( conjunct =>
            Array.from( new Set( cnf1[0].concat( conjunct ) ) ) )
    if ( cnf2.length == 1 )
        return cnf1.map( conjunct =>
            Array.from( new Set( cnf2[0].concat( conjunct ) ) ) )
    if ( cnf1.length == 2 && cnf2.length == 2 )
        return [ cnf1[0].concat( cnf2[0] ), cnf1[1].concat( cnf2[0] ),
                 cnf1[0].concat( cnf2[1] ), cnf1[1].concat( cnf2[1] ) ]
    const maxSwitchVar = catalog.filter( x => /^switch[0-9]+$/.test( x ) )
                                .map( x => parseInt( x.substring( 6 ) ) )
                                .reduce( Math.max, -1 )
    const newSwitchVar = `switch${maxSwitchVar+1}`
    index = catalogNumber( newSwitchVar, catalog ) // will be old catalog.length
    return [ ...cnf1.map( conjunct => conjunct.concat( [ newSwitchVar ] ) ),
             ...cnf2.map( conjunct => conjunct.concat( [ -newSwitchVar ] ) ) ]
}

// Construct a new atomic object, representing the proposition "true."
// parity : whether this sits in positive or negative position in the overall
//   sequent that will later be evaluated for satisfiability
// catalog : the catalog in which to index any variables in this expression's
//   context
const trueObj = ( parity, catalog ) => {
    return {
        text : 'True',
        parity : parity,
        cnf : parity ? [ ] : [ [ ] ],
        catalog : catalog,
        children : [ ]
    }
}
// Construct a new atomic object, representing the proposition "A."
// A : string name of LC identifier
// parity, catalog : same as above
const propObj = ( A, parity, catalog ) => {
    return {
        text : A,
        parity : parity,
        cnf : [ [ catalogNumber( A, catalog ) * ( parity ? 1 : -1 ) ] ],
        catalog : catalog,
        children : [ ]
    }
}
// Construct a new conditional object, representing "A implies B."
// A, B : other conditional or propositional objects, as constructed by condObj
//   or propObj
const condObj = ( A, B ) => {
    if ( A.parity == B.parity )
        throw 'Cannot make a conditional with the same parity in both children'
    return {
        text : `[${A.text},${B.text}]`,
        parity : B.parity,
        cnf : B.parity ? disjoinCNFs( A.cnf, B.cnf, A.catalog ) : A.cnf.concat( B.cnf ),
        catalog : A.catalog,
        children : [ A, B ]
    }
}
// How to tell if a propositional/conditional object is one or the other?
const isPropObj = obj => obj.children.length == 0
const isCondObj = obj => obj.children.length > 0
// How to tell if a propositional/conditional object is on a list?
// Or to add it if it's not?
const includesObj = ( array, obj ) => array.some( x => x.text == obj.text )
const withObj = ( array, obj, append = true ) =>
    includesObj( array, obj ) ? array :
    append                    ? array.concat( [ obj ] )
                              : [ obj ].concat( array )
// Check a propositional/conditional object for whether it is a tautology.
// This can only be done if the object's stored parity is negative,
// because then we can ask whether its CNF is satisfiable:
// unsatisfiable negated CNF == always satisfied positive CNF == tautology
const checkObj = obj => {
    if ( obj.parity )
        throw 'Cannot check if an object with positive parity is a tautology'
    return !satSolve( obj.catalog.length, obj.cnf )
}
// Check a sequent of propositional/conditional objects for whether it holds.
// This can be done on P_1,...,P_n,C iff the P_i all have parity true and the C
// has parity false, for a similar reason as in the previous function.
const checkSequent = ( ...objs ) => {
    const C = objs.pop()
    if ( C.parity || objs.some( P => !P.parity ) )
        throw 'Invalid parity/parities in the sequent to check'
    const cnf = objs.map( P => P.cnf )
                    .reduce( (a,b) => a.concat( b ), [ ] )
                    .concat( C.cnf )
    return !satSolve( C.catalog.length, cnf )
}

// Prepare an LC for FIC.
// 1. The result will be an array of new conditional objects, as defined above.
// 2. Each conditional object will have the form [A1,[A2,[A3,[...,[An,B]...]]]]
// 3. The original LC is IPL-equivalent to the conjunction of this array.
const prepare = ( lc, parity = false, index = 0, catalog = [ ] ) => {

    // Base case 1: atomic
    if ( lc.isAnActualStatement() || lc.isAnActualDeclaration() )
        return [ propObj( lc.toString().replace( /:/g, '' ), parity, catalog ) ]

    // To proceed, we need to know where the final *claim* child is indexed.
    const chi = lc.children()
    let lastClaimIndex = chi.length - 1
    while ( lastClaimIndex >= 0 && chi[lastClaimIndex].isAGiven )
        lastClaimIndex--

    // Base case 2: no claims left
    if ( index > lastClaimIndex )
        return [ trueObj( parity, catalog ) ]

    // Inductive case 1: one claim left
    if ( index == lastClaimIndex )
        return prepare( chi[index], parity, 0, catalog )

    // Inductive case 2: conjunction
    // chi[index] is a claim, so the env from chi[index] onwards is interpreted
    // as chi[index] ^ the rest.
    // No need to form any new CNFs because we are just concatenating arrays of
    // conditionals, not forming a containing expression for them.
    if ( chi[index].isAClaim ) {
        const first = prepare( chi[index], parity, 0, catalog )
        const rest = prepare( lc, parity, index+1, catalog )
        return first.concat( rest )
    }

    // Inductive case 3: conditional
    // chi[index] is a given, so the env from chi[index] onwards is interpreted
    // as chi[0] -> the rest.
    // For each result R in the recursive computation of the rest, form a new
    // result chi[0] -> R, except with chi[0] turned into a chain of arrows
    // based on a recursive call.
    const first = prepare( chi[index], !parity, 0, catalog )
    const rest = prepare( lc, parity, index+1, catalog )
    return rest.map( conclusion => {
        for ( let i = first.length - 1 ; i >= 0 ; i-- )
            conclusion = condObj( first[i], conclusion )
        return conclusion
    } )
}

// // Debugging helpers for testing:
// const showPreparation = ( obj, indent = 0 ) => {
//     let indentText = ''
//     while ( indentText.length < indent * 4 ) indentText += ' '
//     console.log( `${indentText}${obj.text} has CNF${obj.parity?"+":"-"} = ${JSON.stringify(obj.cnf)}` )
//     obj.children.forEach( child => showPreparation( child, indent + 1 ) )
// }
// const showPreparations = lc => {
//     console.log( `Preparation of ${lc.toString()} yields:` )
//     console.log( '[' )
//     prepare( lc ).forEach( p => showPreparation(p,1) )
//     console.log( ']' )
// }
// showPreparations( LC.fromString(
//     '{ :a b :{ :c b } d }'
// ) )

const fic = ( premises, conclusion ) => {
    const catalog = [ ]
    premises = premises.map( p => prepare( p, true, 0, catalog ) ).flat()
    conclusions = prepare( conclusion, false, 0, catalog )
    // dbg( 'FIC:', premises.map( p => p.text ), '|-', conclusions.map( c => c.text ) )
    const atomics = premises.filter( isPropObj )
    const arrows = premises.filter( isCondObj )
    // conclusions.forEach( concl =>
    //     dbg( 'FIC:', atomics.map( a => a.text ), arrows.map( a => a.text ),
    //         '|-', concl.text ) )
    return conclusions.every( C => simpleFic( atomics, arrows, C ) )
}

const simpleFic = (
    atomics, arrows, C,
    stop = arrows.length, useSAT = true, known = new Set()
    //, indent = 0
) => {
    // if ( indent > 10 ) throw 'uh-oh'
    // let tab = ''; while ( tab.length < 4*indent ) tab += ' '
    // dbg( tab, 'FIC:', atomics.map( a => a.text ), arrows.map( a => a.text ),
    //     '|-', C.text, `  @${stop}` )

    // don't bother with FIC if SAT says no...
    // ...unless the caller told us not to do this check.
    // (Recursive calls that already know the check will pass may tell us to
    // skip it to save time.)
    if ( useSAT ) {
        if ( !checkSequent( ...atomics, ...arrows, C ) ) {
            // dbg( tab, 'SAT SAID STOP!' )
            return false
        }
    }

    // If the conclusion is already known, just stop now.
    if ( known.has( C.text ) ) {
        // dbg( tab, 'already proven elsewhere:', C.text )
        return true
    }

    // apply the GR rule as many times as needed to achieve an atomic RHS
    while ( isCondObj( C ) ) {
        const A = C.children[0]
        if ( isPropObj( A ) ) {
            atomics = withObj( atomics, A )
        } else {
            arrows = withObj( arrows, A, false ) // false == prepend, not append
            stop++
        }
        C = C.children[1]
    }

    // dbg( tab, 'reduced:', atomics.map( a => a.text ), arrows.map( a => a.text ),
    //     '|-', C.text, `  @${stop}` )

    // C is now atomic.  if the S rule applies, done
    if ( includesObj( atomics, C ) ) {
        // dbg( tab, 'yes--S' )
        return true
    }

    // recursive applications of GL rule
    const provenInRecursion = new Set()
    for ( let i = 0 ; i < arrows.length ; i++ ) {
        if ( i >= stop ) break
        // dbg( tab, `consider ${i}. `, arrows[i].text )
        const Ai = arrows[i].children[0] // Ai in Ai->Bi
        const Bi = arrows[i].children[1] // Bi in Ai->Bi
        const provenInThisRecursion = new Set()
        if ( !simpleFic( atomics, arrows.without( i ), Ai, i, true,
                         provenInThisRecursion/*, indent+1*/ ) ) {
            Array.from( provenInThisRecursion ).forEach(
                proven => provenInRecursion.add( proven ) )
            continue
        }
        // dbg( tab, 'can prove LHS, so now try using the RHS:' )
        let arCopy = arrows.without( i )
        if ( isPropObj( Bi ) ) {
            return simpleFic(
                withObj( atomics, Bi ), arCopy, C,
                arrows.length, false, provenInRecursion/*, indent+1*/ )
        } else {
            return simpleFic(
                atomics, withObj( arCopy, Bi ), C,
                arrows.length, false, provenInRecursion/*, indent+1*/ )
        }
    }

    // dbg( tab, 'failed to prove:', atomics.map( a => a.text ),
    //     arrows.map( a => a.text ), '|-', C.text, `  @${stop}` )
    return false
}

// From here on down is just debugging/testing tools.

// const show = text => {
//     const x = LC.fromString( text )
//     console.log( 'x =', x.toString() )
//     // console.log( 'arrowForms(x) =', dbgLCs( arrowForms( x ) ) )
//     console.log( fic( [], x ) )
// }

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
    const ficTime = time( x => fic( [], x ), repeats )
    console.log( `\tTook ${ficTime}ms` )
    console.log( `Running ${repeats} SAT calls...` )
    const satTime = time( x => x.Validate(), repeats )
    console.log( `\tTook ${satTime}ms` )
    console.log( `Ratio: ${ficTime/satTime}` )
}
dbgON = false
compare( 10000 )
