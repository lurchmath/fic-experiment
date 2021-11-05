
const { satSolve } = require( '../dependencies/LSAT.js' )
const all = require( '../classes/all.js' )
const LC = all.LC
const Environment = all.Environment
const Statement = all.Statement

// Debugging tools...will be deleted later after the debugging phase.
let dbgON = true
const dbgLCs = lcs => lcs.map( x => x.toString() ).join( ', ' )
const dbg = ( ...args ) => { if ( dbgON ) console.log( ...args ) }

// To have some way to represent the propositional constant "true"
const constantTrue = LC.fromString( 'True' )

// Is it atomic, in the sense that validation cares about, that is, it's not an
// environment?
const isAtomic = lc => lc.isAnActualStatement() || lc.isAnActualDeclaration()
// What is the name of this LC for the purposes of a name catalog?
const catalogName = at => at.toString().replace( /:/g, '' )
// Give me the LC without its "given" flag (or just give me the LC as is, if it
// doesn't have a given flag).
const asClaim = lc => {
    if ( lc.isAClaim ) return lc
    const other = lc.copy()
    other.isAClaim = true
    return other
}
// Give me a copy of the LC with a "given" flag set to true.  Unlike the
// previous function, this makes a copy either way.
const givenCopy = lc => {
    const result = lc.copy()
    result.isAGiven = true
    return result
}

// Apply SAT to a CNF without needing to say how many variables it has.
// This will compute it for you.
const easySat = cnf => satSolve( Math.max( ...cnf.flat().map( Math.abs ) ), cnf )

// A sentence set is stored, for speedy membership testing, like this:
// {
//     n : {
//         m : [ /* all LCs with n nodes and depth m */ ],
//         ...
//     },
//     ...
// }
// The goal is to be able to test membership without having to do full tests of
// equality with very many different candidates.  So we sort the candidates by
// two simple metrics, to minimize the number of equality comparisons.
const depthOfLC = lc => isAtomic( lc ) ? 1 :
    1 + Math.max( ...lc.children().map( depthOfLC ) )
const nodesInLC = lc => isAtomic( lc ) ? 1 :
    1 + lc.children().map( nodesInLC ).reduce( (a,b)=>a+b, 0 )
const emptySentenceSet = () => { }
const addToSentenceSet = ( set, sentence ) => {
    const numNodes = nodesInLC( sentence )
    if ( !set.hasOwnProperty( numNodes ) ) set[numNodes] = { }
    const sameNumNodes = set[numNodes]
    const depth = depthOfLC( sentence )
    if ( !sameNumNodes.hasOwnProperty( depth ) ) sameNumNodes[depth] = [ ]
    const sameTwoMetrics = sameNumNodes[depth]
    if ( sameTwoMetrics.some( other => other.equals( sentence ) ) ) return
    sameTwoMetrics.push( sentence )
}
const sentenceSetContains = ( set, sentence ) => {
    const numNodes = nodesInLC( sentence )
    if ( !set.hasOwnProperty( numNodes ) ) return false
    const sameNumNodes = set[numNodes]
    const depth = depthOfLC( sentence )
    if ( !sameNumNodes.hasOwnProperty( depth ) ) return false
    const sameTwoMetrics = sameNumNodes[depth]
    return sameTwoMetrics.some( other => other.equals( sentence ) )
}
const extendSentenceSet = ( A, B ) => { // modifies A in place to be A union B
    for ( let numNodes in B )
        if ( B.hasOwnProperty( numNodes ) )
            B[numNodes].map( sentence => addToSentenceSet( A, sentence ) )
}

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

// Take an LC as input, plus some extra data, and return the same LC, with the
// extra data embedded in an attribute.
// withCNF(lc,true,cnf) == The cnf data is stored as the conjunctive normal form
//                         representation of the LC.
// withCNF(lc,false,cnf) == The cnf data is stored as the conjunctive normal
//                          form representation of the NEGATION of the LC.
const withCNF = ( lc, positive, cnf ) => {
    lc.setAttribute( positive ? 'CNF+' : 'CNF-', cnf )
    return lc
}
// Inverse of the previous, as follows: readCNF(withCNF(x,y,z),y) == z
const readCNF = ( lc, positive ) => lc.getAttribute( positive ? 'CNF+' : 'CNF-' )

// Curried form of a function that concats two arrays but preserves uniqueness.
const arrayUnion = array1 => array2 =>
    Array.from( new Set( array1.concat( array2 ) ) )
// Curried form of array append, returning new array
const arrayAppend = element => array => array.concat( [ element ] )
// We store CNFs as arrays, that is, f.ex., (x1 v...v xn)^(y1 v...v ym) becomes
// [[x1,...,xn],[y1,...,ym]].  To compute cnf1^cnf2 is therefore trivial; just
// concat the arrays.  However, to compute cnf1 v cnf2 is not trivial, because
// it requires (possibly) many applications of the distributive law, which can
// lead to exponential growth in the number of terms.  So we write a function
// that does it linearly instead with the technique of switch variables and
// equisatisfiability, a well-known technique not documented here.
const disjoin = ( cnf1, cnf2, catalog ) => {
    if ( cnf1.length == 1 )
        return cnf2.map( arrayUnion( cnf1[0] ) )
    if ( cnf2.length == 1 )
        return cnf1.map( arrayUnion( cnf2[0] ) )
    if ( cnf1.length == 2 && cnf2.length == 2 )
        return [ cnf1[0].concat( cnf2[0] ), cnf1[1].concat( cnf2[0] ),
                 cnf1[0].concat( cnf2[1] ), cnf1[1].concat( cnf2[1] ) ]
    const maxSwitchVar = catalog.filter( x => /^switch[0-9]+$/.test( x ) )
                                .map( x => parseInt( x.substring( 6 ) ) )
                                .reduce( Math.max, -1 )
    const switchVar = `switch${maxSwitchVar+1}`
    index = catalogNumber( switchVar, catalog ) // will be old catalog.length
    return [ ...cnf1.map( arrayAppend( switchVar ) ),
             ...cnf2.map( arrayAppend( -switchVar ) ) ]
}

// Prepare an LC for FIC.
// NOTE!!  This routine will modify the given LC, so pass a copy you don't need!
// This does several things:
// 1. The result will be an array of new LCs.
// 2. Each entry in the array will be an LC of the form
//    { :A1 { :A2 { :A3 { ... { :A4 B } } ... } } }
// 3. The original LC is IPL-equivalent to the conjunction of this array.
// 4. Each node in each of those trees will be decorated with either the CNF+ or
//    CNF- attribute.
//    * The CNF+ attribute is a CNF array ready for passing to satSolve to ask
//      if the LC is satisfiable.
//    * The CNF- attribute is the same, but it asks if the negation of the LC is
//      satisfiable.
const prepare = ( lc, positive = true, catalog = [ ] ) => {
    // If it's atomic, mark it with a CNF that says this one variable must hold,
    // or not hold, depending on the `positive` parameter.
    if ( isAtomic( lc ) ) {
        const index = catalogNumber( catalogName( lc ), catalog )
                    * ( positive ? 1 : -1 )
        return [ withCNF( lc, positive, [ [ index ] ] ) ]
    }
    // Compute the list of children and remove any trailing givens.
    const chi = lc.children()
    while ( chi.length > 0 && chi[chi.length-1].isAGiven ) chi.pop()
    // If there are no children, then this is an empty environment, which should
    // be treated as true (if positive) or false (if negative).
    if ( chi.length == 0 )
        return [
            positive ? withCNF( constantTrue.copy(), true, [ ] )
                     : withCNF( constantTrue.copy(), false, [ [ 1 ], [ -1 ] ] )
        ]
    // If there is one child, then just process it as if it were not wrapped in
    // this environment.
    if ( chi.length == 1 ) return prepare( chi[0], positive, catalog )
    // So know we know that there are at least two children.

    // Case 1: chi[0] is a claim, so the env is interpreted as chi[0] ^ ...
    // In this case, we are not trying to unite the recursive results,
    // but leaving them as multiple separate LCs.  Consequently, we do not
    // need to compute a big CNF for all of them together.
    if ( chi[0].isAClaim ) {
        const recur = prepare( lc.shift(), positive, catalog )
        const rest = prepare( lc, positive, catalog )
        return recur.concat( rest )
    }
    // Case 2: chi[0] is a given, so the env is interpreted as chi[0] -> ...
    // In this case, we will be creating multiple arrows, one chi[0] -> X for
    // each X in the recursive results for the other children.
    const recur = prepare( lc.shift(), !positive, catalog )
    const rest = prepare( lc, positive, catalog )
    return rest.map( conclusion => {
        // We must construct recur[0] -> ... -> recur[n-1] -> conclusion.
        // The hard part is decorating each subtree with the appropriate CNF.
        for ( let i = recur.length - 1 ; i >= 0 ; i-- ) {
            const premise = recur[i].copy()
            const premCNF = readCNF( premise, !positive )
            premise.isAGiven = true
            const concCNF = readCNF( conclusion, positive )
            const cnf = positive ? disjoin( premCNF, concCNF, catalog )
                                 : premCNF.concat( concCNF )
            // console.log( premCNF, `+${positive}+`, concCNF, '=', cnf )
            conclusion = withCNF(
                new Environment( premise, conclusion ), positive, cnf )
        }
        return conclusion
    } )
}

// Debugging helpers for testing:
const showPreparation = ( lc, indent = 0 ) => {
    const cnf = readCNF(lc,true) || readCNF(lc,false)
    const key = readCNF(lc,true) ? 'CNF+' : 'CNF-'
    let indentText = ''
    while ( indentText.length < indent * 4 ) indentText += ' '
    console.log( `${indentText}${lc.toString()} has ${key} = ${JSON.stringify(cnf)}` )
    lc.children().forEach( child => showPreparation( child, indent + 1 ) )
}
const showPreparations = lc => {
    console.log( `Preparation of ${lc.toString()} yields:` )
    console.log( '[' )
    prepare( lc.copy(), false ).forEach( p => showPreparation(p,1) )
    console.log( ']' )
}
// showPreparations( LC.fromString(
//     '{ :a b :{ :c b } d }'
// ) )
const checkSameValidity = text => {
    const lc = LC.fromString( text )
    const satResult = lc.Validate()
    // console.log( 'SAT says', lc.toString(),
    //              'is', satResult ? 'valid' : 'invalid' )
    // showPreparations( lc )
    const myResult = !prepare( lc.copy(), false ).some( clause => {
        const result = easySat( readCNF( clause, false ) )
        console.log( '    Negation of', clause.toString(),
                     'has CNF', readCNF( clause, false ),
                     '=>', result ? 'satisfiable' : 'not satisfiable' )
        // console.log( '\tThat is, the clause is',
        //              result ? 'not a tautology' : 'a tautology' )
        return result
    } )
    // console.log( 'All clauses together are', myResult ? 'valid' : 'invalid' )
    console.log( satResult == myResult ? '    PASS' : '>>> FAIL', '---', text,
                 '---', 'Validate:', satResult, 'Direct SAT:', myResult )
    console.log()
}
[
    '{ :a b :{ :c b } d }',
    '{ :a :b a }',
    '{ :a :b b }',
    '{ :a :b a b }',
    '{ :a :b c }',
    '{ :a :b a b c }',
    '{ :{ :a b } :{ :b c } { :a c } }',
    '{ :{ :{ :p q } p } p }'
].forEach( checkSameValidity )

// TO DO
// -----
// 3. No longer use { :A B } with a CNF attribute, instead using objects, as in
//    { expr:[A,B], str:"[A,B]", cnf:[...] }.  This will require altering many
//    of the routines above.
// 4. Update the two FIC routines below to be able to use these new structures,
//    calling satSolve() directly rather than through Validate().
// 5. Update the speed comparison.
// 6. Remove vestigial code.

// NOTE!!  The prepare() function above is not actually used for validation yet.
// The following tools are used instead.  We will be changing that soon.

const arrowForms = lc => {
    if ( isAtomic( lc ) ) return [ lc ]
    const chi = lc.children()
    if ( chi.length == 0 ) return [ constantTrue ]
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
    // dbg( 'FIC:', dbgLCs( premises ), '|-', dbgLCs( conclusions ) )
    const atomics = premises.filter( isAtomic ).map( catalogName )
    const arrows = premises.filter( x => !isAtomic( x ) )
    // console.log()
    // conclusions.forEach( concl =>
    //     dbg( 'FIC:', atomics,',',dbgLCs(arrows), '|-', dbgLCs([concl]) ) )
    return conclusions.every( C =>
        simpleFic( atomics, arrows, C, arrows.length, true ) )
}

const simpleFic = ( atomics, arrows, C, stop, useSAT, known/*, indent*/ ) => {
    // if ( typeof indent === 'undefined' ) indent = 0
    // if ( indent > 10 ) throw 'uh-oh'
    // let tab = ''; while ( tab.length < 4*indent ) tab += '    '
    // dbg( tab, 'simpleFIC:', atomics.length?atomics+',':'',
        // dbgLCs( arrows ), '|-', C.toString(), `  @${stop}` )

    // don't bother with FIC if SAT says no...
    // ...unless the caller told us not to do this check.
    // (Recursive calls that already know the check will pass may tell us to
    // skip it to save time.)
    if ( useSAT ) {
        const atomicLCs = atomics.map( a => {
            const result = new Statement()
            result.identifier = a
            result.isAGiven = true
            return result
        } )
        const toSat = new Environment(
            ...atomicLCs, ...arrows.map( givenCopy ), C.copy() )
        if ( !toSat.Validate() ) {
            // dbg( tab, 'SAT SAID STOP!' )
            return false
        }
    }

    // If the conclusion is already known, just stop now.
    if ( known && sentenceSetContains( known, C ) ) {
        // dbg( tab, 'already proven elsewhere:', C.toString() )
        return true
    }

    // apply the GR rule as many times as needed to achieve an atomic RHS
    // const needsReducing = ( C instanceof Environment )
    while ( C instanceof Environment ) {
        const A = C.children()[0] // A in { :A B }
        const B = C.children()[1] // B in { :A B }
        if ( isAtomic( A ) ) {
            const cA = catalogName( A )
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
    if ( atomics.includes( catalogName( C ) ) ) {
        // dbg( tab, 'yes--S' )
        return true
    }

    // recursive applications of GL rule, not yet smartly
    const provenInRecursion = emptySentenceSet()
    for ( let i = 0 ; i < arrows.length ; i++ ) {
        if ( i >= stop ) break
        const Ai = asClaim( arrows[i].children()[0] ) // Ai in { :Ai Bi }
        const Bi = arrows[i].children()[1] // Bi in { :Ai Bi }
        // dbg( tab, `consider ${i}. `, arrows[i].toString() )
        const provenInThisRecursion = emptySentenceSet()
        if ( !simpleFic( atomics, arrows.without( i ), Ai, i, true,
                         provenInThisRecursion, /*, indent+1*/ ) ) {
            extendSentenceSet( provenInRecursion, provenInThisRecursion )
            continue
        }
        // dbg( tab, 'can prove LHS, so now try using the RHS:' )
        let arCopy = arrows.without( i )
        if ( isAtomic( Bi ) ) {
            const cBi = catalogName( Bi )
            const atCopy = atomics.includes( cBi ) ? atomics : atomics.concat( [ cBi ] )
            const withRHS = simpleFic( atCopy, arCopy, C, arrows.length, false,
                                       provenInRecursion, /*, indent+1*/ )
            return withRHS // if ( withRHS ) return true
        } else {
            arCopy.push( Bi )
            const withRHS = simpleFic( atomics, arCopy, C, arrows.length, false,
                                       provenInRecursion, /*, indent+1*/ )
            return withRHS // if ( withRHS ) return true
        }
    }

    // dbg( tab, 'failed to prove:', atomics.length?atomics+',':'',
    //     dbgLCs( arrows ), '|-', C.toString(), `  @${stop}` )
    return false
}

// From here on down is just debugging/testing tools.

const show = text => {
    const x = LC.fromString( text )
    console.log( 'x =', x.toString() )
    // console.log( 'arrowForms(x) =', dbgLCs( arrowForms( x ) ) )
    console.log( fic( [], x ) )
}

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
// compare( 1000 )
